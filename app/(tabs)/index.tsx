import { Ionicons } from "@expo/vector-icons";
import { differenceInDays, format } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Animated,
  Image,
  ImageBackground,
  Linking,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyStateTrips } from "../../components/EmptyStateTrips";
import HotelCard from "../../components/HotelCard";
import { WorldMapPin } from "../../components/WorldMapPin";
import { useCountdown } from "../../hooks/useCountdown";
import { useTrips } from "../../hooks/useTrips";
import i18n from "../../i18n";
import {
  colors,
  dark as DARK,
  getKnownTripImage,
  getTripImage,
  radius,
  shadow,
  spacing,
} from "../../theme";
import { CheckItem } from "../../types";
import { formatMoney, sumExpenses } from "../../utils/currency";
import { searchPlaces } from "../../utils/geocode";
import { searchPlacePhotos } from "../../utils/unsplash";
import { getCurrentUserId, uploadImage } from "../../utils/supabase";
import { getVisaWarnings } from "../../utils/visa";

/* ─── category pill colors ───────────────────────────────────── */

const CAT_STYLE: Record<string, { bg: string; text: string; labelKey: string }> = {
  doc: { bg: DARK.green, text: DARK.ink, labelKey: "categoryDocs" },
  fly: { bg: DARK.blue, text: DARK.ink, labelKey: "categoryFlight" },
  stay: { bg: DARK.yellow, text: DARK.ink, labelKey: "categoryHotel" },
  look: { bg: DARK.pink, text: DARK.ink, labelKey: "categoryLooks" },
  misc: { bg: "rgba(255,255,255,0.08)", text: DARK.muted, labelKey: "categoryOther" },
  visa: { bg: DARK.yellow, text: DARK.ink, labelKey: "categoryVisa" },
};

/* ─── small reusable pieces ─────────────────────────────────── */

function CdBox({ value, label }: { value: number; label: string }) {
  return (
    <View style={s.cdUnit}>
      <Text style={s.cdNum}>{String(value).padStart(2, "0")}</Text>
      <Text style={s.cdLabel}>{label}</Text>
    </View>
  );
}

function SectionAddButton({
  onPress,
  icon,
  color,
  iconColor = DARK.ink,
}: {
  onPress: () => void;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  iconColor?: string;
}) {
  return (
    <TouchableOpacity
      style={[s.sectionAddBtn, { backgroundColor: color }]}
      onPress={onPress}
      hitSlop={8}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={17} color={iconColor} />
    </TouchableOpacity>
  );
}

function StatCard({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={[s.statCard, { backgroundColor: color }]}>
      <Text style={s.statNum}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function CheckRow({
  item,
  onToggle,
  onDelete,
}: {
  item: CheckItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation("home");
  const cs = CAT_STYLE[item.cat] ?? CAT_STYLE.misc;
  return (
    <View style={s.checkRow}>
      <TouchableOpacity
        onPress={onToggle}
        hitSlop={8}
        style={s.checkCircleWrap}
      >
        <View style={[s.checkCircle, item.done && s.checkCircleDone]}>
          {item.done && (
            <Ionicons name="checkmark" size={11} color={DARK.ink} />
          )}
        </View>
      </TouchableOpacity>
      <Text
        style={[s.checkText, item.done && s.checkTextDone]}
        numberOfLines={2}
      >
        {item.text}
      </Text>
      <View style={[s.catPill, { backgroundColor: cs.bg }]}>
        <Text style={[s.catPillText, { color: cs.text }]}>{t(cs.labelKey)}</Text>
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={8} style={s.deleteBtn}>
        <Ionicons name="close" size={12} color={DARK.muted} />
      </TouchableOpacity>
    </View>
  );
}

/* ─── main screen ────────────────────────────────────────────── */

export default function HomeScreen() {
  const nav = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation("home");

  const {
    trips,
    activeTrip,
    updateTrip,
    activeChecks,
    toggleCheck,
    addCheck,
    deleteCheck,
  } = useTrips();
  const cd = useCountdown(activeTrip?.depart);

  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [showEditMenu, setShowEditMenu] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Completa em segundo plano o que a home precisa e as tabelas fixas não
  // cobrem, numa única updateTrip (duas chamadas seguidas usariam a mesma
  // lista de trips e a segunda desfaria a primeira):
  // - coordenadas dos destinos fora de DEST_COORDS, pro pin do mapa (mesmo
  //   destinationCoords que o roteiro preenche);
  // - foto do primeiro destino no Unsplash, quando não há capa escolhida
  //   nem foto na tabela DESTINATION_IMAGES.
  useEffect(() => {
    if (!activeTrip) return;
    const destinations: string[] = activeTrip.destinations ?? [];
    const missingCoords = destinations.filter(
      (d) => !activeTrip.destinationCoords?.[d],
    );
    const needsCover =
      destinations.length > 0 &&
      !activeTrip.coverImage &&
      activeTrip.autoCoverFor !== destinations[0] &&
      !getKnownTripImage(activeTrip);
    if (missingCoords.length === 0 && !needsCover) return;

    let cancelled = false;
    (async () => {
      const coordUpdates: Record<string, { lat: number; lon: number; country?: string }> = {};
      for (const dest of missingCoords) {
        const [best] = await searchPlaces(dest, 1);
        if (best) coordUpdates[dest] = { lat: best.lat, lon: best.lon, country: best.country };
      }

      let autoCover: string | undefined;
      if (needsCover) {
        try {
          const [photo] = await searchPlacePhotos(destinations[0], 1);
          autoCover = photo?.urls.regular;
        } catch {}
      }

      if (cancelled) return;
      const data: Record<string, unknown> = {};
      if (Object.keys(coordUpdates).length > 0) {
        data.destinationCoords = { ...(activeTrip.destinationCoords ?? {}), ...coordUpdates };
      }
      if (autoCover) {
        data.autoCover = autoCover;
        data.autoCoverFor = destinations[0];
      }
      if (Object.keys(data).length > 0) await updateTrip(activeTrip.id, data);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrip?.id, (activeTrip?.destinations ?? []).join("|")]);

  if (trips.length === 0) {
    return <EmptyStateTrips />;
  }

  const doneChecks = activeChecks.filter((c: CheckItem) => c.done).length;
  const nights = activeTrip
    ? Math.max(
        0,
        differenceInDays(
          new Date(activeTrip.ret + "T00:00:00"),
          new Date(activeTrip.depart + "T00:00:00"),
        ),
      )
    : 0;

  const coverUri = activeTrip ? getTripImage(activeTrip) : null;

  const budgetCurrency = activeTrip?.budgetCurrency ?? "BRL";
  const budgetSpent = sumExpenses(activeTrip?.expenses ?? [], budgetCurrency);

  const formatDate = (s: string) => {
    try {
      const locale = i18n.language === "en" ? enUS : ptBR;
      const pattern = i18n.language === "en" ? "d MMM" : "d 'de' MMM";
      return format(new Date(s + "T00:00:00"), pattern, { locale });
    } catch {
      return s;
    }
  };

  const segments =
    activeTrip?.segments ??
    (activeTrip
      ? [{ from: "???", fromCity: "Origem", to: "???", toCity: "Destino" }]
      : []);

  const visaWarnings = activeTrip
    ? getVisaWarnings(
        activeTrip.destinations ?? [],
        activeTrip.origin ?? "Brasil",
      )
    : [];

  // Fallback para hotéis sem checkIn/checkOut próprios (criados antes dessa
  // feature): divide os dias da viagem igualmente entre os hotéis.
  const hotelDates = (
    index: number,
    total: number,
  ): { checkIn: string; checkOut: string } => {
    if (!activeTrip) return { checkIn: "", checkOut: "" };
    if (total <= 1)
      return { checkIn: activeTrip.depart, checkOut: activeTrip.ret };
    const dep = new Date(activeTrip.depart + "T00:00:00");
    const ret = new Date(activeTrip.ret + "T00:00:00");
    const totalDays = differenceInDays(ret, dep);
    const perHotel = Math.floor(totalDays / total);
    const checkInDate = new Date(dep);
    checkInDate.setDate(checkInDate.getDate() + index * perHotel);
    const checkOutDate = new Date(checkInDate);
    if (index === total - 1) {
      checkOutDate.setTime(ret.getTime());
    } else {
      checkOutDate.setDate(checkOutDate.getDate() + perHotel);
    }
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    return { checkIn: fmt(checkInDate), checkOut: fmt(checkOutDate) };
  };

  const handleAddItem = async () => {
    const text = newItemText.trim();
    if (!text) return;
    await addCheck({ text, cat: "misc" });
    setNewItemText("");
    setShowAddItem(false);
  };

  const handleChangeCover = async () => {
    if (!activeTrip) return;
    try {
      const { status, canAskAgain } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("permissionRequiredTitle"),
          canAskAgain
            ? t("photoPermissionHint")
            : t("photoPermissionDenied"),
          canAskAgain
            ? [{ text: t("ok") }]
            : [
                { text: t("cancel"), style: "cancel" },
                {
                  text: t("openSettings"),
                  onPress: () => Linking.openSettings(),
                },
              ],
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.85,
      });
      if (result.canceled) return;

      const localUri = result.assets[0].uri;
      const userId = await getCurrentUserId();
      const uploadedUrl = userId
        ? await uploadImage(localUri, `${userId}/covers/${activeTrip.id}.jpg`)
        : null;
      // O caminho de upload é sempre o mesmo (upsert), então a URL pública
      // não muda entre trocas de capa — sem um cache-buster, o Image cacheado
      // (app e/ou CDN) continua mostrando a foto antiga mesmo após o upload.
      const coverImage = uploadedUrl
        ? `${uploadedUrl}?v=${Date.now()}`
        : localUri;
      await updateTrip(activeTrip.id, { coverImage });
    } catch (err) {
      console.error("Erro ao trocar capa da viagem:", err);
      Alert.alert(t("changeCoverErrorTitle"), t("tryAgain"));
    }
  };

  const heroContent = (
    <>
      <LinearGradient
        colors={[
          "rgba(5,5,5,0.10)",
          "rgba(5,5,5,0.55)",
          "rgba(5,5,5,0.88)",
          "rgba(5,5,5,0.97)",
        ]}
        locations={[0, 0.35, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.dots} pointerEvents="none" />
      <View
        style={[s.heroInner, { paddingTop: insets.top + 6, marginTop: -60 }]}
      >
        <View style={s.heroTopRow}>
          <View>
            <Text style={s.heroEyebrow}>{t("heroEyebrow")}</Text>
            <Text style={s.heroTitle} numberOfLines={1}>
              {activeTrip?.name ?? t("addTripFallback")}
            </Text>
            {activeTrip && (
              <Text style={s.heroSub}>
                {formatDate(activeTrip.depart)} – {formatDate(activeTrip.ret)}
                {"  ·  "}
                {t("nights", { count: nights })}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={s.editBtn}
            onPress={() =>
              activeTrip ? setShowEditMenu(true) : nav.push("/trip-form")
            }
            activeOpacity={0.8}
          >
            {activeTrip ? (
              <Image
                source={require("../../assets/images/icon-edit.png")}
                style={{ width: 18, height: 18 }}
              />
            ) : (
              <Ionicons name="add" size={15} color={DARK.ink} />
            )}
          </TouchableOpacity>
        </View>

        {/* {segments.length > 0 && <PlaneRoute segments={segments} />} */}

        {activeTrip && (
          <View style={s.cdPill}>
            <CdBox value={cd.days} label={t("days")} />
            <Text style={s.cdSep}>:</Text>
            <CdBox value={cd.hours} label={t("hours")} />
            <Text style={s.cdSep}>:</Text>
            <CdBox value={cd.minutes} label={t("minutes")} />
            <Text style={s.cdSep}>:</Text>
            <CdBox value={cd.seconds} label={t("seconds")} />
          </View>
        )}
      </View>
    </>
  );

  return (
    <View style={s.root}>
      <View style={s.heroWrap}>
        <View style={[StyleSheet.absoluteFill, s.heroImageClip]}>
          {coverUri ? (
            <ImageBackground
              source={{ uri: coverUri }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: DARK.surface },
              ]}
            />
          )}
        </View>
        {heroContent}
      </View>

      <Animated.ScrollView
        style={s.sheet}
        contentContainerStyle={s.sheetContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        <View style={s.statRow}>
          <StatCard
            value={String(activeTrip?.destinations?.length ?? 0)}
            label={t("destinations")}
            color={DARK.green}
          />
          <StatCard value={String(nights)} label={t("nightsLabel")} color={DARK.pink} />
          <StatCard
            value={
              activeChecks.length > 0
                ? `${doneChecks}/${activeChecks.length}`
                : "–"
            }
            label={t("checklist")}
            color={DARK.blue}
          />
        </View>

        {activeTrip && (activeTrip.destinations?.length ?? 0) > 0 && (
          <>
            <Text style={s.secLabel}>{t("destinationOnMap")}</Text>
            <WorldMapPin
              destinations={activeTrip.destinations ?? []}
              destinationCoords={activeTrip.destinationCoords}
            />
          </>
        )}

        {activeTrip && (
          <>
            <Text style={s.secLabel}>{t("budget")}</Text>
            <TouchableOpacity
              style={s.budgetCard}
              onPress={() => nav.push({ pathname: "/budget" })}
              activeOpacity={0.85}
            >
              {activeTrip.budgetTotal ? (
                <View style={{ flex: 1 }}>
                  <View style={s.budgetCardRow}>
                    <Text style={s.budgetCardSpent}>
                      {formatMoney(budgetSpent, budgetCurrency)}
                    </Text>
                    <Text style={s.budgetCardTotal}>
                      {" "}
                      / {formatMoney(activeTrip.budgetTotal, budgetCurrency)}
                    </Text>
                  </View>
                  <View style={s.budgetTrack}>
                    <View
                      style={[
                        s.budgetFill,
                        {
                          width: `${Math.min(1, budgetSpent / activeTrip.budgetTotal) * 100}%`,
                          backgroundColor:
                            budgetSpent > activeTrip.budgetTotal
                              ? DARK.pink
                              : DARK.lime,
                        },
                      ]}
                    />
                  </View>
                </View>
              ) : (
                <View style={s.budgetCardEmptyRow}>
                  <Image
                    source={require("../../assets/images/icon-coins.png")}
                    style={s.budgetCardIcon}
                  />
                  <Text style={s.budgetCardEmpty}>
                    {t("setTripBudget")}
                  </Text>
                </View>
              )}
              <Ionicons
                name="chevron-forward"
                size={16}
                color={DARK.muted}
                style={s.budgetCardChevron}
              />
            </TouchableOpacity>
          </>
        )}

        {activeTrip && (
          <>
            <View style={s.secRow}>
              <Text style={s.secLabel}>{t("accommodations")}</Text>
              <SectionAddButton
                icon="add"
                color={DARK.blue}
                onPress={() =>
                  nav.push({
                    pathname: "/trip-form",
                    params: { tripId: activeTrip.id, step: "2" },
                  })
                }
              />
            </View>

            {(activeTrip.hotels ?? []).filter((h: any) => h.name.trim())
              .length === 0 ? (
              <TouchableOpacity
                style={s.looksEmpty}
                onPress={() =>
                  nav.push({
                    pathname: "/trip-form",
                    params: { tripId: activeTrip.id, step: "2" },
                  })
                }
                activeOpacity={0.8}
              >
                <Image
                  source={require("../../assets/images/icon-building.png")}
                  style={{ width: 22, height: 22 }}
                />
                <Text style={s.looksEmptyText}>{t("addAccommodation")}</Text>
                <Ionicons name="chevron-forward" size={16} color={DARK.muted} />
              </TouchableOpacity>
            ) : (
              (activeTrip.hotels ?? [])
                .filter((h: any) => h.name.trim())
                .map((hotel: any, i: any, arr: any) => {
                  const { checkIn, checkOut } =
                    hotel.checkIn && hotel.checkOut
                      ? { checkIn: hotel.checkIn, checkOut: hotel.checkOut }
                      : hotelDates(i, arr.length);
                  return (
                    <HotelCard
                      key={i}
                      hotelName={hotel.name}
                      city={hotel.dest || activeTrip.destinations?.[0] || ""}
                      checkIn={checkIn}
                      checkOut={checkOut}
                      confirmationCode={hotel.conf || undefined}
                    />
                  );
                })
            )}
          </>
        )}

        {visaWarnings.length > 0 && (
          <View style={s.visaCard}>
            <View style={s.visaHeader}>
              <Image
                source={require("../../assets/images/icon-warning.png")}
                style={{ width: 18, height: 18 }}
              />
              <Text style={s.visaTitle}>
                {t("visaWarningTitle")}
              </Text>
            </View>
            {visaWarnings.map((w, i) => (
              <Text key={i} style={s.visaMsg}>
                • {w.message}
              </Text>
            ))}
          </View>
        )}

        {activeTrip && (
          <>
            <View style={s.secRow}>
              <Text style={s.secLabel}>{t("checklist")}</Text>
              <SectionAddButton
                icon={showAddItem ? "close" : "add"}
                color={DARK.pink}
                onPress={() => setShowAddItem((v) => !v)}
              />
            </View>

            <View style={s.card}>
              {activeChecks.length === 0 && (
                <Text style={s.emptyCheck}>
                  {t("noChecklistItems")}
                </Text>
              )}
              {activeChecks.map((item: CheckItem, i: number) => (
                <CheckRow
                  key={item.id}
                  item={item}
                  onToggle={() => toggleCheck(item.id)}
                  onDelete={() => deleteCheck(item.id)}
                />
              ))}

              {showAddItem && (
                <View style={s.addRow}>
                  <TextInput
                    style={s.addInput}
                    value={newItemText}
                    onChangeText={setNewItemText}
                    placeholder={t("newItemPlaceholder")}
                    placeholderTextColor={DARK.muted}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleAddItem}
                  />
                  <TouchableOpacity
                    style={s.addBtn}
                    onPress={handleAddItem}
                    activeOpacity={0.8}
                  >
                    <Text style={s.addBtnText}>{t("add")}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}

        {/* {activeTrip && (
          <LinearGradient
            colors={[colors.teal, colors.sage]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.tealCardGrad}
          >
            <View style={s.tealCard}>
              <Text style={s.tealIcon}>✈️</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.tealLabel}>próximo voo</Text>
                <Text style={s.tealValue}>
                  {segments[0]?.from} → {segments[segments.length - 1]?.to}
                  {activeTrip.flightConf ? `  ·  ${activeTrip.flightConf}` : ""}
                </Text>
                <Text style={s.tealSub}>
                  {formatDate(activeTrip.depart)} · {nights * 24}h+ de aventura
                </Text>
              </View>
            </View>
          </LinearGradient>
        )} */}

        {/* Ternário explícito — evita `""` como text node em View no web */}
        {activeTrip?.flightConf || activeTrip?.hotelConf ? (
          <>
            <Text style={s.secLabel}>{t("confirmations")}</Text>
            <View style={s.confRow}>
              {activeTrip.flightConf ? (
                <View style={s.confCard}>
                  <View style={s.confLabelRow}>
                    <Image
                      source={require("../../assets/images/icon-plane.png")}
                      style={{ width: 14, height: 14 }}
                    />
                    <Text style={s.confLabel}>{t("flight")}</Text>
                  </View>
                  <Text style={[s.confValue, { color: DARK.blue }]}>
                    {activeTrip.flightConf}
                  </Text>
                  <Text style={s.confSub}>{t("confirmed")}</Text>
                </View>
              ) : null}
              {activeTrip.hotelConf ? (
                <View style={s.confCard}>
                  <View style={s.confLabelRow}>
                    <Image
                      source={require("../../assets/images/icon-building.png")}
                      style={{ width: 14, height: 14 }}
                    />
                    <Text style={s.confLabel}>{t("hotel")}</Text>
                  </View>
                  <Text style={[s.confValue, { color: DARK.pink }]}>
                    {activeTrip.hotelConf}
                  </Text>
                  <Text style={s.confSub}>
                    {activeTrip.destinations?.[0] ?? ""}
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      <Modal
        visible={showEditMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditMenu(false)}
      >
        <TouchableOpacity
          style={s.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowEditMenu(false)}
        >
          <TouchableOpacity
            style={[s.menuCard, { marginBottom: insets.bottom + spacing.md }]}
            activeOpacity={1}
            onPress={() => {}}
          >
            <TouchableOpacity
              style={s.menuItem}
              activeOpacity={0.7}
              onPress={() => {
                setShowEditMenu(false);
                handleChangeCover();
              }}
            >
              <View style={[s.menuIconWrap, { backgroundColor: DARK.blue }]}>
                <Image
                  source={require("../../assets/images/icon-camera.png")}
                  style={{ width: 22, height: 22 }}
                />
              </View>
              <Text style={s.menuItemText}>{t("changeCoverPhoto")}</Text>
              <Ionicons name="chevron-forward" size={16} color={DARK.muted} />
            </TouchableOpacity>

            <View style={s.menuDivider} />

            <TouchableOpacity
              style={s.menuItem}
              activeOpacity={0.7}
              onPress={() => {
                setShowEditMenu(false);
                if (activeTrip) {
                  nav.push({
                    pathname: "/trip-form",
                    params: { tripId: activeTrip.id },
                  });
                }
              }}
            >
              <View style={[s.menuIconWrap, { backgroundColor: DARK.pink }]}>
                <Image
                  source={require("../../assets/images/icon-edit.png")}
                  style={{ width: 22, height: 22 }}
                />
              </View>
              <Text style={s.menuItemText}>{t("editTrip")}</Text>
              <Ionicons name="chevron-forward" size={16} color={DARK.muted} />
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.menuCancel, { marginBottom: insets.bottom + spacing.sm }]}
            activeOpacity={0.7}
            onPress={() => setShowEditMenu(false)}
          >
            <Text style={s.menuCancelText}>{t("cancelLower")}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const HERO_HEIGHT = 300;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK.bg },

  /* hero */
  heroWrap: {
    height: HERO_HEIGHT,
    backgroundColor: DARK.surface,
    overflow: "visible",
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    ...shadow.md,
  },
  heroImageClip: {
    overflow: "hidden",
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  dots: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  heroInner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    justifyContent: "center",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 60,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: DARK.white,
    marginBottom: 3,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: DARK.white,
    lineHeight: 28,
  },
  heroSub: {
    fontSize: 11,
    color: DARK.white,
    fontWeight: "600",
    marginTop: 3,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    marginTop: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  menuCard: {
    backgroundColor: DARK.surface,
    borderRadius: radius.xl,
    marginHorizontal: spacing.lg,
    overflow: "hidden",
    ...shadow.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  menuIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: DARK.white,
  },
  menuDivider: {
    height: 1,
    backgroundColor: DARK.border,
    marginLeft: spacing.md + 32 + spacing.sm,
  },
  menuCancel: {
    backgroundColor: DARK.surface,
    borderRadius: radius.xl,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
    ...shadow.md,
  },
  menuCancelText: {
    fontSize: 14,
    fontWeight: "800",
    color: DARK.pink,
  },

  /* countdown */
  cdPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: DARK.yellow,
    borderRadius: radius.full,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    marginTop: 100,
    //marginBottom: spacing.md,
    shadowColor: DARK.yellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    borderColor: "#000",
    borderWidth: 3,
    elevation: 16,
  },
  cdUnit: { flex: 1, alignItems: "center" },
  cdNum: {
    fontSize: 22,
    fontWeight: "900",
    color: DARK.ink,
    lineHeight: 24,
  },
  cdLabel: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "rgba(10,10,10,0.6)",
    marginTop: 2,
  },
  cdSep: {
    fontSize: 14,
    color: "rgba(10,10,10,0.4)",
    paddingBottom: 8,
    paddingHorizontal: 2,
  },

  /* sheet */
  sheet: {
    flex: 1,
    backgroundColor: DARK.bg,
    marginHorizontal: spacing.lg,
  },
  sheetContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 20,
  },

  /* section label */
  secLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: DARK.muted,
    marginBottom: spacing.sm,
  },
  secRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  sectionAddBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.sm,
  },

  /* stats */
  statRow: { flexDirection: "row", gap: 8, marginBottom: spacing.md },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: 10,
    alignItems: "center",
  },
  statNum: { fontSize: 18, fontWeight: "900", color: DARK.ink },
  statLabel: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "rgba(10,10,10,0.6)",
    marginTop: 2,
  },

  /* budget card */
  budgetCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: DARK.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: DARK.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  budgetCardRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: spacing.sm,
  },
  budgetCardSpent: { fontSize: 16, fontWeight: "900", color: DARK.white },
  budgetCardTotal: {
    fontSize: 13,
    fontWeight: "700",
    color: DARK.muted,
  },
  budgetTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: DARK.surfaceAlt,
    overflow: "hidden",
  },
  budgetFill: { height: "100%", borderRadius: 3 },
  budgetCardEmptyRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  budgetCardEmpty: {
    fontSize: 13,
    fontWeight: "700",
    color: DARK.muted,
  },
  budgetCardIcon: { width: 34, height: 34 },
  budgetCardChevron: { marginLeft: spacing.sm },

  /* visa warning */
  visaCard: {
    backgroundColor: "rgba(236,226,46,0.12)",
    borderWidth: 1,
    borderColor: "rgba(236,226,46,0.35)",
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  visaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.xs,
  },
  visaTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: DARK.yellow,
    flex: 1,
  },
  visaMsg: {
    fontSize: 11,
    fontWeight: "600",
    color: DARK.yellow,
    marginBottom: 2,
  },

  /* card */
  card: {
    backgroundColor: DARK.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: DARK.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  emptyCheck: {
    fontSize: 12,
    color: DARK.muted,
    fontWeight: "600",
    paddingVertical: spacing.sm,
    textAlign: "center",
  },

  /* check row */
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: DARK.border,
  },
  checkCircleWrap: { flexShrink: 0 },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: DARK.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleDone: {
    backgroundColor: DARK.blue,
    borderColor: DARK.blue,
  },
  checkText: { flex: 1, fontSize: 12, fontWeight: "700", color: DARK.white },
  checkTextDone: { color: DARK.muted, textDecorationLine: "line-through" },
  catPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  catPillText: { fontSize: 9, fontWeight: "800" },
  deleteBtn: { paddingLeft: 4 },

  /* add item row */
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: DARK.border,
    marginTop: 2,
  },
  addInput: {
    flex: 1,
    backgroundColor: DARK.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: DARK.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: "600",
    color: DARK.white,
  },
  addBtn: {
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: DARK.pink,
    shadowColor: DARK.pink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  addBtnText: { fontSize: 12, fontWeight: "800", color: DARK.ink },

  /* teal highlight (não usado no momento — bloco comentado acima) */
  tealCardGrad: {
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    overflow: "hidden",
    ...shadow.teal,
  },
  tealCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  tealIcon: { fontSize: 26 },
  tealLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  tealValue: { fontSize: 14, fontWeight: "900", color: colors.white },
  tealSub: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    marginTop: 1,
  },

  /* hospedagens empty state */
  looksEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: DARK.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: DARK.border,
    borderStyle: "dashed",
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  looksEmptyText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: DARK.muted,
  },

  /* confirmations */
  confRow: { flexDirection: "row", gap: 8, marginBottom: spacing.md },
  confCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: DARK.border,
    padding: spacing.md,
    backgroundColor: DARK.surface,
  },
  confLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 3,
  },
  confLabel: {
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: DARK.muted,
  },
  confValue: { fontSize: 15, fontWeight: "900", color: DARK.white },
  confSub: {
    fontSize: 10,
    color: DARK.muted,
    fontWeight: "600",
    marginTop: 1,
  },
});

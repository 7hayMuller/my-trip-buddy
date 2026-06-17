import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState, useRef } from "react";
import {
  Animated,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CloudDivider from "../../components/CloudDivider";
import PlaneRoute from "../../components/PlaneRoute";
import { useCountdown } from "../../hooks/useCountdown";
import { useTrips } from "../../hooks/useTrips";
import { colors, getTripImage, radius, shadow, spacing } from "../../theme";
import { CheckItem, LookPin, PlacePin, Trip } from "../../types";
import { getVisaWarnings } from "../../utils/visa";

/* ─── category pill colors ───────────────────────────────────── */

const CAT_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  doc:  { bg: colors.greenLight,   text: colors.green,   label: "docs"  },
  fly:  { bg: colors.purpleLight,  text: colors.purple,  label: "voo"   },
  stay: { bg: colors.goldLight,    text: colors.gold,    label: "hotel" },
  look: { bg: colors.accentLight,  text: colors.accent,  label: "looks" },
  misc: { bg: colors.offwhite,     text: colors.muted,   label: "outro" },
  visa: { bg: colors.warningLight, text: colors.warning, label: "visto" },
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

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statNum}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function TripChip({
  trip,
  active,
  onPress,
}: {
  trip: Trip;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[s.chip, active && s.chipActive]}
      activeOpacity={0.7}
    >
      <Ionicons
        name="airplane"
        size={11}
        color={active ? colors.white : colors.muted}
      />
      <Text style={[s.chipText, active && s.chipTextActive]} numberOfLines={1}>
        {trip.name}
      </Text>
    </TouchableOpacity>
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
  const cs = CAT_STYLE[item.cat] ?? CAT_STYLE.misc;
  return (
    <View style={s.checkRow}>
      <TouchableOpacity onPress={onToggle} hitSlop={8} style={s.checkCircleWrap}>
        <View style={[s.checkCircle, item.done && s.checkCircleDone]}>
          {item.done && <Ionicons name="checkmark" size={11} color={colors.white} />}
        </View>
      </TouchableOpacity>
      <Text style={[s.checkText, item.done && s.checkTextDone]} numberOfLines={2}>
        {item.text}
      </Text>
      <View style={[s.catPill, { backgroundColor: cs.bg }]}>
        <Text style={[s.catPillText, { color: cs.text }]}>{cs.label}</Text>
      </View>
      <TouchableOpacity onPress={onDelete} hitSlop={8} style={s.deleteBtn}>
        <Ionicons name="close" size={12} color={colors.muted} />
      </TouchableOpacity>
    </View>
  );
}

/* ─── main screen ────────────────────────────────────────────── */

export default function HomeScreen() {
  const nav = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const {
    trips,
    activeTrip,
    activeIndex,
    setActiveIndex,
    activeChecks,
    toggleCheck,
    addCheck,
    deleteCheck,
    activeLooks,
    removeLook,
    activePlaces,
    removePlace,
  } = useTrips();
  const cd = useCountdown(activeTrip?.depart);

  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemText, setNewItemText] = useState("");

  const scrollY = useRef(new Animated.Value(0)).current;
  const heroScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });
  const heroOpacity = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [1, 0.85],
    extrapolate: 'clamp',
  });

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

  const formatDate = (s: string) => {
    try {
      return format(new Date(s + "T00:00:00"), "d 'de' MMM", { locale: ptBR });
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
    ? getVisaWarnings(activeTrip.destinations ?? [], activeTrip.origin ?? "Brasil")
    : [];

  const handleAddItem = async () => {
    const text = newItemText.trim();
    if (!text) return;
    await addCheck({ text, cat: "misc" });
    setNewItemText("");
    setShowAddItem(false);
  };

  /* ── hero content ── */
  const heroContent = (
    <>
      <LinearGradient
        colors={[
          "rgba(17,30,53,0.10)",
          "rgba(17,30,53,0.55)",
          "rgba(17,30,53,0.88)",
          "rgba(27,43,75,0.97)",
        ]}
        locations={[0, 0.35, 0.72, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.dots} pointerEvents="none" />
      <View style={[s.heroInner, { paddingTop: insets.top + 6 }]}>
        <View style={s.heroTopRow}>
          <View>
            <Text style={s.heroEyebrow}>sua viagem dos sonhos</Text>
            <Text style={s.heroTitle} numberOfLines={1}>
              {activeTrip?.name ?? "Adicione uma viagem"}
            </Text>
            {activeTrip && (
              <Text style={s.heroSub}>
                {formatDate(activeTrip.depart)} – {formatDate(activeTrip.ret)}
                {"  ·  "}
                {nights} noites
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={s.editBtn}
            onPress={() =>
              activeTrip
                ? nav.push({ pathname: "/trips", params: { tripId: activeTrip.id } })
                : nav.push("/trips")
            }
          >
            <Ionicons
              name={activeTrip ? "pencil" : "add"}
              size={15}
              color="rgba(255,255,255,0.8)"
            />
          </TouchableOpacity>
        </View>

        {segments.length > 0 && <PlaneRoute segments={segments} />}

        {activeTrip && (
          <View style={s.cdPill}>
            <CdBox value={cd.days} label="dias" />
            <Text style={s.cdSep}>:</Text>
            <CdBox value={cd.hours} label="hrs" />
            <Text style={s.cdSep}>:</Text>
            <CdBox value={cd.minutes} label="min" />
            <Text style={s.cdSep}>:</Text>
            <CdBox value={cd.seconds} label="seg" />
          </View>
        )}
      </View>
    </>
  );

  return (
    <View style={s.root}>
      {/* ── HERO ── */}
      <View style={s.heroWrap}>
        {coverUri ? (
          <ImageBackground
            source={{ uri: coverUri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: colors.navy }]}
          />
        )}
        {heroContent}
      </View>

      {/* ── FAT CLOUD DIVIDER ── */}
      <CloudDivider color={colors.offwhite} width={width} />

      {/* ── WHITE SHEET ── */}
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
        {/* trip chips */}
        <Text style={s.secLabel}>suas viagens</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: spacing.lg }}
        >
          {trips.map((t: any, i: any) => (
            <TripChip
              key={t.id}
              trip={t}
              active={i === activeIndex}
              onPress={() => setActiveIndex(i)}
            />
          ))}
          <TouchableOpacity
            style={s.chipAdd}
            onPress={() => nav.push("/trips")}
          >
            <Ionicons name="add" size={13} color={colors.teal2} />
            <Text style={s.chipAddText}>nova viagem</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* stats */}
        <View style={s.statRow}>
          <LinearGradient
            colors={['rgba(107,169,160,0.08)', 'rgba(107,169,160,0.03)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.statCardGrad}
          >
            <StatCard
              value={String(activeTrip?.destinations?.length ?? 0)}
              label="destinos"
            />
          </LinearGradient>
          <LinearGradient
            colors={['rgba(123,104,182,0.08)', 'rgba(123,104,182,0.03)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.statCardGrad}
          >
            <StatCard value={String(nights)} label="noites" />
          </LinearGradient>
          <LinearGradient
            colors={['rgba(216,168,196,0.08)', 'rgba(216,168,196,0.03)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.statCardGrad}
          >
            <StatCard
              value={activeChecks.length > 0 ? `${doneChecks}/${activeChecks.length}` : "–"}
              label="checklist"
            />
          </LinearGradient>
        </View>

        {/* visa warning */}
        {visaWarnings.length > 0 && (
          <View style={s.visaCard}>
            <View style={s.visaHeader}>
              <Ionicons name="alert-circle" size={15} color={colors.warning} />
              <Text style={s.visaTitle}>atenção: visto pode ser necessário</Text>
            </View>
            {visaWarnings.map((w, i) => (
              <Text key={i} style={s.visaMsg}>• {w.message}</Text>
            ))}
          </View>
        )}

        {/* checklist */}
        {activeTrip && (
          <>
            <View style={s.secRow}>
              <Text style={s.secLabel}>checklist</Text>
              <TouchableOpacity
                onPress={() => setShowAddItem((v) => !v)}
                style={s.addIconBtn}
                hitSlop={8}
              >
                <Ionicons
                  name={showAddItem ? "close-circle-outline" : "add-circle-outline"}
                  size={18}
                  color={colors.teal2}
                />
              </TouchableOpacity>
            </View>

            <LinearGradient
              colors={['rgba(255,255,255,0.95)', 'rgba(245,243,240,0.98)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={s.cardGrad}
            >
              <View style={s.card}>
                {activeChecks.length === 0 && (
                  <Text style={s.emptyCheck}>Nenhum item no checklist ainda.</Text>
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
                    placeholder="novo item..."
                    placeholderTextColor={colors.muted}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={handleAddItem}
                  />
                  <TouchableOpacity
                    style={s.addBtn}
                    onPress={handleAddItem}
                    activeOpacity={0.8}
                  >
                    <Text style={s.addBtnText}>adicionar</Text>
                  </TouchableOpacity>
                </View>
              )}
              </View>
            </LinearGradient>
          </>
        )}

        {/* looks gallery */}
        {activeTrip && (
          <>
            <View style={s.secRow}>
              <Text style={s.secLabel}>looks da viagem</Text>
              <TouchableOpacity
                onPress={() => nav.push("/pinterest-picker")}
                style={s.addIconBtn}
                hitSlop={8}
              >
                <Ionicons name="logo-pinterest" size={18} color="#E60023" />
              </TouchableOpacity>
            </View>

            {activeLooks.length === 0 ? (
              <TouchableOpacity
                style={s.looksEmpty}
                onPress={() => nav.push("/pinterest-picker")}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-pinterest" size={22} color="#E60023" />
                <Text style={s.looksEmptyText}>Adicionar looks do Pinterest</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </TouchableOpacity>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.looksScroll}
                contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.lg }}
              >
                {activeLooks.map((look: LookPin) => (
                  <View key={look.id} style={s.lookCard}>
                    <Image
                      source={{ uri: look.imageUrl }}
                      style={s.lookImg}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      style={s.lookRemove}
                      onPress={() => removeLook(look.id)}
                      hitSlop={4}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  style={s.lookAdd}
                  onPress={() => nav.push("/pinterest-picker")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={24} color={colors.muted} />
                </TouchableOpacity>
              </ScrollView>
            )}
          </>
        )}

        {/* places gallery */}
        {activeTrip && (
          <>
            <View style={s.secRow}>
              <Text style={s.secLabel}>lugares para visitar</Text>
              <TouchableOpacity
                onPress={() => nav.push("/places-picker")}
                style={s.addIconBtn}
                hitSlop={8}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.teal2} />
              </TouchableOpacity>
            </View>

            {activePlaces.length === 0 ? (
              <TouchableOpacity
                style={s.looksEmpty}
                onPress={() => nav.push("/places-picker")}
                activeOpacity={0.8}
              >
                <Ionicons name="map-outline" size={20} color={colors.teal2} />
                <Text style={s.looksEmptyText}>Adicionar lugares para visitar</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </TouchableOpacity>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.looksScroll}
                contentContainerStyle={{ gap: spacing.sm, paddingRight: spacing.lg }}
              >
                {activePlaces.map((place: PlacePin) => (
                  <View key={place.id} style={s.placeCard}>
                    <Image
                      source={{ uri: place.imageUrl }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                    <View style={s.placeGrad}>
                      <Text style={s.placeName} numberOfLines={1}>{place.name}</Text>
                    </View>
                    <TouchableOpacity
                      style={s.lookRemove}
                      onPress={() => removePlace(place.id)}
                      hitSlop={4}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  style={s.lookAdd}
                  onPress={() => nav.push("/places-picker")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={24} color={colors.muted} />
                </TouchableOpacity>
              </ScrollView>
            )}
          </>
        )}

        {/* next flight highlight */}
        {activeTrip && (
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
        )}

        {/* confirmations */}
        {activeTrip && (activeTrip.flightConf || activeTrip.hotelConf) && (
          <>
            <Text style={s.secLabel}>confirmações</Text>
            <View style={s.confRow}>
              {activeTrip.flightConf && (
                <LinearGradient
                  colors={['rgba(123,104,182,0.08)', 'rgba(123,104,182,0.02)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.confCardGrad}
                >
                  <View style={s.confCard}>
                    <View style={s.confLabelRow}>
                      <Ionicons
                        name="airplane-outline"
                        size={12}
                        color={colors.muted}
                      />
                      <Text style={s.confLabel}>voo</Text>
                    </View>
                    <Text style={[s.confValue, { color: colors.purple }]}>
                      {activeTrip.flightConf}
                    </Text>
                    <Text style={s.confSub}>confirmado</Text>
                  </View>
                </LinearGradient>
              )}
              {activeTrip.hotelConf && (
                <LinearGradient
                  colors={['rgba(107,169,160,0.08)', 'rgba(107,169,160,0.02)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.confCardGrad}
                >
                  <View style={s.confCard}>
                    <View style={s.confLabelRow}>
                      <Ionicons
                        name="bed-outline"
                        size={12}
                        color={colors.muted}
                      />
                      <Text style={s.confLabel}>hotel</Text>
                    </View>
                    <Text style={[s.confValue, { color: colors.teal2 }]}>
                      {activeTrip.hotelConf}
                    </Text>
                    <Text style={s.confSub}>{activeTrip.destinations?.[0]}</Text>
                  </View>
                </LinearGradient>
              )}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

/* ─── styles ─────────────────────────────────────────────────── */

const HERO_HEIGHT = 280;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.offwhite },

  /* hero */
  heroWrap: {
    height: HERO_HEIGHT,
    backgroundColor: colors.navyDeep,
    overflow: "hidden",
  },
  dots: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
    backgroundColor: colors.navy,
  },
  heroInner: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    justifyContent: "flex-end",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.55)",
    marginBottom: 3,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.white,
    fontStyle: "italic",
    lineHeight: 28,
  },
  heroSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
    marginTop: 3,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  /* countdown */
  cdPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cdBg,
    borderWidth: 1,
    borderColor: colors.cdBorder,
    borderRadius: radius.full,
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
  },
  cdUnit: { flex: 1, alignItems: "center" },
  cdNum: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.white,
    lineHeight: 24,
  },
  cdLabel: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.cdLabel,
    marginTop: 2,
  },
  cdSep: {
    fontSize: 14,
    color: colors.cdSep,
    paddingBottom: 8,
    paddingHorizontal: 2,
  },

  /* sheet */
  sheet: { flex: 1, backgroundColor: colors.offwhite },
  sheetContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: 2,
    paddingBottom: 20,
  },

  /* section label */
  secLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  secRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  addIconBtn: {
    padding: 2,
  },

  /* trip chips */
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginRight: spacing.sm,
    ...shadow.sm,
  },
  chipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    maxWidth: 110,
  },
  chipTextActive: { color: colors.white },
  chipAdd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.teal,
    backgroundColor: colors.tealLight,
    marginRight: spacing.sm,
  },
  chipAddText: { fontSize: 11, fontWeight: "700", color: colors.teal2 },

  /* stats */
  statRow: { flexDirection: "row", gap: 8, marginBottom: spacing.md },
  statCardGrad: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 0,
    overflow: 'hidden',
    ...shadow.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 10,
    alignItems: "center",
  },
  statNum: { fontSize: 18, fontWeight: "900", color: colors.navy },
  statLabel: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.muted,
    marginTop: 2,
  },

  /* visa warning */
  visaCard: {
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warningBorder,
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
  visaTitle: { fontSize: 11, fontWeight: "800", color: colors.warning, flex: 1 },
  visaMsg:   { fontSize: 11, fontWeight: "600", color: colors.warning, marginBottom: 2 },

  /* card */
  cardGrad: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadow.sm,
  },
  card: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  emptyCheck: {
    fontSize: 12,
    color: colors.muted,
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
    borderBottomColor: colors.border,
  },
  checkCircleWrap: { flexShrink: 0 },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleDone: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  checkText: { flex: 1, fontSize: 12, fontWeight: "700", color: colors.navy },
  checkTextDone: { color: colors.muted, textDecorationLine: "line-through" },
  catPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radius.full },
  catPillText: { fontSize: 9, fontWeight: "800" },
  deleteBtn: { paddingLeft: 4 },

  /* add item row */
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 2,
  },
  addInput: {
    flex: 1,
    backgroundColor: colors.offwhite,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: "600",
    color: colors.navy,
  },
  addBtn: {
    backgroundColor: colors.teal,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    ...shadow.teal,
  },
  addBtnText: { fontSize: 12, fontWeight: "800", color: colors.white },

  /* place cards */
  placeCard: {
    width: 150,
    height: 110,
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadow.sm,
  },
  placeGrad: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(17,30,53,0.6)",
  },
  placeName: { fontSize: 12, fontWeight: "800", color: colors.white },

  /* teal highlight */
  tealCardGrad: {
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    overflow: 'hidden',
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

  /* looks */
  looksScroll: { marginBottom: spacing.md },
  looksEmpty: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.sm,
  },
  looksEmptyText: { flex: 1, fontSize: 13, fontWeight: "700", color: colors.muted },
  lookCard: {
    width: 110,
    height: 150,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.sm,
  },
  lookImg: { flex: 1 },
  lookRemove: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 10,
  },
  lookAdd: {
    width: 110,
    height: 150,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },

  /* confirmations */
  confRow: { flexDirection: "row", gap: 8, marginBottom: spacing.md },
  confCardGrad: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.sm,
  },
  confCard: {
    padding: spacing.md,
    backgroundColor: colors.white,
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
    color: colors.muted,
  },
  confValue: { fontSize: 15, fontWeight: "900", color: colors.navy },
  confSub: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: "600",
    marginTop: 1,
  },
});

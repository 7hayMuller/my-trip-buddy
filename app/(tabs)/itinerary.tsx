import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DateCarousel } from "../../components/DateCarousel";
import { ItineraryMap } from "../../components/ItineraryMap";
import { ItineraryPlaceSearch } from "../../components/ItineraryPlaceSearch";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { useTrips } from "../../hooks/useTrips";
import { dark, radius, shadow, spacing } from "../../theme";
import { FlightEntry } from "../../types";
import { getTripDays, UNASSIGNED_DAY_KEY } from "../../utils/dates";
import { searchPlaces } from "../../utils/geocode";

const CAROUSEL_TOP_GAP = 12;
const SHEET_COLLAPSED_HEIGHT = 140;
const SHEET_EXPANDED_RATIO = 0.55;

type DestinationGroup = { country: string | null; items: string[] };

// Compartilhado entre o modo online (dentro do BottomSheet, com mapa) e o
// offline (lista cheia, sem mapa) — mesma linha de destino nos dois.
function DestinationRows({
  groups,
  onOpenInMaps,
  onRemove,
}: {
  groups: DestinationGroup[];
  onOpenInMaps: (dest: string) => void;
  onRemove: (dest: string) => void;
}) {
  const { t } = useTranslation("itinerary");
  if (groups.length === 0) {
    return (
      <Text style={s.emptyDayText}>
        {t("noDestinationsThisDay")}
      </Text>
    );
  }
  return (
    <View style={s.listCard}>
      {groups.map((group, gi) => (
        <View key={group.country ?? "flat"}>
          {group.country && <Text style={s.groupHeader}>{group.country}</Text>}
          {group.items.map((dest, i) => {
            const isLast =
              gi === groups.length - 1 && i === group.items.length - 1;
            return (
              <View
                key={dest}
                style={[s.destRow, isLast && { borderBottomWidth: 0 }]}
              >
                <TouchableOpacity
                  style={s.destRowMain}
                  onPress={() => onOpenInMaps(dest)}
                  activeOpacity={0.6}
                >
                  <Image
                    source={require("../../assets/images/icon-pin.png")}
                    style={{ width: 20, height: 20 }}
                  />
                  <Text style={s.destRowText} numberOfLines={1}>
                    {dest}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={dark.muted} />
                </TouchableOpacity>
                <View style={s.destRowDivider} />
                <TouchableOpacity
                  onPress={() => onRemove(dest)}
                  hitSlop={8}
                  style={s.destRowClose}
                >
                  <Ionicons name="close" size={14} color={dark.muted} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export default function ItineraryScreen() {
  const nav = useRouter();
  const insets = useSafeAreaInsets();
  const isOnline = useNetworkStatus();
  const { activeTrip, updateTrip } = useTrips();
  const { t } = useTranslation("itinerary");

  const destinations: string[] = activeTrip?.destinations ?? [];
  // Pontos de visitação do roteiro (buscados no drawer abaixo) — separados de
  // `destinations` (países/cidades do cadastro da viagem) para não misturar
  // as duas coisas no trip-form. Ver types/index.ts.
  const itineraryPoints: string[] = activeTrip?.itineraryPoints ?? [];
  const flights: FlightEntry[] = activeTrip?.flights ?? [];
  const [rootHeight, setRootHeight] = useState(0);

  // Sempre a versão mais recente da trip, pra evitar sobrescrever um destino
  // adicionado pela busca do mapa enquanto o backfill abaixo ainda está
  // rodando (ele é assíncrono e sequencial).
  const activeTripRef = useRef(activeTrip);
  activeTripRef.current = activeTrip;

  const dayList = React.useMemo(
    () => getTripDays(activeTrip?.depart ?? "", activeTrip?.ret ?? ""),
    [activeTrip?.depart, activeTrip?.ret],
  );

  // Reconciliação automática dos destinos, rodando em segundo plano:
  // 1) Preenche país/coordenada de destinos que ainda não têm (digitados no
  //    cadastro da viagem, ou adicionados antes dessa feature existir).
  // 2) Voos com data cadastrada "avisam" o roteiro: o destino desse voo passa
  //    a valer a partir daquela data, então é pinado automaticamente no dia
  //    correspondente, sem o usuário precisar buscar e adicionar na mão.
  useEffect(() => {
    if (!activeTrip) return;

    // Voo que chega no dia da volta (ou depois) é o retorno para casa — não
    // é um destino da viagem e não deve virar pasta de looks nem pin.
    const flightDests = flights
      .filter((f) => f.dest?.trim())
      .filter((f) => !(f.date && activeTrip.ret && f.date >= activeTrip.ret))
      .map((f) => ({ dest: f.dest.trim(), date: f.date }));

    const allLabels = [...destinations];
    for (const f of flightDests) {
      if (!allLabels.some((d) => d.toLowerCase() === f.dest.toLowerCase())) {
        allLabels.push(f.dest);
      }
    }

    const missingCoords = allLabels.filter(
      (d) => !activeTrip.destinationCoords?.[d],
    );
    // Só usa a data do voo se ela cair dentro do período da viagem — evita
    // que um destino suma da tela por ter uma data fora do intervalo válido.
    const missingDates = flightDests.filter(
      (f) =>
        f.date &&
        dayList.some((day) => day.key === f.date) &&
        !activeTrip.destinationDates?.[f.dest],
    );

    if (
      allLabels.length === destinations.length &&
      missingCoords.length === 0 &&
      missingDates.length === 0
    ) {
      return;
    }

    let cancelled = false;
    (async () => {
      const coordUpdates: Record<
        string,
        { lat: number; lon: number; country?: string }
      > = {};
      for (const dest of missingCoords) {
        const [best] = await searchPlaces(dest, 1);
        if (best)
          coordUpdates[dest] = {
            lat: best.lat,
            lon: best.lon,
            country: best.country,
          };
      }

      const current = activeTripRef.current;
      if (cancelled || !current) return;

      const currentDestinations: string[] = current.destinations ?? [];
      const newLabels = allLabels.filter(
        (d) =>
          !currentDestinations.some(
            (cd) => cd.toLowerCase() === d.toLowerCase(),
          ),
      );
      const nextDestinations =
        newLabels.length > 0
          ? [...currentDestinations, ...newLabels]
          : currentDestinations;

      const nextDates = { ...(current.destinationDates ?? {}) };
      for (const f of missingDates) {
        if (!nextDates[f.dest] && f.date) nextDates[f.dest] = f.date;
      }

      await updateTrip(current.id, {
        destinations: nextDestinations,
        destinationCoords: {
          ...(current.destinationCoords ?? {}),
          ...coordUpdates,
        },
        destinationDates: nextDates,
      });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    destinations.join("|"),
    JSON.stringify(activeTrip?.flights ?? []),
    activeTrip?.id,
    dayList,
  ]);
  // Só considera pontos de visitação sem data — o destino macro (ex: "Los
  // Angeles") não aparece nessa tela como item da lista, então seu status de
  // data atribuída é irrelevante aqui (ver destinationsForSelectedDay abaixo).
  const hasUnassigned = itineraryPoints.some(
    (d) => !activeTrip?.itineraryPointDates?.[d],
  );

  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  // Reinicializa a data selecionada sempre que a viagem ativa muda. Prioriza
  // o bucket "sem data" quando ele existe: é onde vive TODO destino de trips
  // criadas antes dessa feature, então abrir num dia específico (vazio)
  // faria o mapa/lista sumirem pro usuário sem essa escolha. Só quando não
  // há destinos sem data é que faz sentido priorizar o dia de hoje / dia 1.
  useEffect(() => {
    if (!activeTrip) return;
    const todayKey = format(new Date(), "yyyy-MM-dd");
    const fallback = hasUnassigned
      ? UNASSIGNED_DAY_KEY
      : (dayList.find((d) => d.key === todayKey)?.key ??
        dayList[0]?.key ??
        null);
    setSelectedDayKey(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrip?.id]);

  // Lista/mapa do dia mostram só pontos de visitação (buscados no drawer) —
  // o destino macro cadastrado no trip-form (ex: "Los Angeles") nunca aparece
  // aqui como item; ele só entra indiretamente via fallbackCenter, pra dar
  // contexto geográfico ao mapa quando o dia ainda não tem nenhum ponto.
  const destinationsForSelectedDay = itineraryPoints.filter((d) =>
    selectedDayKey === UNASSIGNED_DAY_KEY
      ? !activeTrip?.itineraryPointDates?.[d]
      : activeTrip?.itineraryPointDates?.[d] === selectedDayKey,
  );

  const combinedCoords = activeTrip?.itineraryPointCoords ?? {};

  // Quando o dia selecionado ainda não tem nenhum destino pinado, centraliza
  // o mapa no voo mais recente até essa data (ex: viagem multi-país com um
  // voo pra outro destino no meio — a partir daquele dia o mapa já reflete
  // o novo país mesmo que nenhum ponto tenha sido pinado ainda nele) ou,
  // na ausência de voos, no destino cadastrado na criação da viagem.
  const activeFlightCenter = (() => {
    if (!selectedDayKey || selectedDayKey === UNASSIGNED_DAY_KEY)
      return undefined;
    const latest = flights
      .filter((f) => f.dest?.trim() && f.date && f.date <= selectedDayKey)
      .sort((a, b) => (a.date! < b.date! ? 1 : -1))[0];
    return latest
      ? activeTrip?.destinationCoords?.[latest.dest.trim()]
      : undefined;
  })();

  const fallbackCenter =
    activeFlightCenter ??
    destinations
      .map((d) => activeTrip?.destinationCoords?.[d])
      .find((c): c is { lat: number; lon: number; country?: string } => !!c);

  // Adicionado pela busca do drawer do itinerário — é sempre um ponto de
  // visitação do roteiro, não um destino do cadastro da viagem (trip-form).
  // Por isso grava em `itineraryPoints`, campo separado de `destinations`.
  const handleAddDestination = async (
    label: string,
    lat: number,
    lon: number,
    country?: string,
  ) => {
    if (!activeTrip) return;
    const exists = itineraryPoints.some(
      (d: string) => d.toLowerCase() === label.toLowerCase(),
    );
    const nextDates = { ...(activeTrip.itineraryPointDates ?? {}) };
    if (selectedDayKey && selectedDayKey !== UNASSIGNED_DAY_KEY) {
      nextDates[label] = selectedDayKey;
    }
    await updateTrip(activeTrip.id, {
      itineraryPoints: exists ? itineraryPoints : [...itineraryPoints, label],
      itineraryPointCoords: {
        ...(activeTrip.itineraryPointCoords ?? {}),
        [label]: { lat, lon, country },
      },
      itineraryPointDates: nextDates,
    });
  };

  // Os destinos da lista costumam ser cidades/países bem distantes entre si
  // (ex: Tóquio e Los Angeles na mesma viagem), então não faz sentido pedir
  // uma rota encadeada entre todos eles. Em vez disso, cada ponto abre sua
  // própria rota no Google Maps partindo da localização atual do usuário.
  const handleOpenInMaps = (dest: string) => {
    const point = combinedCoords[dest];
    if (!point) {
      Alert.alert(
        t("locationNotFoundTitle"),
        t("locationNotFoundMessage"),
      );
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lon}&travelmode=driving`;
    Linking.openURL(url);
  };

  // Diferente do ponto único acima, aqui os destinos já são apenas os do dia
  // selecionado — geograficamente coerentes entre si — então uma rota
  // encadeada entre eles faz sentido.
  const handleOpenDayRoute = () => {
    const points = destinationsForSelectedDay
      .map((d) => combinedCoords[d])
      .filter((c): c is { lat: number; lon: number; country?: string } => !!c);
    if (points.length < 2) return;
    const url = `https://www.google.com/maps/dir/${points
      .map((p) => `${p.lat},${p.lon}`)
      .join("/")}`;
    Linking.openURL(url);
  };

  // Um label do dia pode vir tanto de `destinations` (macro, cadastrado no
  // trip-form) quanto de `itineraryPoints` (ponto buscado aqui no drawer) —
  // remove do campo certo em cada caso.
  const handleRemoveDestination = async (label: string) => {
    if (!activeTrip) return;
    if (itineraryPoints.includes(label)) {
      const nextCoords = { ...(activeTrip.itineraryPointCoords ?? {}) };
      delete nextCoords[label];
      const nextDates = { ...(activeTrip.itineraryPointDates ?? {}) };
      delete nextDates[label];
      await updateTrip(activeTrip.id, {
        itineraryPoints: itineraryPoints.filter((d: string) => d !== label),
        itineraryPointCoords: nextCoords,
        itineraryPointDates: nextDates,
      });
      return;
    }
    const nextCoords = { ...(activeTrip.destinationCoords ?? {}) };
    delete nextCoords[label];
    const nextDates = { ...(activeTrip.destinationDates ?? {}) };
    delete nextDates[label];
    await updateTrip(activeTrip.id, {
      destinations: destinations.filter((d: string) => d !== label),
      destinationCoords: nextCoords,
      destinationDates: nextDates,
    });
  };

  // Só divide a lista por país quando há mais de um país conhecido entre os
  // destinos do dia selecionado — destinos sem país conhecido (ex:
  // adicionados antes dessa feature) caem num grupo "outros destinos" pra
  // não sumir da lista.
  const countryOf = (dest: string): string | undefined =>
    combinedCoords[dest]?.country;
  const distinctCountries = new Set(
    destinationsForSelectedDay.map(countryOf).filter((c): c is string => !!c),
  );
  const groupByCountry = distinctCountries.size > 1;

  const destinationGroups: { country: string | null; items: string[] }[] =
    groupByCountry
      ? (() => {
          const order: string[] = [];
          const map: Record<string, string[]> = {};
          for (const dest of destinationsForSelectedDay) {
            const key = countryOf(dest) ?? t("otherDestinations");
            if (!map[key]) {
              map[key] = [];
              order.push(key);
            }
            map[key].push(dest);
          }
          return order.map((country) => ({ country, items: map[country] }));
        })()
      : destinationsForSelectedDay.length > 0
        ? [{ country: null, items: destinationsForSelectedDay }]
        : [];

  return (
    <View style={s.root}>
      {!activeTrip ? (
        <>
          <View style={[s.header, { paddingTop: insets.top + 16 }]}>
            <View>
              <Text style={s.headerEyebrow}>{t("eyebrow")}</Text>
              <Text style={s.headerTitle}>{t("title")}</Text>
            </View>
          </View>
          <View style={s.empty}>
            <Image
              source={require("../../assets/images/icon-country.png")}
              style={{ width: 40, height: 40 }}
            />
            <Text style={s.emptyText}>{t("noActiveTrip")}</Text>
            <TouchableOpacity
              style={s.emptyBtn}
              onPress={() => nav.push("/trip-form")}
              activeOpacity={0.8}
            >
              <Text style={s.emptyBtnText}>{t("createTrip")}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : !isOnline ? (
        <>
          <View style={[s.header, { paddingTop: insets.top + 16 }]}>
            <View>
              <Text style={s.headerEyebrow}>{t("eyebrow")}</Text>
              <Text style={s.headerTitle}>{t("title")}</Text>
            </View>
          </View>

          <View style={s.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={16} color={dark.yellow} />
            <Text style={s.offlineBannerText}>
              {t("offlineHint")}
            </Text>
          </View>

          <DateCarousel
            days={dayList}
            selectedKey={selectedDayKey}
            onSelect={setSelectedDayKey}
            hasUnassigned={hasUnassigned}
            absolute={false}
            style={s.offlineCarousel}
          />

          <ScrollView contentContainerStyle={s.sheetContent}>
            <DestinationRows
              groups={destinationGroups}
              onOpenInMaps={handleOpenInMaps}
              onRemove={handleRemoveDestination}
            />
          </ScrollView>
        </>
      ) : (
        <View
          style={{ flex: 1 }}
          onLayout={(e) => setRootHeight(e.nativeEvent.layout.height)}
        >
          <ItineraryMap
            fullscreen
            destinations={destinationsForSelectedDay}
            destinationCoords={combinedCoords}
            fallbackCenter={fallbackCenter}
          />

          <DateCarousel
            days={dayList}
            selectedKey={selectedDayKey}
            onSelect={setSelectedDayKey}
            hasUnassigned={hasUnassigned}
            style={{ top: insets.top + CAROUSEL_TOP_GAP }}
          />

          {rootHeight > 0 && (
            <BottomSheet
              index={1}
              snapPoints={[
                SHEET_COLLAPSED_HEIGHT,
                rootHeight * SHEET_EXPANDED_RATIO,
              ]}
              enableDynamicSizing={false}
              backgroundStyle={s.sheetBg}
              handleIndicatorStyle={s.sheetHandle}
              keyboardBehavior="extend"
              keyboardBlurBehavior="restore"
              android_keyboardInputMode="adjustResize"
            >
              <View style={s.sheetHeader}>
                <Text style={s.sectionLabel}>{t("dayDestinations")}</Text>
                <ItineraryPlaceSearch onAddDestination={handleAddDestination} />
                <Text style={s.sectionHint}>
                  {t("openRouteHint")}
                </Text>
                {destinationsForSelectedDay.length > 1 && (
                  <TouchableOpacity
                    style={s.dayRouteBtn}
                    onPress={handleOpenDayRoute}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="navigate" size={14} color={dark.ink} />
                    <Text style={s.dayRouteBtnText}>{t("openDayRoute")}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <BottomSheetScrollView contentContainerStyle={s.sheetContent}>
                <DestinationRows
                  groups={destinationGroups}
                  onOpenInMaps={handleOpenInMaps}
                  onRemove={handleRemoveDestination}
                />
              </BottomSheetScrollView>
            </BottomSheet>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: dark.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: dark.muted,
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: dark.white,
    fontStyle: "italic",
  },

  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "rgba(236,226,46,0.12)",
    borderWidth: 1,
    borderColor: "rgba(236,226,46,0.35)",
  },
  offlineBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: dark.yellow,
  },
  offlineCarousel: {
    marginBottom: spacing.md,
  },

  sheetBg: {
    backgroundColor: dark.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadow.md,
  },
  sheetHandle: {
    backgroundColor: dark.border,
    width: 36,
  },
  sheetHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sheetContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: dark.muted,
    marginBottom: 2,
  },
  sectionHint: {
    fontSize: 11,
    //fontWeight: "500",
    color: dark.muted,
    marginBottom: spacing.sm,
  },
  dayRouteBtn: {
    flexDirection: "row",
    alignSelf: "flex-start",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: dark.blue,
  },
  dayRouteBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: dark.ink,
  },
  emptyDayText: {
    fontSize: 13,
    fontWeight: "600",
    color: dark.muted,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },

  listCard: {
    backgroundColor: dark.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: dark.border,
    paddingHorizontal: spacing.md,
    ...shadow.sm,
  },
  groupHeader: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: dark.blue,
    paddingTop: spacing.md,
    paddingBottom: 4,
  },
  destRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: dark.border,
  },
  destRowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 8,
  },
  destRowText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: dark.white,
  },
  destRowDivider: {
    width: 1,
    alignSelf: "stretch",
    marginVertical: 8,
    backgroundColor: dark.border,
  },
  destRowClose: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: { fontSize: 14, fontWeight: "700", color: dark.muted },
  emptyBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.full,
    backgroundColor: dark.pink,
  },
  emptyBtnText: { fontSize: 13, fontWeight: "800", color: dark.ink },
});

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DestinationMap } from "../../components/DestinationMap";
import { useTrips } from "../../hooks/useTrips";
import {
  colors,
  getDestinationsImage,
  radius,
  shadow,
  spacing,
} from "../../theme";
import { colorForCountry } from "../../utils/geo";
import { searchPlaces } from "../../utils/geocode";

export default function ItineraryScreen() {
  const nav = useRouter();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { activeTrip, updateTrip } = useTrips();

  const destinations: string[] = activeTrip?.destinations ?? [];
  const coverUri = activeTrip ? getDestinationsImage(destinations) : null;
  const mapHeight = Math.round(windowHeight * 0.62);

  // Sempre a versão mais recente da trip, pra evitar sobrescrever um destino
  // adicionado pela busca do mapa enquanto o backfill abaixo ainda está
  // rodando (ele é assíncrono e sequencial).
  const activeTripRef = useRef(activeTrip);
  activeTripRef.current = activeTrip;

  // Destinos digitados direto no formulário da viagem (ou adicionados antes
  // dessa feature) não têm país conhecido, então nunca entravam no
  // agrupamento por país. Preenche o país (e a coordenada precisa) desses em
  // segundo plano, sem precisar que o usuário refaça a busca manualmente.
  useEffect(() => {
    if (!activeTrip) return;
    const missing = destinations.filter(
      (d: string) => !activeTrip.destinationCoords?.[d],
    );
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      const updates: Record<string, { lat: number; lon: number; country?: string }> = {};
      for (const dest of missing) {
        const [best] = await searchPlaces(dest, 1);
        if (best) updates[dest] = { lat: best.lat, lon: best.lon, country: best.country };
      }
      const current = activeTripRef.current;
      if (cancelled || !current || Object.keys(updates).length === 0) return;
      await updateTrip(current.id, {
        destinationCoords: { ...(current.destinationCoords ?? {}), ...updates },
      });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destinations.join("|"), activeTrip?.id]);

  const handleAddDestination = async (
    label: string,
    lat: number,
    lon: number,
    country?: string,
  ) => {
    if (!activeTrip) return;
    const exists = destinations.some((d: string) => d.toLowerCase() === label.toLowerCase());
    await updateTrip(activeTrip.id, {
      destinations: exists ? destinations : [...destinations, label],
      destinationCoords: {
        ...(activeTrip.destinationCoords ?? {}),
        [label]: { lat, lon, country },
      },
    });
  };

  const handleRemoveDestination = async (label: string) => {
    if (!activeTrip) return;
    const nextCoords = { ...(activeTrip.destinationCoords ?? {}) };
    delete nextCoords[label];
    await updateTrip(activeTrip.id, {
      destinations: destinations.filter((d: string) => d !== label),
      destinationCoords: nextCoords,
    });
  };

  // Só divide a lista por país quando há mais de um país conhecido entre os
  // destinos — destinos sem país conhecido (ex: adicionados antes dessa
  // feature) caem num grupo "outros destinos" pra não sumir da lista.
  const countryOf = (dest: string): string | undefined =>
    activeTrip?.destinationCoords?.[dest]?.country;
  const distinctCountries = new Set(
    destinations.map(countryOf).filter((c): c is string => !!c),
  );
  const groupByCountry = distinctCountries.size > 1;

  const destinationGroups: { country: string | null; items: string[] }[] = groupByCountry
    ? (() => {
        const order: string[] = [];
        const map: Record<string, string[]> = {};
        for (const dest of destinations) {
          const key = countryOf(dest) ?? "Outros destinos";
          if (!map[key]) {
            map[key] = [];
            order.push(key);
          }
          map[key].push(dest);
        }
        return order.map((country) => ({ country, items: map[country] }));
      })()
    : destinations.length > 0
      ? [{ country: null, items: destinations }]
      : [];

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={s.headerEyebrow}>seu roteiro</Text>
          <Text style={s.headerTitle}>itinerário</Text>
        </View>
      </View>

      {!activeTrip ? (
        <View style={s.empty}>
          <Ionicons name="map-outline" size={32} color={colors.muted} />
          <Text style={s.emptyText}>Nenhuma viagem ativa ainda.</Text>
          <TouchableOpacity
            style={s.emptyBtn}
            onPress={() => nav.push("/trip-form")}
            activeOpacity={0.8}
          >
            <Text style={s.emptyBtnText}>criar viagem</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[s.content, { flexGrow: 1 }]}
          showsVerticalScrollIndicator={false}
        >
          <ImageBackground
            source={{ uri: coverUri ?? undefined }}
            style={s.cover}
            imageStyle={s.coverImg}
          >
            <LinearGradient
              colors={["rgba(17,30,53,0.05)", "rgba(17,30,53,0.85)"]}
              style={s.coverGrad}
            >
              <Text style={s.coverTitle} numberOfLines={1}>
                {activeTrip.name}
              </Text>
              {destinations.length > 0 && (
                <Text style={s.coverSub} numberOfLines={1}>
                  {destinations.join("  ·  ")}
                </Text>
              )}
            </LinearGradient>
          </ImageBackground>

          <DestinationMap
            destinations={destinations}
            destinationCoords={activeTrip.destinationCoords}
            onAddDestination={handleAddDestination}
            height={mapHeight}
          />

          {destinationGroups.length > 0 && (
            <>
              <Text style={s.sectionLabel}>destinos adicionados</Text>
              <View style={s.listCard}>
                {destinationGroups.map((group, gi) => (
                  <View key={group.country ?? "flat"}>
                    {group.country && (
                      <Text style={s.groupHeader}>{group.country}</Text>
                    )}
                    {group.items.map((dest, i) => {
                      const isLast =
                        gi === destinationGroups.length - 1 &&
                        i === group.items.length - 1;
                      return (
                        <View
                          key={dest}
                          style={[s.destRow, isLast && { borderBottomWidth: 0 }]}
                        >
                          <Ionicons
                            name="location"
                            size={14}
                            color={colorForCountry(countryOf(dest))}
                          />
                          <Text style={s.destRowText} numberOfLines={1}>
                            {dest}
                          </Text>
                          <TouchableOpacity
                            onPress={() => handleRemoveDestination(dest)}
                            hitSlop={8}
                          >
                            <Ionicons
                              name="close"
                              size={14}
                              color={colors.muted}
                            />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.offwhite },
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
    color: colors.muted,
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.navy,
    fontStyle: "italic",
  },

  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },

  cover: {
    height: 90,
    borderRadius: radius.xl,
    overflow: "hidden",
    marginBottom: spacing.md,
    ...shadow.md,
  },
  coverImg: { borderRadius: radius.xl },
  coverGrad: {
    flex: 1,
    justifyContent: "flex-end",
    padding: spacing.md,
  },
  coverTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.white,
    fontStyle: "italic",
  },
  coverSub: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  listCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    ...shadow.sm,
  },
  groupHeader: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.teal2,
    paddingTop: spacing.md,
    paddingBottom: 4,
  },
  destRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  destRowText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: colors.navy,
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: { fontSize: 14, fontWeight: "700", color: colors.muted },
  emptyBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.full,
    backgroundColor: colors.navy,
  },
  emptyBtnText: { fontSize: 13, fontWeight: "800", color: colors.white },
});

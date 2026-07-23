import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FolderCard } from "../../components/FolderCard";
import { useTrips } from "../../hooks/useTrips";
import { dark, radius, spacing } from "../../theme";
import { LookPin } from "../../types";
import { OUTROS_COUNTRY } from "../../utils/looks";

// Mesmo ciclo de cores do carrossel de datas do itinerário — cada pasta
// (país) usa uma cor diferente, na mesma ordem das abas do menu.
const FOLDER_COLORS = [dark.blue, dark.green, dark.pink, dark.yellow];

export default function LooksScreen() {
  const nav = useRouter();
  const insets = useSafeAreaInsets();
  const { activeTrip, activeLooks } = useTrips();

  const destinations: string[] = activeTrip?.destinations ?? [];
  const countryOf = (dest: string): string | undefined =>
    activeTrip?.destinationCoords?.[dest]?.country;

  const countries: string[] = [];
  let hasUnknown = false;
  for (const dest of destinations) {
    const c = countryOf(dest);
    if (!c) {
      hasUnknown = true;
      continue;
    }
    if (!countries.includes(c)) countries.push(c);
  }
  const folders = hasUnknown ? [...countries, OUTROS_COUNTRY] : countries;

  const countFor = (country: string) =>
    activeLooks.filter(
      (l: LookPin) => (l.country ?? OUTROS_COUNTRY) === country,
    ).length;

  const openFolder = (country: string) =>
    nav.push({ pathname: "/pinterest-picker", params: { country } });

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={s.headerTitle}>looks da viagem</Text>
        </View>
      </View>

      {!activeTrip ? (
        <View style={s.empty}>
          <Ionicons name="shirt-outline" size={32} color={dark.muted} />
          <Text style={s.emptyText}>Nenhuma viagem ativa ainda.</Text>
          <TouchableOpacity
            style={s.emptyBtn}
            onPress={() => nav.push("/trip-form")}
            activeOpacity={0.8}
          >
            <Text style={s.emptyBtnText}>criar viagem</Text>
          </TouchableOpacity>
        </View>
      ) : folders.length === 0 ? (
        <View style={s.empty}>
          <Ionicons name="folder-open-outline" size={32} color={dark.muted} />
          <Text style={s.emptyText}>
            Adicione destinos na aba Itinerário para organizar looks por país.
          </Text>
          <TouchableOpacity
            style={s.emptyBtn}
            onPress={() => nav.push("/itinerary")}
            activeOpacity={0.8}
          >
            <Text style={s.emptyBtnText}>ir para itinerário</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.tripLabel}>{activeTrip.name}</Text>
          <Text style={s.hint}>
            toque numa pasta para adicionar looks daquele país
          </Text>

          <View style={s.grid}>
            {folders.map((country, i) => (
              <FolderCard
                key={country}
                label={country}
                color={FOLDER_COLORS[i % FOLDER_COLORS.length]}
                count={countFor(country)}
                onPress={() => openFolder(country)}
              />
            ))}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
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
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: dark.white,
  },

  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  tripLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: dark.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  hint: {
    fontSize: 12,
    //fontWeight: "600",
    color: dark.muted,
    marginBottom: spacing.lg,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "700",
    color: dark.muted,
    textAlign: "center",
  },
  emptyBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.full,
    backgroundColor: dark.yellow,
  },
  emptyBtnText: { fontSize: 13, fontWeight: "800", color: dark.ink },
});

import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTrips } from "../../hooks/useTrips";
import i18n from "../../i18n";
import { dark, getTripImage, radius, shadow, spacing } from "../../theme";
import { Trip } from "../../types";

function formatDate(s: string) {
  try {
    const locale = i18n.language === "en" ? enUS : ptBR;
    const pattern = i18n.language === "en" ? "d MMM" : "d 'de' MMM";
    return format(new Date(s + "T00:00:00"), pattern, { locale });
  } catch {
    return s;
  }
}

function TripCard({ trip }: { trip: Trip }) {
  const nav = useRouter();
  const coverUri = getTripImage(trip);

  const goToEdit = () =>
    nav.push({ pathname: "/trip-form", params: { tripId: trip.id } });

  return (
    <TouchableOpacity style={s.card} onPress={goToEdit} activeOpacity={0.85}>
      <Image
        source={{ uri: coverUri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <LinearGradient
        colors={["rgba(5,5,5,0)", "rgba(5,5,5,0.9)"]}
        style={s.cardGradient}
      >
        <View style={s.cardInfo}>
          <Text style={s.cardName} numberOfLines={1}>
            {trip.name}
          </Text>
          <Text style={s.cardDate}>
            {formatDate(trip.depart)}
            {trip.ret ? ` – ${formatDate(trip.ret)}` : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={s.editBtn}
          onPress={goToEdit}
          hitSlop={8}
          activeOpacity={0.8}
        >
          <Image
            source={require("../../assets/images/icon-edit.png")}
            style={{ width: 18, height: 18 }}
          />
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default function TripsScreen() {
  const nav = useRouter();
  const insets = useSafeAreaInsets();
  const { trips } = useTrips();
  const { t } = useTranslation("trips");

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={s.headerTitle}>{t("title")}</Text>
        </View>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => nav.push("/trip-form")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color={dark.ink} />
        </TouchableOpacity>
      </View>

      {trips.length === 0 ? (
        <View style={s.empty}>
          <Image
            source={require("../../assets/images/icon-plane.png")}
            style={{ width: 40, height: 40 }}
          />
          <Text style={s.emptyText}>{t("noTrips")}</Text>
          <TouchableOpacity
            style={s.emptyBtn}
            onPress={() => nav.push("/trip-form")}
            activeOpacity={0.8}
          >
            <Text style={s.emptyBtnText}>{t("createFirstTrip")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        >
          {trips.map((trip: Trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
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
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: dark.green,
    shadowColor: dark.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },

  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  card: {
    height: 150,
    borderRadius: radius.xl,
    overflow: "hidden",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    ...shadow.md,
  },
  cardGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  cardInfo: { flex: 1, marginRight: spacing.sm },
  cardName: {
    fontSize: 17,
    fontWeight: "800",
    color: dark.white,
  },
  cardDate: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
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
  },
  emptyBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.full,
    backgroundColor: dark.green,
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: dark.ink,
  },
});

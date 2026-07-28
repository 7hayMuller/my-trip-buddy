import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTrips } from "../hooks/useTrips";
import { dark, radius, shadow, spacing } from "../theme";
import { LookPin } from "../types";
import { getTripDays, TripDay, UNASSIGNED_DAY_KEY } from "../utils/dates";
import { OUTROS_COUNTRY } from "../utils/looks";

export default function LooksDaysScreen() {
  const nav = useRouter();
  const insets = useSafeAreaInsets();
  const { country: countryParam } = useLocalSearchParams<{ country?: string }>();
  const country = countryParam || OUTROS_COUNTRY;
  const { activeTrip, activeLooks } = useTrips();
  const { t } = useTranslation("looksDays");
  const { t: tCommon } = useTranslation("common");
  const displayCountry = country === OUTROS_COUNTRY ? tCommon("other") : country;

  const dayList = useMemo(
    () => getTripDays(activeTrip?.depart ?? "", activeTrip?.ret ?? ""),
    [activeTrip?.depart, activeTrip?.ret],
  );

  const countryLooks = useMemo(
    () =>
      activeLooks.filter((l: LookPin) => (l.country ?? OUTROS_COUNTRY) === country),
    [activeLooks, country],
  );
  const hasUnassigned = countryLooks.some((l: LookPin) => !l.date);

  const looksForDay = (dayKey: string) =>
    countryLooks.filter((l: LookPin) =>
      dayKey === UNASSIGNED_DAY_KEY ? !l.date : l.date === dayKey,
    );

  const openDay = (dayKey: string) => {
    const hasLooks = looksForDay(dayKey).length > 0;
    nav.push({
      pathname: hasLooks ? "/look-viewer" : "/pinterest-picker",
      params: { country, day: dayKey },
    });
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.back()} hitSlop={8} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={dark.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>{displayCountry}</Text>
          <Text style={s.headerSub}>{t("daySubtitle")}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.grid}>
          {dayList.map((day) => (
            <DayCard
              key={day.key}
              day={day}
              looks={looksForDay(day.key)}
              onPress={() => openDay(day.key)}
            />
          ))}
          {hasUnassigned && (
            <DayCard
              unassigned
              looks={looksForDay(UNASSIGNED_DAY_KEY)}
              onPress={() => openDay(UNASSIGNED_DAY_KEY)}
            />
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function DayCard({
  day,
  unassigned,
  looks,
  onPress,
}: {
  day?: TripDay;
  unassigned?: boolean;
  looks: LookPin[];
  onPress: () => void;
}) {
  const { t } = useTranslation("looksDays");
  const count = looks.length;
  const cover = looks[0]?.imageUrl;
  const title = unassigned
    ? t("unassignedTitle")
    : `${(day!.weekdayLabel.charAt(0).toUpperCase() + day!.weekdayLabel.slice(1))}, ${day!.dayLabel} ${day!.monthLabel.slice(0, 3)}`;
  const subtitle = count > 0 ? t("lookCount", { count }) : t("emptyDay");

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[s.cardImage, !cover && s.cardImageEmpty]}>
        {cover ? (
          <Image source={{ uri: cover }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        ) : unassigned ? (
          <Ionicons name="ellipsis-horizontal" size={22} color={dark.muted} />
        ) : (
          <Ionicons name="add" size={22} color={dark.muted} />
        )}
        {count > 1 && (
          <View style={s.countBadge}>
            <Text style={s.countText}>{count}</Text>
          </View>
        )}
      </View>
      <Text style={s.cardTitle} numberOfLines={1}>
        {title}
      </Text>
      <Text style={s.cardSubtitle} numberOfLines={1}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: dark.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: dark.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: { padding: 2 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: dark.white },
  headerSub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.55)",
    marginTop: 1,
  },

  content: { padding: spacing.lg },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },

  card: { width: "47%", marginBottom: spacing.lg },
  cardImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: dark.surfaceAlt,
    borderWidth: 1,
    borderColor: dark.border,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.sm,
  },
  cardImageEmpty: {
    borderStyle: "dashed",
  },
  countBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: dark.ink,
    borderRadius: radius.full,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: dark.white,
  },
  countText: { fontSize: 10, fontWeight: "900", color: dark.white },

  cardTitle: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: "800",
    color: dark.white,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    color: dark.muted,
    marginTop: 1,
  },
});

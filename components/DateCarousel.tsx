import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { colors, dark, radius, shadow, spacing } from "../theme";
import { TripDay, UNASSIGNED_DAY_KEY } from "../utils/dates";

// Mesmas cores usadas nas abas do menu (Home/Viagens/Itinerário/Looks) —
// cada dia cicla por uma delas quando ativo, em vez de todos ficarem azuis.
const DAY_ACTIVE_COLORS = [dark.blue, dark.green, dark.pink, dark.yellow];
const UNASSIGNED_ACTIVE_COLOR = "#2E2E33";

export function DateCarousel({
  days,
  selectedKey,
  onSelect,
  hasUnassigned,
  style,
  absolute = true,
}: {
  days: TripDay[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  hasUnassigned: boolean;
  style?: StyleProp<ViewStyle>;
  // Por padrão flutua sobre o mapa (itinerário). Em telas sem mapa por trás
  // (ex: looks), usar absolute={false} pra ocupar espaço normal no layout.
  absolute?: boolean;
}) {
  const selectedDay = days.find((d) => d.key === selectedKey);
  const monthLabel = selectedDay?.monthLabel ?? days[0]?.monthLabel;

  if (days.length === 0 && !hasUnassigned) return null;

  return (
    <View
      style={[s.wrap, absolute && s.wrapAbsolute, style]}
      pointerEvents="box-none"
    >
      {monthLabel && (
        <View style={s.monthPill}>
          <Text style={s.monthLabel}>
            {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
          </Text>
        </View>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.row}
      >
        {days.map((day, i) => {
          const active = day.key === selectedKey;
          const activeColor = DAY_ACTIVE_COLORS[i % DAY_ACTIVE_COLORS.length];
          return (
            <TouchableOpacity
              key={day.key}
              style={[s.card, active && { backgroundColor: activeColor }]}
              onPress={() => onSelect(day.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[s.weekday, active && s.textActive]}
                numberOfLines={1}
              >
                {day.weekdayLabel}
              </Text>
              <Text
                style={[s.dayNumber, active && s.textActive]}
                numberOfLines={1}
              >
                {day.dayLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
        {hasUnassigned && (
          <TouchableOpacity
            style={[
              s.card,
              s.cardUnassigned,
              selectedKey === UNASSIGNED_DAY_KEY && {
                backgroundColor: UNASSIGNED_ACTIVE_COLOR,
              },
            ]}
            onPress={() => onSelect(UNASSIGNED_DAY_KEY)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={16}
              color={selectedKey === UNASSIGNED_DAY_KEY ? dark.white : colors.muted}
            />
            <Text
              style={[
                s.unassignedLabel,
                selectedKey === UNASSIGNED_DAY_KEY && s.unassignedLabelActive,
              ]}
            >
              sem data
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {},
  wrapAbsolute: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  monthPill: {
    alignSelf: "flex-start",
    backgroundColor: dark.yellow,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: spacing.lg,
    marginBottom: 8,
    ...shadow.md,
  },
  monthLabel: {
    fontSize: 22,
    fontWeight: "800",
    fontStyle: "italic",
    color: dark.ink,
  },
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: 48,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: dark.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.md,
  },
  cardUnassigned: {
    width: 64,
  },
  weekday: {
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 13,
    textTransform: "uppercase",
    color: colors.muted,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 22,
    color: dark.ink,
  },
  unassignedLabel: {
    fontSize: 9,
    fontWeight: "700",
    lineHeight: 12,
    color: colors.muted,
    marginTop: 4,
  },
  unassignedLabelActive: {
    color: dark.white,
  },
  textActive: {
    color: dark.ink,
  },
});

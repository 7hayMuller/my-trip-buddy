import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import i18n from "../i18n";
import { dark, radius, spacing } from "../theme";
import { TripDay } from "../utils/dates";

const WEEKDAY_HEADERS: Record<string, string[]> = {
  pt: ["D", "S", "T", "Q", "Q", "S", "S"],
  en: ["S", "M", "T", "W", "T", "F", "S"],
};

interface MonthBlock {
  key: string;
  monthLabel: string;
  year: number;
  weeks: (TripDay | null)[][];
}

// Agrupa os dias da viagem em blocos de mês, montando uma grade real de
// calendário (domingo-sábado, com células vazias antes do 1º dia do trecho)
// em vez de uma lista solta — assim os dias da viagem já aparecem no lugar
// certo da semana, como um datepicker de verdade.
function buildMonths(days: TripDay[]): MonthBlock[] {
  if (days.length === 0) return [];
  const byMonth = new Map<string, TripDay[]>();
  for (const d of days) {
    const key = `${d.date.getFullYear()}-${d.date.getMonth()}`;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(d);
  }
  return Array.from(byMonth.entries()).map(([key, monthDays]) => {
    const first = monthDays[0].date;
    const leading = first.getDay();
    const cells: (TripDay | null)[] = [...Array(leading).fill(null), ...monthDays];
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks: (TripDay | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return {
      key,
      monthLabel: monthDays[0].monthLabel,
      year: first.getFullYear(),
      weeks,
    };
  });
}

export function TripCalendar({
  days,
  selectedKey,
  onSelect,
}: {
  days: TripDay[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}) {
  const months = useMemo(() => buildMonths(days), [days]);
  const weekdayHeaders = WEEKDAY_HEADERS[i18n.language] ?? WEEKDAY_HEADERS.pt;

  if (months.length === 0) return null;

  return (
    <View>
      {months.map((month) => (
        <View key={month.key} style={s.monthBlock}>
          <Text style={s.monthTitle}>
            {month.monthLabel.charAt(0).toUpperCase() + month.monthLabel.slice(1)}{" "}
            {month.year}
          </Text>
          <View style={s.weekRow}>
            {weekdayHeaders.map((w, i) => (
              <Text key={i} style={s.weekHeaderText}>
                {w}
              </Text>
            ))}
          </View>
          {month.weeks.map((week, wi) => (
            <View key={wi} style={s.weekRow}>
              {week.map((day, di) => {
                if (!day) return <View key={di} style={s.cell} />;
                const active = day.key === selectedKey;
                return (
                  <TouchableOpacity
                    key={di}
                    style={s.cell}
                    onPress={() => onSelect(active ? null : day.key)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.dayCircle, active && s.dayCircleActive]}>
                      <Text style={[s.dayText, active && s.dayTextActive]}>
                        {day.dayLabel}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  monthBlock: { marginBottom: spacing.sm },
  monthTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: dark.white,
    marginBottom: 6,
  },
  weekRow: { flexDirection: "row" },
  weekHeaderText: {
    flex: 1,
    textAlign: "center",
    fontSize: 9,
    fontWeight: "700",
    color: dark.muted,
    marginBottom: 4,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircle: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: dark.surfaceAlt,
  },
  dayCircleActive: { backgroundColor: dark.blue },
  dayText: { fontSize: 12, fontWeight: "700", color: dark.white },
  dayTextActive: { color: dark.ink },
});

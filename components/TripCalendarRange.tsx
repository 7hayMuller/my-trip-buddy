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

// Mesmo agrupamento em grade real de calendário usado no TripCalendar — ver
// comentário lá para o porquê.
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

// Calendário com seleção de período (check-in/check-out): os dias entre
// início e fim ganham uma faixa contínua de fundo (em vez de círculo isolado
// como no TripCalendar de dia único), pra deixar claro visualmente que é um
// intervalo, no estilo dos datepickers de range mais comuns.
export function TripCalendarRange({
  days,
  startKey,
  endKey,
  onSelectDay,
}: {
  days: TripDay[];
  startKey: string | null;
  endKey: string | null;
  onSelectDay: (key: string) => void;
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
                const isStart = day.key === startKey;
                const isEnd = day.key === endKey;
                const isInRange =
                  !!startKey &&
                  !!endKey &&
                  day.key > startKey &&
                  day.key < endKey;
                const isEdge = isStart || isEnd;
                return (
                  <TouchableOpacity
                    key={di}
                    style={s.cell}
                    onPress={() => onSelectDay(day.key)}
                    activeOpacity={0.7}
                  >
                    {(isInRange || isEdge) && (
                      <View
                        style={[
                          s.rangeBg,
                          isInRange && { left: 0, right: 0 },
                          isStart && {
                            left: "50%",
                            right: 0,
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                          },
                          isEnd && {
                            left: 0,
                            right: "50%",
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                          },
                          isStart && isEnd && { left: "50%", right: "50%" },
                        ]}
                      />
                    )}
                    <View style={[s.dayCircle, isEdge && s.dayCircleActive]}>
                      <Text style={[s.dayText, isEdge && s.dayTextActive]}>
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
  rangeBg: {
    position: "absolute",
    top: "12%",
    bottom: "12%",
    backgroundColor: "rgba(69,144,248,0.2)",
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

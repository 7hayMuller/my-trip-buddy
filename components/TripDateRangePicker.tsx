import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import i18n from "../i18n";
import { dark, radius, shadow, spacing } from "../theme";
import { TripDay } from "../utils/dates";
import { TripCalendarRange } from "./TripCalendarRange";

// Mesmo padrão do TripDatePicker (input fechado que abre um popup só quando
// tocado), mas selecionando um período (check-in/check-out) em vez de um dia
// único — usado no formulário de hotel, que até então não perguntava as
// datas de estadia.
export function TripDateRangePicker({
  days,
  startKey,
  endKey,
  onChange,
  placeholder,
}: {
  days: TripDay[];
  startKey: string | null;
  endKey: string | null;
  onChange: (start: string | null, end: string | null) => void;
  placeholder?: string;
}) {
  const { t } = useTranslation("tripDateRangePicker");
  const [open, setOpen] = useState(false);
  const startDay = days.find((d) => d.key === startKey);
  const endDay = days.find((d) => d.key === endKey);

  const fmt = (d: TripDay) => {
    const isEn = i18n.language === "en";
    return format(d.date, isEn ? "MMM d" : "d MMM", { locale: isEn ? enUS : ptBR });
  };
  const label = startDay
    ? endDay
      ? `${fmt(startDay)} – ${fmt(endDay)}`
      : `${fmt(startDay)} – ${t("selectDeparture")}`
    : (placeholder ?? t("selectPeriod"));

  const handleSelectDay = (key: string) => {
    if (!startKey || (startKey && endKey)) {
      onChange(key, null);
      return;
    }
    if (key < startKey) {
      onChange(key, null);
    } else if (key === startKey) {
      onChange(null, null);
    } else {
      onChange(startKey, key);
      setOpen(false);
    }
  };

  const handleClear = () => onChange(null, null);

  return (
    <>
      <TouchableOpacity
        style={s.trigger}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Image
          source={require("../assets/images/icon-calendar.png")}
          style={{ width: 18, height: 18 }}
        />
        <Text style={[s.triggerText, !startDay && s.triggerPlaceholder]}>
          {label}
        </Text>
        {startDay ? (
          <TouchableOpacity onPress={handleClear} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={dark.muted} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={12} color={dark.muted} />
        )}
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={s.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <TouchableOpacity style={s.sheet} activeOpacity={1} onPress={() => {}}>
            <View style={s.sheetHeader}>
              <Text style={s.title}>
                {!startKey
                  ? t("checkIn")
                  : !endKey
                    ? t("checkOut")
                    : t("stayPeriod")}
              </Text>
              {startDay && (
                <TouchableOpacity onPress={handleClear}>
                  <Text style={s.clearText}>{t("clear")}</Text>
                </TouchableOpacity>
              )}
            </View>
            <TripCalendarRange
              days={days}
              startKey={startKey}
              endKey={endKey}
              onSelectDay={handleSelectDay}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: dark.border,
    backgroundColor: dark.surfaceAlt,
  },
  triggerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: dark.white,
  },
  triggerPlaceholder: { color: dark.muted, fontWeight: "600" },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: dark.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: dark.border,
    padding: spacing.lg,
    ...shadow.md,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: { fontSize: 16, fontWeight: "900", color: dark.white },
  clearText: { fontSize: 12, fontWeight: "700", color: dark.blue },
});

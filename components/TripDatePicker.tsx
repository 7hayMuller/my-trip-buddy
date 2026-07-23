import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { dark, radius, shadow, spacing } from "../theme";
import { TripDay } from "../utils/dates";
import { TripCalendar } from "./TripCalendar";

// Input fechado por padrão — abre o calendário num popup (bottom sheet) só
// quando tocado, como um datepicker (ex: antd), em vez de ficar sempre
// aberto ocupando espaço no formulário.
export function TripDatePicker({
  days,
  selectedKey,
  onSelect,
  placeholder = "selecionar dia",
}: {
  days: TripDay[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedDay = days.find((d) => d.key === selectedKey);
  const label = selectedDay
    ? `${selectedDay.dayLabel} de ${selectedDay.monthLabel}`
    : placeholder;

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
        <Text style={[s.triggerText, !selectedDay && s.triggerPlaceholder]}>
          {label}
        </Text>
        {selectedDay ? (
          <TouchableOpacity onPress={() => onSelect(null)} hitSlop={8}>
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
              <Text style={s.title}>dia da viagem</Text>
              {selectedDay && (
                <TouchableOpacity onPress={() => onSelect(null)}>
                  <Text style={s.clearText}>limpar</Text>
                </TouchableOpacity>
              )}
            </View>
            <TripCalendar
              days={days}
              selectedKey={selectedKey}
              onSelect={(key) => {
                onSelect(key);
                setOpen(false);
              }}
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

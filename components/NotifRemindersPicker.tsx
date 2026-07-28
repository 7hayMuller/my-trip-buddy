import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { dark, radius, shadow, spacing } from "../theme";
import { MILESTONES } from "../utils/notifications";

const MILESTONE_SET: readonly number[] = MILESTONES;

function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={[s.checkbox, checked && s.checkboxChecked]}>
      {checked && <Ionicons name="checkmark" size={13} color={dark.ink} />}
    </View>
  );
}

// Select fechado (mesmo padrão do CurrencySelect/TripDatePicker) que abre um
// popup com uma lista de checkboxes — um por marco fixo, mais uma linha
// especial "personalizado" onde a pessoa digita a quantidade de dias que
// quiser. Substitui a barra deslizante anterior, que não fazia sentido pra
// selecionar vários marcos ao mesmo tempo.
export function NotifRemindersPicker({
  value,
  onToggleMilestone,
  onSetCustom,
}: {
  value: number[];
  onToggleMilestone: (days: number) => void;
  onSetCustom: (days: number | null) => void;
}) {
  const { t } = useTranslation("notifRemindersPicker");
  const [open, setOpen] = useState(false);
  const customValue = value.find((d) => !MILESTONE_SET.includes(d)) ?? null;
  const [customChecked, setCustomChecked] = useState(customValue != null);
  const [customText, setCustomText] = useState(
    customValue != null ? String(customValue) : "",
  );

  useEffect(() => {
    setCustomChecked(customValue != null);
    setCustomText(customValue != null ? String(customValue) : "");
  }, [customValue]);

  const sortedActive = [...value].sort((a, b) => b - a);
  const label =
    sortedActive.length === 0
      ? t("noAlertSelected")
      : sortedActive.length === 1
        ? t("daysBefore", { count: sortedActive[0] })
        : t("alertsSelected", { count: sortedActive.length });

  const commitCustom = (checked: boolean, text: string) => {
    const n = parseInt(text, 10);
    onSetCustom(checked && n > 0 ? n : null);
  };

  const toggleCustomCheckbox = () => {
    const next = !customChecked;
    setCustomChecked(next);
    commitCustom(next, customText);
  };

  return (
    <>
      <TouchableOpacity
        style={s.trigger}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={s.triggerText}>{label}</Text>
        <Ionicons name="chevron-down" size={12} color={dark.muted} />
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
            <Text style={s.title}>{t("title")}</Text>

            {MILESTONES.map((m) => {
              const checked = value.includes(m);
              return (
                <TouchableOpacity
                  key={m}
                  style={s.row}
                  onPress={() => onToggleMilestone(m)}
                  activeOpacity={0.7}
                >
                  <Checkbox checked={checked} />
                  <Text style={s.rowText}>
                    {m === 1 ? t("daysBeforeTomorrow") : t("daysBefore", { count: m })}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={[s.row, s.customRow]}>
              <TouchableOpacity onPress={toggleCustomCheckbox} hitSlop={8}>
                <Checkbox checked={customChecked} />
              </TouchableOpacity>
              <Text style={s.rowText}>{t("custom")}</Text>
              <TextInput
                style={s.customInput}
                value={customText}
                onChangeText={(t) => {
                  const digits = t.replace(/\D/g, "").slice(0, 3);
                  setCustomText(digits);
                  if (customChecked) commitCustom(true, digits);
                }}
                onBlur={() => {
                  if (customChecked && !customText) {
                    setCustomChecked(false);
                    commitCustom(false, "");
                  }
                }}
                placeholder="0"
                placeholderTextColor={dark.muted}
                keyboardType="number-pad"
                maxLength={3}
              />
              <Text style={s.rowText}>{t("daysBeforeSuffix")}</Text>
            </View>

            <TouchableOpacity
              style={s.doneBtn}
              onPress={() => setOpen(false)}
              activeOpacity={0.85}
            >
              <Text style={s.doneBtnText}>{t("done")}</Text>
            </TouchableOpacity>
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
  triggerText: { flex: 1, fontSize: 13, fontWeight: "700", color: dark.white },

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
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: dark.white,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: dark.border,
  },
  rowText: { fontSize: 13, fontWeight: "700", color: dark.white },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: dark.border,
    backgroundColor: dark.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: dark.blue, borderColor: dark.blue },

  customRow: { borderBottomWidth: 0 },
  customInput: {
    width: 48,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: dark.border,
    backgroundColor: dark.surfaceAlt,
    fontSize: 13,
    fontWeight: "700",
    color: dark.white,
    textAlign: "center",
  },

  doneBtn: {
    marginTop: spacing.md,
    backgroundColor: dark.blue,
    borderRadius: radius.lg,
    paddingVertical: 12,
    alignItems: "center",
  },
  doneBtnText: { fontSize: 13, fontWeight: "800", color: dark.ink },
});

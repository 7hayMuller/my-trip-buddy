import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { dark, radius, shadow, spacing } from "../theme";
import { CURRENCIES, CurrencyInfo, getCurrencies } from "../utils/currency";

export function CurrencySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const { t } = useTranslation("currencySelect");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [currencies, setCurrencies] = useState<CurrencyInfo[]>(
    CURRENCIES.map((code) => ({ code, name: code })),
  );

  useEffect(() => {
    getCurrencies().then(setCurrencies);
  }, []);

  const filtered = currencies.filter(
    (c) =>
      c.code.toLowerCase().includes(query.toLowerCase()) ||
      c.name.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <TouchableOpacity
        style={s.trigger}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={s.triggerText}>{value}</Text>
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
            <TextInput
              style={s.search}
              value={query}
              onChangeText={setQuery}
              placeholder={t("searchPlaceholder")}
              placeholderTextColor={dark.muted}
              autoFocus
            />
            <FlatList
              data={filtered}
              keyExtractor={(c) => c.code}
              style={s.list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[s.row, item.code === value && s.rowActive]}
                  onPress={() => {
                    onChange(item.code);
                    setQuery("");
                    setOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={s.rowCode}>{item.code}</Text>
                  <Text style={s.rowName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  {item.code === value && (
                    <Ionicons name="checkmark" size={16} color={dark.blue} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={s.empty}>{t("empty")}</Text>
              }
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
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: dark.border,
    backgroundColor: dark.surfaceAlt,
  },
  triggerText: { fontSize: 13, fontWeight: "800", color: dark.white },

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
    maxHeight: "70%",
    ...shadow.md,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: dark.white,
    marginBottom: spacing.md,
  },
  search: {
    backgroundColor: dark.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: dark.border,
    padding: spacing.md,
    fontSize: 13,
    fontWeight: "600",
    color: dark.white,
    marginBottom: spacing.sm,
  },
  list: { marginBottom: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: dark.border,
  },
  rowActive: {},
  rowCode: {
    width: 44,
    fontSize: 13,
    fontWeight: "800",
    color: dark.white,
  },
  rowName: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: dark.muted,
  },
  empty: {
    fontSize: 13,
    fontWeight: "600",
    color: dark.muted,
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
});

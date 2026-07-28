import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CurrencySelect } from "../components/CurrencySelect";
import { TripDatePicker } from "../components/TripDatePicker";
import { useTrips } from "../hooks/useTrips";
import { colors, dark, radius, shadow, spacing } from "../theme";
import { ExpenseCategory, ExpenseEntry } from "../types";
import {
  convertAmount,
  formatAmount,
  formatMoney,
  getCurrencySymbol,
  sumExpenses,
} from "../utils/currency";
import { getTripDays, TripDay } from "../utils/dates";

const CATEGORY_META: Record<ExpenseCategory, { labelKey: string; color: string }> =
  {
    transporte: { labelKey: "categoryTransport", color: dark.blue },
    hospedagem: { labelKey: "categoryAccommodation", color: dark.yellow },
    alimentacao: { labelKey: "categoryFood", color: dark.green },
    passeios: { labelKey: "categoryActivities", color: dark.pink },
    compras: { labelKey: "categoryShopping", color: colors.purple },
    outros: { labelKey: "categoryOther", color: dark.mutedStrong },
  };

// "outros" não tem ícone customizado — cai no fallback Ionicons.
const CATEGORY_ICON_IMG: Partial<
  Record<ExpenseCategory, ReturnType<typeof require>>
> = {
  transporte: require("../assets/images/icon-transporte.png"),
  hospedagem: require("../assets/images/icon-hospedagem.png"),
  alimentacao: require("../assets/images/icon-alimentacao.png"),
  passeios: require("../assets/images/icon-passeios.png"),
  compras: require("../assets/images/icon-compras.png"),
};

function CategoryIcon({
  category,
  size,
  color,
}: {
  category: ExpenseCategory;
  size: number;
  color: string;
}) {
  const img = CATEGORY_ICON_IMG[category];
  if (img) return <Image source={img} style={{ width: size, height: size }} />;
  return (
    <Ionicons name="ellipsis-horizontal-outline" size={size} color={color} />
  );
}

const CATEGORY_ORDER: ExpenseCategory[] = [
  "transporte",
  "hospedagem",
  "alimentacao",
  "passeios",
  "compras",
  "outros",
];

export default function BudgetScreen() {
  const nav = useRouter();
  const insets = useSafeAreaInsets();
  const { activeTrip, updateTrip } = useTrips();
  const { t } = useTranslation("budget");

  const budgetCurrency = activeTrip?.budgetCurrency ?? "BRL";
  const expenses: ExpenseEntry[] = activeTrip?.expenses ?? [];
  const dayList: TripDay[] = activeTrip
    ? getTripDays(activeTrip.depart, activeTrip.ret)
    : [];

  // Guarda os dígitos crus (centavos) em vez do valor formatado — o mesmo
  // padrão de "digitar da direita pra esquerda" usado em apps de banco, pra
  // sempre exibir o número já formatado (milhar/decimal) enquanto digita.
  const [budgetDigits, setBudgetDigits] = useState(
    activeTrip?.budgetTotal != null
      ? String(Math.round(activeTrip.budgetTotal * 100))
      : "",
  );
  const budgetValue = budgetDigits ? Number(budgetDigits) / 100 : 0;
  const [showAdd, setShowAdd] = useState(false);
  const [amountDigits, setAmountDigits] = useState("");
  const amountValue = amountDigits ? Number(amountDigits) / 100 : 0;
  const [expCurrency, setExpCurrency] = useState(budgetCurrency);
  const [category, setCategory] = useState<ExpenseCategory>("outros");
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  if (!activeTrip) {
    return (
      <View style={[s.root, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => nav.back()}>
          <Ionicons name="arrow-back" size={16} color={dark.white} />
        </TouchableOpacity>
        <View style={s.empty}>
          <Image
            source={require("../assets/images/icon-coins.png")}
            style={{ width: 40, height: 40 }}
          />
          <Text style={s.emptyText}>{t("noActiveTrip")}</Text>
        </View>
      </View>
    );
  }

  const totalSpent = sumExpenses(expenses, budgetCurrency);
  const unconverted = expenses.some(
    (e) => e.currency !== budgetCurrency && e.convertedAmount == null,
  );

  const budgetTotal = activeTrip.budgetTotal ?? 0;
  const progress = budgetTotal > 0 ? Math.min(1, totalSpent / budgetTotal) : 0;
  const remaining = budgetTotal - totalSpent;
  const over = budgetTotal > 0 && remaining < 0;

  const categoryTotals = CATEGORY_ORDER.map((cat) => {
    const total = sumExpenses(
      expenses.filter((e) => e.category === cat),
      budgetCurrency,
    );
    return { cat, total };
  }).filter((c) => c.total > 0);
  const maxCategoryTotal = Math.max(1, ...categoryTotals.map((c) => c.total));

  const sortedExpenses = [...expenses].sort((a, b) =>
    (b.date ?? "").localeCompare(a.date ?? ""),
  );

  const handleBudgetChange = (text: string) => {
    setBudgetDigits(text.replace(/\D/g, "").slice(0, 12));
  };

  const handleSaveBudget = async () => {
    await updateTrip(activeTrip.id, {
      budgetTotal: budgetValue,
      budgetCurrency,
    });
  };

  const handlePickBudgetCurrency = async (cur: string) => {
    await updateTrip(activeTrip.id, { budgetCurrency: cur });
  };

  const resetForm = () => {
    setAmountDigits("");
    setExpCurrency(budgetCurrency);
    setCategory("outros");
    setDayKey(null);
    setNote("");
  };

  const handleAmountChange = (text: string) => {
    setAmountDigits(text.replace(/\D/g, "").slice(0, 12));
  };

  const handleAddExpense = async () => {
    const amount = amountValue;
    if (amount <= 0) {
      Alert.alert(t("invalidAmountTitle"), t("invalidAmountMessage"));
      return;
    }
    setSaving(true);
    try {
      let convertedAmount: number | undefined;
      if (expCurrency !== budgetCurrency) {
        const converted = await convertAmount(
          amount,
          expCurrency,
          budgetCurrency,
        );
        convertedAmount = converted ?? undefined;
      }
      const entry: ExpenseEntry = {
        id: Date.now().toString(),
        amount,
        currency: expCurrency,
        convertedAmount,
        category,
        date: dayKey ?? undefined,
        note: note.trim() || undefined,
      };
      await updateTrip(activeTrip.id, { expenses: [...expenses, entry] });
      resetForm();
      setShowAdd(false);
    } catch (err) {
      console.error("Erro ao salvar despesa:", err);
      Alert.alert(t("saveErrorTitle"), t("tryAgain"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    await updateTrip(activeTrip.id, {
      expenses: expenses.filter((e) => e.id !== id),
    });
  };

  const fmtDayLabel = (key?: string) => {
    if (!key) return null;
    const day = dayList.find((d) => d.key === key);
    return day ? `${day.dayLabel} ${day.monthLabel}` : key;
  };

  return (
    <View style={{ flex: 1, backgroundColor: dark.bg }}>
      <View style={[s.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => nav.back()}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={18} color={dark.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>{t("title")}</Text>
          <Text style={s.headerEyebrow} numberOfLines={1}>
            {activeTrip.name}
          </Text>
        </View>
      </View>

      <ScrollView
        style={s.sheet}
        contentContainerStyle={s.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.secLabel}>{t("totalBudget")}</Text>
        <View style={s.card}>
          <View style={s.budgetRow}>
            <View style={s.budgetInputWrap}>
              <Text style={s.budgetPrefix}>{getCurrencySymbol(budgetCurrency)}</Text>
              <TextInput
                style={s.budgetInputField}
                value={budgetDigits ? formatAmount(budgetValue) : ""}
                onChangeText={handleBudgetChange}
                onBlur={handleSaveBudget}
                placeholder={t("zeroPlaceholder")}
                placeholderTextColor={dark.muted}
                keyboardType="number-pad"
              />
            </View>
            <CurrencySelect
              value={budgetCurrency}
              onChange={handlePickBudgetCurrency}
            />
          </View>

          {budgetTotal > 0 && (
            <>
              <View style={s.progressTrack}>
                <View
                  style={[
                    s.progressFill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: over ? dark.pink : dark.lime,
                    },
                  ]}
                />
              </View>
              <View style={s.progressLabels}>
                <Text style={s.progressSpent}>
                  {t("spentAmount", { amount: formatMoney(totalSpent, budgetCurrency) })}
                </Text>
                <Text
                  style={[s.progressRemaining, over && { color: dark.pink }]}
                >
                  {over
                    ? t("overBudgetAmount", { amount: formatMoney(-remaining, budgetCurrency) })
                    : t("remainingAmount", { amount: formatMoney(remaining, budgetCurrency) })}
                </Text>
              </View>
            </>
          )}
          {unconverted && (
            <Text style={s.warnText}>
              {t("unconvertedWarning")}
            </Text>
          )}
        </View>

        {categoryTotals.length > 0 && (
          <>
            <Text style={s.secLabel}>{t("byCategory")}</Text>
            <View style={s.card}>
              {categoryTotals.map(({ cat, total }, i) => {
                const meta = CATEGORY_META[cat];
                return (
                  <View
                    key={cat}
                    style={[
                      s.catRow,
                      i === categoryTotals.length - 1 && { marginBottom: 0 },
                    ]}
                  >
                    <View style={s.catRowHeader}>
                      <CategoryIcon
                        category={cat}
                        size={16}
                        color={meta.color}
                      />
                      <Text style={s.catRowLabel}>{t(meta.labelKey)}</Text>
                      <Text style={s.catRowValue}>
                        {formatMoney(total, budgetCurrency)}
                      </Text>
                    </View>
                    <View style={s.catBarTrack}>
                      <View
                        style={[
                          s.catBarFill,
                          {
                            width: `${(total / maxCategoryTotal) * 100}%`,
                            backgroundColor: meta.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <Text style={s.secLabel}>{t("expenses")}</Text>
        {sortedExpenses.length === 0 ? (
          <View style={s.card}>
            <Text style={s.emptyExpensesText}>
              {t("noExpenses")}
            </Text>
          </View>
        ) : (
          <View style={s.card}>
            {sortedExpenses.map((e, i) => {
              const meta = CATEGORY_META[e.category];
              const dayLabel = fmtDayLabel(e.date);
              return (
                <View
                  key={e.id}
                  style={[
                    s.expenseRow,
                    i === sortedExpenses.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View
                    style={[s.expenseIconWrap, { backgroundColor: meta.color }]}
                  >
                    <CategoryIcon
                      category={e.category}
                      size={18}
                      color={dark.ink}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.expenseNote} numberOfLines={1}>
                      {e.note || t(meta.labelKey)}
                    </Text>
                    <Text style={s.expenseMeta}>
                      {[t(meta.labelKey), dayLabel].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={s.expenseAmount}>
                      {formatMoney(e.amount, e.currency)}
                    </Text>
                    {e.currency !== budgetCurrency && (
                      <Text style={s.expenseConverted}>
                        {e.convertedAmount != null
                          ? `≈ ${formatMoney(e.convertedAmount, budgetCurrency)}`
                          : t("notConverted")}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteExpense(e.id)}
                    hitSlop={8}
                    style={s.expenseDelete}
                  >
                    <Ionicons name="close" size={14} color={dark.muted} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity
        style={[s.fab, { bottom: insets.bottom + spacing.lg }]}
        onPress={() => setShowAdd(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={22} color={dark.ink} />
      </TouchableOpacity>

      <Modal
        visible={showAdd}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAdd(false)}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAdd(false)}
        >
          <TouchableOpacity
            style={[s.modalCard, { marginBottom: insets.bottom + spacing.md }]}
            activeOpacity={1}
            onPress={() => {}}
          >
            <Text style={s.modalTitle}>{t("newExpense")}</Text>

            <Text style={s.label}>{t("amount")}</Text>
            <View style={s.budgetRow}>
              <View style={s.budgetInputWrap}>
                <Text style={s.budgetPrefix}>{getCurrencySymbol(expCurrency)}</Text>
                <TextInput
                  style={s.budgetInputField}
                  value={amountDigits ? formatAmount(amountValue) : ""}
                  onChangeText={handleAmountChange}
                  placeholder={t("zeroPlaceholder")}
                  placeholderTextColor={dark.muted}
                  keyboardType="number-pad"
                  autoFocus
                />
              </View>
              <CurrencySelect value={expCurrency} onChange={setExpCurrency} />
            </View>

            <Text style={s.label}>{t("category")}</Text>
            <View style={s.chipsWrap}>
              {CATEGORY_ORDER.map((cat) => {
                const meta = CATEGORY_META[cat];
                const active = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      s.catChip,
                      active && { backgroundColor: meta.color },
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <CategoryIcon
                      category={cat}
                      size={16}
                      color={active ? dark.ink : meta.color}
                    />
                    <Text
                      style={[s.catChipText, active && { color: dark.ink }]}
                    >
                      {t(meta.labelKey)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {dayList.length > 0 && (
              <>
                <Text style={s.label}>{t("dayOptional")}</Text>
                <TripDatePicker
                  days={dayList}
                  selectedKey={dayKey}
                  onSelect={setDayKey}
                />
              </>
            )}

            <Text style={s.label}>{t("noteOptional")}</Text>
            <TextInput
              style={s.input}
              value={note}
              onChangeText={setNote}
              placeholder={t("notePlaceholder")}
              placeholderTextColor={dark.muted}
            />

            <TouchableOpacity
              style={[s.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleAddExpense}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={s.saveBtnText}>
                {saving ? t("saving") : t("saveExpense")}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: dark.bg, paddingHorizontal: spacing.lg },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  emptyText: { fontSize: 14, fontWeight: "700", color: dark.muted },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: { padding: 2 },
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

  sheet: { flex: 1 },
  sheetContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  secLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: dark.muted,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  card: {
    backgroundColor: dark.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: dark.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },

  budgetRow: { gap: spacing.sm, marginBottom: spacing.sm },
  budgetInput: {
    backgroundColor: dark.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: dark.border,
    padding: spacing.md,
    fontSize: 20,
    fontWeight: "800",
    color: dark.white,
  },
  budgetInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: dark.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: dark.border,
    paddingHorizontal: spacing.md,
  },
  budgetPrefix: {
    fontSize: 20,
    fontWeight: "800",
    color: dark.muted,
  },
  budgetInputField: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 20,
    fontWeight: "800",
    color: dark.white,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: dark.surfaceAlt,
    overflow: "hidden",
    marginBottom: spacing.xs,
  },
  progressFill: { height: "100%", borderRadius: 4 },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressSpent: { fontSize: 12, fontWeight: "700", color: dark.white },
  progressRemaining: { fontSize: 12, fontWeight: "700", color: dark.lime },
  warnText: {
    fontSize: 10,
    fontWeight: "600",
    color: dark.yellow,
    marginTop: spacing.sm,
  },

  catRow: { marginBottom: spacing.md },
  catRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
  },
  catRowLabel: { flex: 1, fontSize: 12, fontWeight: "700", color: dark.white },
  catRowValue: { fontSize: 12, fontWeight: "800", color: dark.white },
  catBarTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: dark.surfaceAlt,
    overflow: "hidden",
  },
  catBarFill: { height: "100%", borderRadius: 3 },

  emptyExpensesText: {
    fontSize: 13,
    fontWeight: "600",
    color: dark.muted,
    textAlign: "center",
    paddingVertical: spacing.md,
  },
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: dark.border,
  },
  expenseIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  expenseNote: { fontSize: 13, fontWeight: "700", color: dark.white },
  expenseMeta: {
    fontSize: 10,
    fontWeight: "600",
    color: dark.muted,
    marginTop: 1,
    textTransform: "capitalize",
  },
  expenseAmount: { fontSize: 13, fontWeight: "800", color: dark.white },
  expenseConverted: { fontSize: 10, fontWeight: "600", color: dark.muted },
  expenseDelete: { paddingHorizontal: 4, paddingVertical: 4 },

  fab: {
    position: "absolute",
    right: spacing.lg,
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: dark.green,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: dark.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: dark.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: dark.border,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    borderRadius: radius.xl,
    ...shadow.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: dark.white,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    color: dark.white,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: dark.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: dark.border,
    padding: spacing.md,
    fontSize: 13,
    fontWeight: "600",
    color: dark.white,
  },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: dark.border,
    backgroundColor: dark.surfaceAlt,
  },
  catChipText: { fontSize: 11, fontWeight: "700", color: dark.muted },

  saveBtn: {
    marginTop: spacing.lg,
    backgroundColor: dark.green,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: dark.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  saveBtnText: { fontSize: 14, fontWeight: "900", color: dark.ink },
});

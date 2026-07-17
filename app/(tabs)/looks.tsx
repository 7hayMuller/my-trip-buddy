import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTrips } from "../../hooks/useTrips";
import { colors, radius, shadow, spacing } from "../../theme";
import { LookPin } from "../../types";

export default function LooksScreen() {
  const nav = useRouter();
  const insets = useSafeAreaInsets();
  const { activeTrip, activeLooks, removeLook } = useTrips();

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={s.headerEyebrow}>seu estilo</Text>
          <Text style={s.headerTitle}>looks da viagem</Text>
        </View>
        {activeTrip && (
          <LinearGradient
            colors={["#F4325C", "#E60023"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.addBtnGrad}
          >
            <TouchableOpacity
              style={s.addBtn}
              onPress={() => nav.push("/pinterest-picker")}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color={colors.white} />
            </TouchableOpacity>
          </LinearGradient>
        )}
      </View>

      {!activeTrip ? (
        <View style={s.empty}>
          <Ionicons name="shirt-outline" size={32} color={colors.muted} />
          <Text style={s.emptyText}>Nenhuma viagem ativa ainda.</Text>
          <TouchableOpacity
            style={s.emptyBtn}
            onPress={() => nav.push("/trip-form")}
            activeOpacity={0.8}
          >
            <Text style={s.emptyBtnText}>criar viagem</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.tripLabel}>{activeTrip.name}</Text>

          {activeLooks.length === 0 ? (
            <TouchableOpacity
              style={s.bigEmpty}
              onPress={() => nav.push("/pinterest-picker")}
              activeOpacity={0.85}
            >
              <View style={s.bigEmptyIcon}>
                <Ionicons name="logo-pinterest" size={26} color="#E60023" />
              </View>
              <Text style={s.bigEmptyTitle}>Monte seus looks</Text>
              <Text style={s.bigEmptyText}>
                Salve inspirações da galeria ou do Pinterest para essa viagem.
              </Text>
              <View style={s.bigEmptyCta}>
                <Text style={s.bigEmptyCtaText}>adicionar looks</Text>
                <Ionicons name="arrow-forward" size={14} color="#E60023" />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={s.grid}>
              {activeLooks.map((look: LookPin) => (
                <View key={look.id} style={s.lookCard}>
                  <Image
                    source={{ uri: look.imageUrl }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    style={s.removeBtn}
                    onPress={() => removeLook(look.id)}
                    hitSlop={4}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={s.addTile}
                onPress={() => nav.push("/pinterest-picker")}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={24} color={colors.muted} />
                <Text style={s.addTileText}>adicionar</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.offwhite },
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
    color: colors.muted,
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.navy,
    fontStyle: "italic",
  },
  addBtnGrad: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    overflow: "hidden",
    shadowColor: "#E60023",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  addBtn: { flex: 1, alignItems: "center", justifyContent: "center" },

  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  tripLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#E60023",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.md,
  },

  bigEmpty: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    padding: spacing.xl,
    gap: 6,
    ...shadow.sm,
  },
  bigEmptyIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: "#FFF0F3",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  bigEmptyTitle: { fontSize: 15, fontWeight: "800", color: colors.navy },
  bigEmptyText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  bigEmptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF0F3",
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  bigEmptyCtaText: { fontSize: 12, fontWeight: "800", color: "#E60023" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  lookCard: {
    width: "48%",
    aspectRatio: 0.75,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.sm,
    backgroundColor: colors.border,
    ...shadow.sm,
  },
  removeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 10,
  },
  addTile: {
    width: "48%",
    aspectRatio: 0.75,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginBottom: spacing.sm,
  },
  addTileText: { fontSize: 11, fontWeight: "700", color: colors.muted },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyText: { fontSize: 14, fontWeight: "700", color: colors.muted },
  emptyBtn: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.full,
    backgroundColor: colors.navy,
  },
  emptyBtnText: { fontSize: 13, fontWeight: "800", color: colors.white },
});

import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTrips } from "../hooks/useTrips";
import { colors, radius, shadow, spacing } from "../theme";
import { LookPin } from "../types";
import { pinterestSearchUrl } from "../utils/pinterest";

const defaultQuery = (trip: any) =>
  trip?.destinations?.length
    ? `looks ${trip.destinations[0]} viagem outfit`
    : "looks viagem outfit travel";

export default function LooksPickerScreen() {
  const nav = useRouter();
  const insets = useSafeAreaInsets();
  const { activeTrip, addLooks } = useTrips();

  const [preview, setPreview] = useState<{ uri: string; id: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: 20,
    });

    if (result.canceled) return;

    const picked = result.assets.map((a) => ({
      uri: a.uri,
      id: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    }));

    setPreview((prev) => {
      const existingUris = new Set(prev.map((p) => p.uri));
      return [...prev, ...picked.filter((p) => !existingUris.has(p.uri))];
    });
  };

  const removePreview = (id: string) =>
    setPreview((prev) => prev.filter((p) => p.id !== id));

  const saveLooks = async () => {
    if (!preview.length) return;
    setSaving(true);
    const newLooks: LookPin[] = preview.map((p) => ({
      id: p.id,
      tripId: activeTrip?.id ?? "",
      imageUrl: p.uri,
    }));
    await addLooks(newLooks);
    nav.back();
  };

  const openPinterest = () =>
    Linking.openURL(pinterestSearchUrl(defaultQuery(activeTrip)));

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => nav.back()} hitSlop={8} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.white} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Looks da viagem</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* pick from gallery */}
        <TouchableOpacity style={s.mainBtn} onPress={pickFromGallery} activeOpacity={0.85}>
          <Ionicons name="images-outline" size={22} color={colors.white} />
          <View style={{ flex: 1 }}>
            <Text style={s.mainBtnTitle}>Adicionar da galeria</Text>
            <Text style={s.mainBtnSub}>Selecione fotos salvas no celular</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>

        {/* open Pinterest hint */}
        <TouchableOpacity style={s.pinterestCard} onPress={openPinterest} activeOpacity={0.85}>
          <View style={s.pDot}><Text style={s.pDotText}>P</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.pCardTitle}>Buscar no Pinterest</Text>
            <Text style={s.pCardSub}>
              Salve as fotos que gostar na galeria e adicione acima
            </Text>
          </View>
          <Ionicons name="open-outline" size={14} color={colors.teal2} />
        </TouchableOpacity>

        {/* preview grid */}
        {preview.length > 0 && (
          <>
            <Text style={s.sectionLabel}>
              {preview.length} look{preview.length !== 1 ? "s" : ""} selecionado{preview.length !== 1 ? "s" : ""}
            </Text>
            <View style={s.grid}>
              {preview.map((p) => (
                <View key={p.id} style={s.thumb}>
                  <Image source={{ uri: p.uri }} style={s.thumbImg} contentFit="cover" />
                  <TouchableOpacity
                    style={s.removeBtn}
                    onPress={() => removePreview(p.id)}
                    hitSlop={4}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={s.addMore} onPress={pickFromGallery} activeOpacity={0.8}>
                <Ionicons name="add" size={28} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* save bar */}
      {preview.length > 0 && (
        <View style={[s.saveBar, { paddingBottom: insets.bottom + 8 }]}>
          <Text style={s.saveCount}>
            {preview.length} look{preview.length !== 1 ? "s" : ""} prontos para salvar
          </Text>
          <TouchableOpacity
            style={[s.saveBtn, saving && { opacity: 0.6 }]}
            onPress={saveLooks}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={s.saveBtnText}>Salvar</Text>
            <Ionicons name="checkmark" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const THUMB = 100;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.offwhite },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn:     { padding: 2 },
  headerTitle: { fontSize: 16, fontWeight: "800", color: colors.white, fontStyle: "italic" },

  content: { padding: spacing.lg, gap: spacing.md },

  mainBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.navy,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.md,
  },
  mainBtnTitle: { fontSize: 15, fontWeight: "800", color: colors.white },
  mainBtnSub:   { fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: "600", marginTop: 2 },

  pinterestCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.sm,
  },
  pDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E60023",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  pDotText:  { fontSize: 16, fontWeight: "900", color: colors.white, lineHeight: 20 },
  pCardTitle: { fontSize: 13, fontWeight: "800", color: colors.navy },
  pCardSub:   { fontSize: 11, color: colors.muted, fontWeight: "600", marginTop: 2, lineHeight: 15 },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.muted,
    marginTop: spacing.sm,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.sm,
  },
  thumbImg: { flex: 1 },
  removeBtn: {
    position: "absolute",
    top: 3,
    right: 3,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 10,
  },
  addMore: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },

  saveBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    ...shadow.md,
  },
  saveCount:   { fontSize: 13, fontWeight: "700", color: colors.navy },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.teal,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
    ...shadow.teal,
  },
  saveBtnText: { fontSize: 13, fontWeight: "800", color: colors.white },
});

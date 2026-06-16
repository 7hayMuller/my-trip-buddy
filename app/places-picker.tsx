import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTrips } from "../hooks/useTrips";
import { colors, radius, shadow, spacing } from "../theme";
import { PlacePin } from "../types";
import { searchPlacePhotos, UnsplashPhoto, UNSPLASH_KEY } from "../utils/unsplash";

const NUM_COLS = 2;

export default function PlacesPickerScreen() {
  const nav = useRouter();
  const insets = useSafeAreaInsets();
  const { activeTrip, addPlaces } = useTrips();

  const firstDest = activeTrip?.destinations?.[0] ?? "";
  const [query, setQuery] = useState(firstDest);
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [selected, setSelected] = useState<Map<string, { photo: UnsplashPhoto; name: string }>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (firstDest) doSearch(firstDest);
  }, []);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const results = await searchPlacePhotos(q.trim());
      setPhotos(results);
    } catch (e: any) {
      if (e?.message === "NO_KEY") setError("NO_KEY");
      else setError(e?.message ?? "Erro na busca.");
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (text.trim()) doSearch(text);
    }, 600);
  };

  const togglePhoto = useCallback((photo: UnsplashPhoto, name: string) => {
    setSelected((prev) => {
      const next = new Map(prev);
      next.has(photo.id) ? next.delete(photo.id) : next.set(photo.id, { photo, name });
      return next;
    });
  }, []);

  const save = async () => {
    const newPlaces: PlacePin[] = Array.from(selected.values()).map(({ photo, name }) => ({
      id: photo.id,
      tripId: activeTrip?.id ?? "",
      name,
      imageUrl: photo.urls.regular,
      thumbUrl: photo.urls.small,
    }));
    await addPlaces(newPlaces);
    nav.back();
  };

  /* ── sem chave configurada ─────────────────────────────────────── */
  if (!UNSPLASH_KEY) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <Header onBack={() => nav.back()} count={0} />
        <View style={s.center}>
          <Ionicons name="map-outline" size={48} color={colors.border} style={{ marginBottom: spacing.lg }} />
          <Text style={s.emptyTitle}>Lugares para visitar</Text>
          <View style={s.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.teal2} />
            <Text style={s.infoText}>
              Adicione ao <Text style={{ fontWeight: "900" }}>.env</Text>:{"\n"}
              EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=sua_chave{"\n\n"}
              Crie grátis em{" "}
              <Text style={{ fontWeight: "900" }}>unsplash.com/developers</Text>
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Header onBack={() => nav.back()} count={selected.size} onSave={save} />

      {/* search bar */}
      <View style={s.searchWrap}>
        <Ionicons name="search" size={16} color={colors.muted} />
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={handleQueryChange}
          onSubmitEditing={() => doSearch(query)}
          returnKeyType="search"
          placeholder="Buscar lugar..."
          placeholderTextColor={colors.muted}
          autoCapitalize="words"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(""); setPhotos([]); }} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* loading */}
      {loading && (
        <View style={s.loadingWrap}>
          <ActivityIndicator color={colors.teal} size="large" />
        </View>
      )}

      {/* error */}
      {!loading && error && error !== "NO_KEY" && (
        <View style={s.center}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      )}

      {/* empty */}
      {!loading && !error && photos.length === 0 && query.length > 0 && (
        <View style={s.center}>
          <Ionicons name="image-outline" size={40} color={colors.border} />
          <Text style={s.emptyText}>Nenhuma foto encontrada para "{query}"</Text>
        </View>
      )}

      {/* grid */}
      {!loading && photos.length > 0 && (
        <FlatList
          data={photos}
          keyExtractor={(p) => p.id}
          numColumns={NUM_COLS}
          contentContainerStyle={s.grid}
          renderItem={({ item }) => {
            const isSel = selected.has(item.id);
            const name = query.trim();
            return (
              <TouchableOpacity
                style={s.card}
                onPress={() => togglePhoto(item, name)}
                activeOpacity={0.88}
              >
                <Image
                  source={{ uri: item.urls.small }}
                  style={s.cardImg}
                  contentFit="cover"
                />
                {/* gradient + name */}
                <View style={s.cardGrad}>
                  <Text style={s.cardName} numberOfLines={1}>{name}</Text>
                </View>
                {/* selected overlay */}
                {isSel && (
                  <View style={s.cardOverlay}>
                    <Ionicons name="checkmark-circle" size={32} color={colors.white} />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* save bar */}
      {selected.size > 0 && (
        <View style={[s.saveBar, { paddingBottom: insets.bottom + 8 }]}>
          <View style={s.selectedPreviews}>
            {Array.from(selected.values())
              .slice(0, 4)
              .map(({ photo }) => (
                <Image
                  key={photo.id}
                  source={{ uri: photo.urls.thumb }}
                  style={s.selectedThumb}
                  contentFit="cover"
                />
              ))}
            {selected.size > 4 && (
              <View style={s.moreThumb}>
                <Text style={s.moreThumbText}>+{selected.size - 4}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={s.saveBtn} onPress={save} activeOpacity={0.85}>
            <Text style={s.saveBtnText}>
              Salvar {selected.size} lugar{selected.size !== 1 ? "es" : ""}
            </Text>
            <Ionicons name="checkmark" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function Header({
  onBack,
  count,
  onSave,
}: {
  onBack: () => void;
  count: number;
  onSave?: () => void;
}) {
  return (
    <View style={s.header}>
      <TouchableOpacity onPress={onBack} hitSlop={8} style={s.backBtn}>
        <Ionicons name="arrow-back" size={20} color={colors.white} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={s.headerTitle}>Lugares para visitar</Text>
        {count > 0 && (
          <Text style={s.headerSub}>
            {count} lugar{count !== 1 ? "es" : ""} selecionado{count !== 1 ? "s" : ""}
          </Text>
        )}
      </View>
    </View>
  );
}

const CARD_H = 160;

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
  headerSub:   { fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: "600", marginTop: 1 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.navy,
    paddingVertical: 8,
  },

  grid: { padding: spacing.sm, gap: spacing.sm },

  card: {
    flex: 1,
    margin: spacing.xs,
    height: CARD_H,
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: colors.border,
    ...shadow.sm,
  },
  cardImg: { ...StyleSheet.absoluteFillObject },
  cardGrad: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: "rgba(17,30,53,0.55)",
  },
  cardName: { fontSize: 13, fontWeight: "800", color: colors.white },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(59,191,178,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.navy, fontStyle: "italic" },
  emptyText:  { fontSize: 13, color: colors.muted, fontWeight: "600", textAlign: "center" },
  errorText:  { fontSize: 13, color: colors.accent, fontWeight: "600", textAlign: "center" },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.tealLight,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  infoText: { fontSize: 12, color: colors.teal2, fontWeight: "600", flex: 1, lineHeight: 19 },

  saveBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    ...shadow.md,
  },
  selectedPreviews: { flexDirection: "row", gap: 4 },
  selectedThumb: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.white,
  },
  moreThumb: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  moreThumbText: { fontSize: 10, fontWeight: "800", color: colors.white },

  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.teal,
    borderRadius: radius.lg,
    paddingVertical: 12,
    ...shadow.teal,
  },
  saveBtnText: { fontSize: 13, fontWeight: "800", color: colors.white },
});

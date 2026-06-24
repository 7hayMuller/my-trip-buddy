import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTrips } from "../hooks/useTrips";
import { colors, radius, shadow, spacing } from "../theme";
import { LookPin } from "../types";
import { pinterestSearchUrl } from "../utils/pinterest";
import {
  searchPlacePhotos,
  UNSPLASH_KEY,
  UnsplashPhoto,
} from "../utils/unsplash";

const defaultQuery = (trip: any) =>
  trip?.destinations?.length
    ? `street style ${trip.destinations[0]}`
    : "street style travel outfit";

const pinterestQuery = (trip: any) =>
  trip?.destinations?.length
    ? `looks ${trip.destinations[0]} viagem outfit`
    : "looks viagem outfit travel";

function splitMasonry(
  photos: UnsplashPhoto[],
): [UnsplashPhoto[], UnsplashPhoto[]] {
  const cols: [UnsplashPhoto[], UnsplashPhoto[]] = [[], []];
  const heights = [0, 0];
  for (const p of photos) {
    const col = heights[0] <= heights[1] ? 0 : 1;
    cols[col].push(p);
    heights[col] += p.height / p.width;
  }
  return cols;
}

const SKELETON_RATIOS = [1.3, 0.85, 1, 1.2, 0.9, 1.1];

export default function LooksPickerScreen() {
  const nav = useRouter();
  const insets = useSafeAreaInsets();
  const { activeTrip, addLooks } = useTrips();

  const [galleryPicks, setGalleryPicks] = useState<
    { uri: string; id: string }[]
  >([]);

  const initialQuery = defaultQuery(activeTrip);
  const [query, setQuery] = useState(initialQuery);
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [selected, setSelected] = useState<Map<string, UnsplashPhoto>>(
    new Map(),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (UNSPLASH_KEY) doSearch(initialQuery);
  }, [initialQuery]);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const results = await searchPlacePhotos(
        `${q.trim()} fashion outfit`,
        20,
        "portrait",
      );
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

  const togglePhoto = useCallback((photo: UnsplashPhoto) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(photo.id)) {
        next.delete(photo.id);
      } else {
        next.set(photo.id, photo);
      }
      return next;
    });
  }, []);

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

    setGalleryPicks((prev) => {
      const existingUris = new Set(prev.map((p) => p.uri));
      return [...prev, ...picked.filter((p) => !existingUris.has(p.uri))];
    });
  };

  const removeGalleryPick = (id: string) =>
    setGalleryPicks((prev) => prev.filter((p) => p.id !== id));

  const openPinterest = () =>
    Linking.openURL(pinterestSearchUrl(pinterestQuery(activeTrip)));

  const selectedPhotos = useMemo(
    () => Array.from(selected.values()),
    [selected],
  );
  const totalCount = galleryPicks.length + selectedPhotos.length;
  const masonryCols = useMemo(() => splitMasonry(photos), [photos]);

  const saveLooks = async () => {
    if (!totalCount) return;
    setSaving(true);
    const newLooks: LookPin[] = [
      ...galleryPicks.map((p) => ({
        id: p.id,
        tripId: activeTrip?.id ?? "",
        imageUrl: p.uri,
      })),
      ...selectedPhotos.map((photo) => ({
        id: photo.id,
        tripId: activeTrip?.id ?? "",
        imageUrl: photo.urls.regular,
      })),
    ];
    await addLooks(newLooks);
    nav.back();
  };

  const renderMasonryCard = (item: UnsplashPhoto) => {
    const isSel = selected.has(item.id);
    return (
      <TouchableOpacity
        key={item.id}
        style={[s.masonryCard, { aspectRatio: item.width / item.height }]}
        onPress={() => togglePhoto(item)}
        activeOpacity={0.88}
      >
        <Image
          source={{ uri: item.urls.small }}
          style={s.cardImg}
          contentFit="cover"
        />
        {isSel && (
          <View style={s.cardOverlay}>
            <Ionicons name="checkmark-circle" size={28} color={colors.white} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => nav.back()}
          hitSlop={8}
          style={s.backBtn}
        >
          <Ionicons name="arrow-back" size={20} color={colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Looks da viagem</Text>
          {totalCount > 0 && (
            <Text style={s.headerSub}>
              {totalCount} look{totalCount !== 1 ? "s" : ""} selecionado
              {totalCount !== 1 ? "s" : ""}
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* quick actions */}
        <View style={s.quickRow}>
          <TouchableOpacity
            style={s.chip}
            onPress={pickFromGallery}
            activeOpacity={0.85}
          >
            <Ionicons name="images-outline" size={16} color={colors.navy} />
            <Text style={s.chipText}>Galeria</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.chip}
            onPress={openPinterest}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-pinterest" size={16} color="#E60023" />
            <Text style={s.chipText}>Pinterest</Text>
          </TouchableOpacity>
        </View>

        {/* selected tray — feedback constante do que já foi escolhido */}
        {totalCount > 0 && (
          <View>
            <Text style={s.sectionLabel}>Selecionados ({totalCount})</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.trayRow}
            >
              {galleryPicks.map((p) => (
                <View key={p.id} style={s.trayThumb}>
                  <Image
                    source={{ uri: p.uri }}
                    style={s.cardImg}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    style={s.trayRemove}
                    onPress={() => removeGalleryPick(p.id)}
                    hitSlop={4}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={colors.white}
                    />
                  </TouchableOpacity>
                </View>
              ))}
              {selectedPhotos.map((photo) => (
                <View key={photo.id} style={s.trayThumb}>
                  <Image
                    source={{ uri: photo.urls.thumb }}
                    style={s.cardImg}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    style={s.trayRemove}
                    onPress={() => togglePhoto(photo)}
                    hitSlop={4}
                  >
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={colors.white}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* search */}
        {UNSPLASH_KEY ? (
          <>
            <Text style={s.sectionLabel}>Inspirações para o destino</Text>
            <View style={s.searchWrap}>
              <Ionicons name="search" size={16} color={colors.muted} />
              <TextInput
                style={s.searchInput}
                value={query}
                onChangeText={handleQueryChange}
                onSubmitEditing={() => doSearch(query)}
                returnKeyType="search"
                placeholder="Buscar inspiração de look..."
                placeholderTextColor={colors.muted}
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setQuery("");
                    setPhotos([]);
                  }}
                  hitSlop={8}
                >
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={colors.muted}
                  />
                </TouchableOpacity>
              )}
            </View>

            {!loading && error && error !== "NO_KEY" && (
              <Text style={s.errorText}>{error}</Text>
            )}

            {!loading && !error && photos.length === 0 && query.length > 0 && (
              <Text style={s.emptyText}>
                Nenhuma inspiração encontrada para &quot;{query}&quot;
              </Text>
            )}

            <View style={s.masonryRow}>
              <View style={s.masonryCol}>
                {loading
                  ? SKELETON_RATIOS.filter((_, i) => i % 2 === 0).map(
                      (r, i) => (
                        <View
                          key={i}
                          style={[s.skeleton, { aspectRatio: r }]}
                        />
                      ),
                    )
                  : masonryCols[0].map(renderMasonryCard)}
              </View>
              <View style={s.masonryCol}>
                {loading
                  ? SKELETON_RATIOS.filter((_, i) => i % 2 === 1).map(
                      (r, i) => (
                        <View
                          key={i}
                          style={[s.skeleton, { aspectRatio: r }]}
                        />
                      ),
                    )
                  : masonryCols[1].map(renderMasonryCard)}
              </View>
            </View>
          </>
        ) : (
          <View style={s.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={colors.teal2}
            />
            <Text style={s.infoText}>
              Adicione ao <Text style={{ fontWeight: "900" }}>.env</Text>:{"\n"}
              EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=sua_chave{"\n\n"}
              para ver inspirações de looks aqui. Crie grátis em{" "}
              <Text style={{ fontWeight: "900" }}>unsplash.com/developers</Text>
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* save bar */}
      {totalCount > 0 && (
        <View style={[s.saveBar, { paddingBottom: insets.bottom + 8 }]}>
          <Text style={s.saveCount}>
            {totalCount} look{totalCount !== 1 ? "s" : ""} prontos para salvar
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

const TRAY_THUMB = 64;

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
  backBtn: { padding: 2 },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.white,
    fontStyle: "italic",
  },
  headerSub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "600",
    marginTop: 1,
  },

  content: { padding: spacing.lg, gap: spacing.md },

  quickRow: { flexDirection: "row", gap: spacing.sm },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: 10,
    ...shadow.sm,
  },
  chipText: { fontSize: 13, fontWeight: "800", color: colors.navy },

  sectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.muted,
    marginBottom: spacing.sm,
  },

  trayRow: { gap: spacing.sm },
  trayThumb: {
    width: TRAY_THUMB,
    height: TRAY_THUMB,
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.border,
    ...shadow.sm,
  },
  trayRemove: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 9,
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.navy,
    paddingVertical: 10,
  },

  errorText: {
    fontSize: 13,
    color: colors.accent,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: spacing.lg,
  },
  emptyText: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: spacing.lg,
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.tealLight,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  infoText: {
    fontSize: 12,
    color: colors.teal2,
    fontWeight: "600",
    flex: 1,
    lineHeight: 19,
  },

  masonryRow: { flexDirection: "row", gap: spacing.sm },
  masonryCol: { flex: 1, gap: spacing.sm },
  masonryCard: {
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.border,
    ...shadow.sm,
  },
  cardImg: { ...StyleSheet.absoluteFillObject },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(59,191,178,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  skeleton: {
    borderRadius: radius.lg,
    backgroundColor: colors.border,
    opacity: 0.6,
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
  saveCount: { fontSize: 13, fontWeight: "700", color: colors.navy },
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

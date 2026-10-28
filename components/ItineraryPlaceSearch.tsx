import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { dark, radius, spacing } from "../theme";
import {
  getPlaceLocation,
  HotelSuggestion as PlaceSuggestion,
  newSessionToken,
  searchPlacesAutocomplete,
} from "../utils/placesService";

// Rótulo curto no formato antigo (lugar, cidade, país): nome + o começo do
// endereço que o autocomplete do Google devolve.
function labelFor(r: PlaceSuggestion): string {
  const parts = [r.name, ...r.address.split(",").map((p) => p.trim())].filter(Boolean);
  return parts.slice(0, 3).join(", ");
}

export function ItineraryPlaceSearch({
  onAddDestination,
}: {
  onAddDestination: (label: string, lat: number, lon: number, country?: string) => void;
}) {
  const { t } = useTranslation("destinationSearch");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef = useRef(newSessionToken());
  // Descarta respostas atrasadas de buscas anteriores.
  const lastQueryRef = useRef("");

  const runSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    lastQueryRef.current = q;
    setSearching(true);
    const found = await searchPlacesAutocomplete(q, sessionRef.current);
    if (lastQueryRef.current !== q) return;
    setResults(found);
    setSearching(false);
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 350);
  };

  const pickResult = async (r: PlaceSuggestion) => {
    Keyboard.dismiss();
    setResults([]);
    setSearching(true);
    const loc = await getPlaceLocation(r.placeId, sessionRef.current);
    sessionRef.current = newSessionToken();
    setSearching(false);
    if (!loc) return;
    onAddDestination(labelFor(r), loc.lat, loc.lon, loc.country);
    setQuery("");
  };

  return (
    <View style={s.wrap}>
      <View style={s.searchBar}>
        <Ionicons name="search" size={16} color={dark.muted} />
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={handleQueryChange}
          onSubmitEditing={() => runSearch(query)}
          placeholder={t("placeholder")}
          placeholderTextColor={dark.muted}
          returnKeyType="search"
        />
        {searching && <ActivityIndicator size="small" color={dark.blue} />}
        {!searching && query.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setQuery("");
              setResults([]);
            }}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={16} color={dark.muted} />
          </TouchableOpacity>
        )}
      </View>

      {results.length > 0 && (
        <View style={s.resultsList}>
          {results.map((r) => (
            <TouchableOpacity
              key={r.placeId}
              style={s.resultRow}
              onPress={() => pickResult(r)}
              activeOpacity={0.7}
            >
              <Image
                source={require("../assets/images/icon-pin.png")}
                style={{ width: 20, height: 20 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={s.resultText} numberOfLines={1}>
                  {r.name}
                </Text>
                {!!r.address && (
                  <Text style={s.resultAddr} numberOfLines={1}>
                    {r.address}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {!searching && query.trim().length > 0 && results.length === 0 && (
        <Text style={s.noResults}>{t("noResults")}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: dark.surfaceAlt,
    borderWidth: 1,
    borderColor: dark.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: dark.white,
    paddingVertical: 10,
  },
  resultsList: {
    marginTop: 6,
    backgroundColor: dark.surfaceAlt,
    borderWidth: 1,
    borderColor: dark.border,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: dark.border,
  },
  resultText: { fontSize: 12, fontWeight: "700", color: dark.white },
  resultAddr: { fontSize: 10, fontWeight: "600", color: dark.muted, marginTop: 1 },
  noResults: {
    fontSize: 11,
    fontWeight: "600",
    color: dark.muted,
    marginTop: 6,
  },
});

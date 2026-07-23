import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
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
import { GeoSearchResult, searchPlaces } from "../utils/geocode";

export function DestinationSearch({
  onAddDestination,
}: {
  onAddDestination: (label: string, lat: number, lon: number, country?: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const found = await searchPlaces(q);
    setResults(found);
    setSearching(false);
  };

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 500);
  };

  const pickResult = (r: GeoSearchResult) => {
    onAddDestination(r.label, r.lat, r.lon, r.country);
    setQuery("");
    setResults([]);
    Keyboard.dismiss();
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
          placeholder="Buscar destino para adicionar..."
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
          {results.map((r, i) => (
            <TouchableOpacity
              key={`${r.label}-${i}`}
              style={s.resultRow}
              onPress={() => pickResult(r)}
              activeOpacity={0.7}
            >
              <Image
                source={require("../assets/images/icon-pin.png")}
                style={{ width: 20, height: 20 }}
              />
              <Text style={s.resultText} numberOfLines={1}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {!searching && query.trim().length > 0 && results.length === 0 && (
        <Text style={s.noResults}>Nenhum destino encontrado.</Text>
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
  resultText: { flex: 1, fontSize: 12, fontWeight: "700", color: dark.white },
  noResults: {
    fontSize: 11,
    fontWeight: "600",
    color: dark.muted,
    marginTop: 6,
  },
});

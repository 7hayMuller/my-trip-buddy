import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image as RNImage,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { dark, radius, spacing } from "../theme";
import {
  getHotelDetails,
  HotelSuggestion,
  newSessionToken,
  PlaceHotelDetails,
  searchHotels,
} from "../utils/placesService";

interface Props {
  value: string;
  // Destino do hotel, somado à busca para o Google priorizar hotéis da cidade.
  dest?: string;
  photoUrl?: string;
  placeholder?: string;
  onChangeText: (text: string) => void;
  onSelect: (hotel: PlaceHotelDetails) => void;
}

const DEBOUNCE_MS = 350;

export default function HotelAutocomplete({
  value,
  dest,
  photoUrl,
  placeholder,
  onChangeText,
  onSelect,
}: Props) {
  const [suggestions, setSuggestions] = useState<HotelSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [focused, setFocused] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const sessionRef = useRef(newSessionToken());
  // Evita buscar de novo quando o texto muda por causa de uma seleção.
  const skipNextRef = useRef(false);

  useEffect(() => setPhotoFailed(false), [photoUrl]);

  useEffect(() => {
    if (skipNextRef.current) {
      skipNextRef.current = false;
      return;
    }
    const text = value.trim();
    if (!focused || text.length < 3) {
      setSuggestions([]);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      const query =
        dest && !text.toLowerCase().includes(dest.toLowerCase())
          ? `${text} ${dest}`
          : text;
      const results = await searchHotels(query, sessionRef.current);
      if (active) {
        setSuggestions(results);
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value, dest, focused]);

  const pick = async (s: HotelSuggestion) => {
    skipNextRef.current = true;
    setSuggestions([]);
    onChangeText(s.name);
    setSelecting(true);
    const details = await getHotelDetails(s.placeId, sessionRef.current);
    sessionRef.current = newSessionToken();
    setSelecting(false);
    onSelect(
      details ?? {
        placeId: s.placeId,
        name: s.name,
        address: s.address,
        rating: 0,
        totalRatings: 0,
        priceLevel: null,
        photoUrl: null,
        googleMapsUrl: "",
      },
    );
  };

  return (
    <View>
      <View style={st.wrap}>
        <RNImage
          source={require("../assets/images/icon-building.png")}
          style={st.icon}
        />
        <TextInput
          style={st.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder={placeholder}
          placeholderTextColor={dark.muted}
          autoCorrect={false}
        />
        {(loading || selecting) && (
          <ActivityIndicator style={st.spinner} size="small" color={dark.blue} />
        )}
      </View>

      {suggestions.length > 0 && (
        <View style={st.list}>
          {suggestions.map((s, i) => (
            <TouchableOpacity
              key={s.placeId}
              style={[st.item, i === suggestions.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => pick(s)}
            >
              <Ionicons name="bed-outline" size={16} color={dark.blue} />
              <View style={{ flex: 1 }}>
                <Text style={st.itemName} numberOfLines={1}>
                  {s.name}
                </Text>
                {!!s.address && (
                  <Text style={st.itemAddr} numberOfLines={1}>
                    {s.address}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {!!photoUrl && !photoFailed && (
        <Image
          source={{ uri: photoUrl }}
          style={st.photo}
          contentFit="cover"
          transition={250}
          onError={() => setPhotoFailed(true)}
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { position: "relative", justifyContent: "center" },
  icon: { position: "absolute", left: 11, top: 12, zIndex: 1, width: 18, height: 18 },
  input: {
    backgroundColor: dark.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: dark.border,
    padding: spacing.md,
    paddingLeft: 36,
    paddingRight: 36,
    fontSize: 13,
    fontWeight: "600",
    color: dark.white,
  },
  spinner: { position: "absolute", right: 12 },
  list: {
    marginTop: spacing.xs,
    backgroundColor: dark.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: dark.border,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: dark.border,
  },
  itemName: { fontSize: 13, fontWeight: "700", color: dark.white },
  itemAddr: { fontSize: 11, color: dark.muted, marginTop: 1 },
  photo: {
    width: "100%",
    height: 160,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    backgroundColor: dark.surfaceAlt,
  },
});

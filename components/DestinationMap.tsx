import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import WebView from "react-native-webview";
import { colors, radius, shadow, spacing } from "../theme";
import { colorForCountry, DestinationCoord, resolveDestinationCoords } from "../utils/geo";
import { GeoSearchResult, searchPlaces } from "../utils/geocode";

function buildLeafletHtml(pins: DestinationCoord[]): string {
  const pinsJson = JSON.stringify(
    pins.map((p) => ({
      lat: p.lat,
      lon: p.lon,
      label: p.label,
      country: p.country ?? null,
      color: colorForCountry(p.country),
    })),
  );
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #1A2C44; }
    .trip-pin { width: 18px; height: 18px; border-radius: 50%; border: 3px solid #fff; }
    .leaflet-popup-content-wrapper { border-radius: 10px; }
    .leaflet-popup-content {
      font-family: -apple-system, sans-serif;
      font-weight: 700; font-size: 13px;
      margin: 8px 12px; color: #162032;
    }
    .leaflet-popup-content .country {
      display: block; font-weight: 600; font-size: 11px;
      color: #7E8EA6; margin-top: 2px;
    }
    .leaflet-control-attribution { font-size: 9px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var pins = ${pinsJson};
    var map = L.map('map', { zoomControl: false }).setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    function makeIcon(color) {
      return L.divIcon({
        className: '',
        html: '<div class="trip-pin" style="background:' + color + ';box-shadow:0 0 0 4px ' + color + '55;"></div>',
        iconSize: [18, 18],
      });
    }

    var markers = pins.map(function (p) {
      var m = L.marker([p.lat, p.lon], { icon: makeIcon(p.color) }).addTo(map);
      m.bindPopup(
        '<b>' + p.label + '</b>' +
        (p.country ? '<span class="country">' + p.country + '</span>' : '')
      );
      return m;
    });

    // Zoom inicial: foca no destino mais recente (último pin) em vez de
    // tentar enquadrar tudo — assim, ao adicionar um novo destino, o mapa
    // já abre nele em vez de voltar sempre pro primeiro.
    if (pins.length > 0) {
      var last = pins[pins.length - 1];
      map.setView([last.lat, last.lon], 12);
    }

    window.focusDestination = function (i) {
      var p = pins[i];
      if (!p) return;
      map.flyTo([p.lat, p.lon], 12, { duration: 0.8 });
      markers[i].openPopup();
    };
    window.focusAll = function () {
      if (markers.length > 1) {
        map.flyToBounds(L.featureGroup(markers).getBounds().pad(0.3), { duration: 0.8 });
      } else if (markers.length === 1) {
        map.flyTo(markers[0].getLatLng(), 12, { duration: 0.8 });
      }
    };
  </script>
</body>
</html>`;
}

export function DestinationMap({
  destinations,
  destinationCoords,
  onAddDestination,
  height = 220,
}: {
  destinations: string[];
  destinationCoords?: Record<string, { lat: number; lon: number; country?: string }>;
  onAddDestination: (label: string, lat: number, lon: number, country?: string) => void;
  height?: number;
}) {
  const pins = useMemo(
    () => resolveDestinationCoords(destinations, destinationCoords),
    [destinations, destinationCoords],
  );
  const html = useMemo(() => buildLeafletHtml(pins), [pins]);
  const webviewRef = useRef<WebView>(null);
  const [active, setActive] = useState<number | null>(0);

  // Acompanha o pin mais recente sempre que a lista muda (novo destino
  // adicionado), pra ficar em sincronia com o zoom inicial do WebView acima.
  useEffect(() => {
    setActive(pins.length > 0 ? pins.length - 1 : null);
  }, [pins.length]);

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

  const focus = (i: number | null) => {
    setActive(i);
    const js =
      i === null
        ? "window.focusAll && window.focusAll(); true;"
        : `window.focusDestination && window.focusDestination(${i}); true;`;
    webviewRef.current?.injectJavaScript(js);
  };

  const mapKey = pins.map((p) => `${p.label}:${p.lat},${p.lon}:${p.country ?? ""}`).join("|");

  return (
    <View style={s.card}>
      <View style={s.searchBar}>
        <Ionicons name="search" size={16} color={colors.muted} />
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={handleQueryChange}
          onSubmitEditing={() => runSearch(query)}
          placeholder="Buscar destino para pinar no mapa..."
          placeholderTextColor={colors.muted}
          returnKeyType="search"
        />
        {searching && <ActivityIndicator size="small" color={colors.teal2} />}
        {!searching && query.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setQuery("");
              setResults([]);
            }}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={16} color={colors.muted} />
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
              <Ionicons name="location-outline" size={14} color={colors.teal2} />
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

      {pins.length === 0 ? (
        <View style={s.fallback}>
          <Ionicons name="map-outline" size={20} color={colors.muted} />
          <Text style={s.fallbackText}>
            Busque um destino acima para pinar no mapa.
          </Text>
        </View>
      ) : (
        <>
          <WebView
            ref={webviewRef}
            source={{ html }}
            style={[s.map, { height }]}
            originWhitelist={["*"]}
            scrollEnabled={false}
            bounces={false}
            javaScriptEnabled
            // Recarrega o mapa do zero sempre que a lista de pins muda — cobre
            // o caso de adicionar um destino novo sem precisar de postMessage.
            key={mapKey}
          />

          {pins.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.chipsRow}
            >
              <TouchableOpacity
                style={[s.chip, active === null && s.chipActive]}
                onPress={() => focus(null)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="expand-outline"
                  size={12}
                  color={active === null ? colors.white : colors.teal2}
                />
                <Text style={[s.chipText, active === null && s.chipTextActive]}>
                  todos
                </Text>
              </TouchableOpacity>
              {pins.map((p, i) => (
                <TouchableOpacity
                  key={`${p.label}-${i}`}
                  style={[s.chip, active === i && s.chipActive]}
                  onPress={() => focus(i)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="location"
                    size={12}
                    color={active === i ? colors.white : colorForCountry(p.country)}
                  />
                  <Text
                    style={[s.chipText, active === i && s.chipTextActive]}
                    numberOfLines={1}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.navyDeep,
    borderRadius: radius.xl,
    overflow: "hidden",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    ...shadow.md,
  },
  map: {
    backgroundColor: colors.navyDeep,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: colors.white,
    paddingVertical: 10,
  },
  resultsList: {
    marginHorizontal: spacing.sm,
    marginTop: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
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
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  resultText: { flex: 1, fontSize: 12, fontWeight: "700", color: colors.white },
  noResults: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    marginHorizontal: spacing.md,
    marginTop: 6,
  },

  chipsRow: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.08)",
    maxWidth: 140,
  },
  chipActive: { backgroundColor: colors.teal },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
  },
  chipTextActive: { color: colors.white },

  fallback: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
  },
  fallbackText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
});

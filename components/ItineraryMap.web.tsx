import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import WebView from "react-native-webview";
import { dark, radius, shadow, spacing } from "../theme";
import { colorForCountry, DestinationCoord, resolveDestinationCoords } from "../utils/geo";

function buildLeafletHtml(
  pins: DestinationCoord[],
  fallbackCenter?: { lat: number; lon: number },
): string {
  const pinsJson = JSON.stringify(
    pins.map((p) => ({
      lat: p.lat,
      lon: p.lon,
      label: p.label,
      country: p.country ?? null,
      color: colorForCountry(p.country),
    })),
  );
  const fallbackCenterJson = JSON.stringify(fallbackCenter ?? null);
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #050505; }
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
    var fallbackCenter = ${fallbackCenterJson};
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
    // já abre nele em vez de voltar sempre pro primeiro. Sem nenhum pin
    // ainda (ex: dia recém-criado), centraliza no destino cadastrado na
    // viagem, pra não mostrar um mapa-múndi vazio.
    if (pins.length > 0) {
      var last = pins[pins.length - 1];
      map.setView([last.lat, last.lon], 12);
    } else if (fallbackCenter) {
      map.setView([fallbackCenter.lat, fallbackCenter.lon], 11);
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

export function ItineraryMap({
  destinations,
  destinationCoords,
  fallbackCenter,
  height = 220,
  fullscreen = false,
}: {
  destinations: string[];
  destinationCoords?: Record<string, { lat: number; lon: number; country?: string }>;
  // Centro pro mapa quando ainda não há nenhum pin (ex: dia sem destino
  // pinado ainda) — normalmente o destino cadastrado na criação da viagem.
  fallbackCenter?: { lat: number; lon: number };
  height?: number;
  fullscreen?: boolean;
}) {
  const pins = useMemo(
    () => resolveDestinationCoords(destinations, destinationCoords),
    [destinations, destinationCoords],
  );
  const html = useMemo(
    () => buildLeafletHtml(pins, fallbackCenter),
    [pins, fallbackCenter],
  );
  const { t } = useTranslation("destinationMap");
  const webviewRef = useRef<WebView>(null);
  const [active, setActive] = useState<number | null>(0);

  // Acompanha o pin mais recente sempre que a lista muda (novo destino
  // adicionado), pra ficar em sincronia com o zoom inicial do WebView acima.
  useEffect(() => {
    setActive(pins.length > 0 ? pins.length - 1 : null);
  }, [pins.length]);

  const focus = (i: number | null) => {
    setActive(i);
    const js =
      i === null
        ? "window.focusAll && window.focusAll(); true;"
        : `window.focusDestination && window.focusDestination(${i}); true;`;
    webviewRef.current?.injectJavaScript(js);
  };

  const mapKey =
    pins.map((p) => `${p.label}:${p.lat},${p.lon}:${p.country ?? ""}`).join("|") ||
    `fallback:${fallbackCenter?.lat},${fallbackCenter?.lon}`;

  return (
    <View style={[s.card, fullscreen && s.cardFullscreen]}>
      {pins.length === 0 && !fallbackCenter ? (
        <View style={[s.fallback, fullscreen && s.fallbackFullscreen]}>
          <Ionicons name="map-outline" size={20} color={dark.muted} />
          <Text style={s.fallbackText}>{t("noDestinationYet")}</Text>
        </View>
      ) : (
        <>
          <WebView
            ref={webviewRef}
            source={{ html }}
            style={fullscreen ? StyleSheet.absoluteFillObject : [s.map, { height }]}
            originWhitelist={["*"]}
            scrollEnabled={false}
            bounces={false}
            javaScriptEnabled
            // Recarrega o mapa do zero sempre que a lista de pins muda — cobre
            // o caso de adicionar um destino novo sem precisar de postMessage.
            key={mapKey}
          />

          {!fullscreen && pins.length > 1 && (
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
                  color={active === null ? dark.white : dark.blue}
                />
                <Text style={[s.chipText, active === null && s.chipTextActive]}>
                  {t("all")}
                </Text>
              </TouchableOpacity>
              {pins.map((p, i) => (
                <TouchableOpacity
                  key={`${p.label}-${i}`}
                  style={[s.chip, active === i && s.chipActive]}
                  onPress={() => focus(i)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={require("../assets/images/icon-pin.png")}
                    style={{ width: 18, height: 18 }}
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
    backgroundColor: dark.surface,
    borderRadius: radius.xl,
    overflow: "hidden",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: dark.border,
    ...shadow.md,
  },
  cardFullscreen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 0,
    borderWidth: 0,
    margin: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  map: {
    backgroundColor: dark.bg,
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
  chipActive: { backgroundColor: dark.blue },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
  },
  chipTextActive: { color: dark.white },

  fallback: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
  },
  fallbackFullscreen: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "column",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  fallbackText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
});

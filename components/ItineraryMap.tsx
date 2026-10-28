import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Callout, Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { dark, radius, shadow, spacing } from "../theme";
import { colorForCountry, resolveDestinationCoords } from "../utils/geo";

// Versão nativa (Google Maps via react-native-maps). Na web o Metro pega
// ItineraryMap.web.tsx, que continua com Leaflet — o react-native-maps não
// roda no navegador.

// No iOS fica o Apple Maps até existir uma chave da Maps SDK for iOS.
const PROVIDER = Platform.OS === "android" ? PROVIDER_GOOGLE : undefined;

const CITY_DELTA = 0.12;
const FALLBACK_DELTA = 0.25;

// Tema escuro pra combinar com o resto do app (fundo #050505).
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1d1d1f" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a8a8f" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#121214" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#3a3a3d" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#232326" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1b2a1f" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2c2c30" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3a3a3f" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#252528" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0b1a2a" }] },
];

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
  const { t } = useTranslation("destinationMap");
  const mapRef = useRef<MapView>(null);
  const markerRefs = useRef<(any | null)[]>([]);
  const [active, setActive] = useState<number | null>(0);

  // Mesmo comportamento da versão Leaflet: abre no destino mais recente
  // (último pin), ou no destino da viagem quando o dia ainda não tem pin.
  const initialRegion = useMemo<Region | undefined>(() => {
    const last = pins[pins.length - 1];
    if (last)
      return {
        latitude: last.lat,
        longitude: last.lon,
        latitudeDelta: CITY_DELTA,
        longitudeDelta: CITY_DELTA,
      };
    if (fallbackCenter)
      return {
        latitude: fallbackCenter.lat,
        longitude: fallbackCenter.lon,
        latitudeDelta: FALLBACK_DELTA,
        longitudeDelta: FALLBACK_DELTA,
      };
    return undefined;
    // Só a região inicial — mudanças depois animam a câmera (efeito abaixo).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pinsKey = pins.map((p) => `${p.label}:${p.lat},${p.lon}`).join("|");

  // Novo destino adicionado (ou troca de dia): voa até o pin mais recente.
  useEffect(() => {
    const last = pins[pins.length - 1];
    setActive(pins.length > 0 ? pins.length - 1 : null);
    if (last) {
      mapRef.current?.animateToRegion(
        {
          latitude: last.lat,
          longitude: last.lon,
          latitudeDelta: CITY_DELTA,
          longitudeDelta: CITY_DELTA,
        },
        600,
      );
    } else if (fallbackCenter) {
      mapRef.current?.animateToRegion(
        {
          latitude: fallbackCenter.lat,
          longitude: fallbackCenter.lon,
          latitudeDelta: FALLBACK_DELTA,
          longitudeDelta: FALLBACK_DELTA,
        },
        600,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinsKey, fallbackCenter?.lat, fallbackCenter?.lon]);

  const focus = (i: number | null) => {
    setActive(i);
    if (i === null) {
      mapRef.current?.fitToCoordinates(
        pins.map((p) => ({ latitude: p.lat, longitude: p.lon })),
        { edgePadding: { top: 80, right: 60, bottom: 80, left: 60 }, animated: true },
      );
      return;
    }
    const p = pins[i];
    if (!p) return;
    mapRef.current?.animateToRegion(
      {
        latitude: p.lat,
        longitude: p.lon,
        latitudeDelta: CITY_DELTA,
        longitudeDelta: CITY_DELTA,
      },
      600,
    );
    markerRefs.current[i]?.showCallout?.();
  };

  return (
    <View style={[s.card, fullscreen && s.cardFullscreen]}>
      {pins.length === 0 && !fallbackCenter ? (
        <View style={[s.fallback, fullscreen && s.fallbackFullscreen]}>
          <Ionicons name="map-outline" size={20} color={dark.muted} />
          <Text style={s.fallbackText}>{t("noDestinationYet")}</Text>
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            provider={PROVIDER}
            style={fullscreen ? StyleSheet.absoluteFillObject : [s.map, { height }]}
            initialRegion={initialRegion}
            customMapStyle={DARK_MAP_STYLE}
            userInterfaceStyle="dark"
            toolbarEnabled={false}
            showsPointsOfInterest={false}
          >
            {pins.map((p, i) => {
              const color = colorForCountry(p.country);
              return (
                <Marker
                  key={`${p.label}-${i}`}
                  ref={(r) => {
                    markerRefs.current[i] = r;
                  }}
                  coordinate={{ latitude: p.lat, longitude: p.lon }}
                  anchor={{ x: 0.5, y: 0.5 }}
                  onPress={() => setActive(i)}
                  // O pin é uma View estática; sem isso o Android redesenha
                  // o bitmap do marker a cada frame.
                  tracksViewChanges={false}
                >
                  <View style={[s.pinHalo, { backgroundColor: color + "55" }]}>
                    <View style={[s.pin, { backgroundColor: color }]} />
                  </View>
                  <Callout tooltip={false}>
                    <View style={s.callout}>
                      <Text style={s.calloutTitle}>{p.label}</Text>
                      {!!p.country && <Text style={s.calloutCountry}>{p.country}</Text>}
                    </View>
                  </Callout>
                </Marker>
              );
            })}
          </MapView>

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

  pinHalo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  pin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 3,
    borderColor: "#fff",
  },
  callout: { minWidth: 120, maxWidth: 220, paddingVertical: 2 },
  calloutTitle: { fontSize: 13, fontWeight: "700", color: "#162032" },
  calloutCountry: { fontSize: 11, fontWeight: "600", color: "#7E8EA6", marginTop: 2 },

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

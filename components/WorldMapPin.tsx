import { geoNaturalEarth1, geoPath } from "d3-geo";
import React, { useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { feature } from "topojson-client";
import { dark, radius, shadow, spacing } from "../theme";
import { resolveDestinationCoords as getPins } from "../utils/geo";

const PIN_SIZE = 10;
const PIN_HALF = PIN_SIZE / 2;

function PulsingPin({
  x,
  y,
  delay = 0,
}: {
  x: number;
  y: number;
  delay?: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      ),
    );
  }, [delay, progress]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 3.5 }],
    opacity: 0.55 * (1 - progress.value),
  }));

  return (
    <View
      pointerEvents="none"
      style={[s.pinAnchor, { left: x - PIN_HALF, top: y - PIN_HALF }]}
    >
      <Animated.View style={[s.pinPulse, pulseStyle]} />
      <View style={s.pinDot}>
        <View style={s.pinCore} />
      </View>
    </View>
  );
}

export function WorldMapPin({
  destinations,
  destinationCoords,
}: {
  destinations: string[];
  destinationCoords?: Record<string, { lat: number; lon: number; country?: string }>;
}) {
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setDims({ w: width, h: height });
  };

  const { countryPaths, pins } = useMemo(() => {
    if (dims.w === 0) return { countryPaths: [], pins: [] };

    const topology = require("world-atlas/countries-110m.json");
    const countries = feature(
      topology,
      topology.objects.countries,
    ) as unknown as GeoJSON.FeatureCollection;

    const proj = geoNaturalEarth1()
      .scale(dims.w / 6.3)
      .translate([dims.w / 2, dims.h / 2]);

    const pathGen = geoPath(proj);

    const countryPaths = countries.features
      .map((f) => pathGen(f as any))
      .filter(Boolean) as string[];

    const pins = getPins(destinations, destinationCoords).map((pin) => {
      const [px, py] = proj([pin.lon, pin.lat]) ?? [0, 0];
      return { x: px, y: py, label: pin.label };
    });

    return { countryPaths, pins };
  }, [dims, destinations, destinationCoords]);

  return (
    <View style={s.card}>
      <View style={s.mapArea} onLayout={onLayout}>
        {dims.w > 0 && (
          <Svg width={dims.w} height={dims.h} style={StyleSheet.absoluteFill}>
            {countryPaths.map((d, i) => (
              <Path
                key={i}
                d={d}
                fill="#111113"
                stroke="#2A2A2E"
                strokeWidth="0.6"
              />
            ))}
          </Svg>
        )}

        {pins.map((pin, i) => (
          <PulsingPin key={i} x={pin.x} y={pin.y} delay={i * 500} />
        ))}
      </View>

      {/* <View style={s.footer}>
        <Ionicons name="location" size={11} color={dark.blue} />
        <Text style={s.footerText} numberOfLines={1}>
          {destinations.join("  ·  ")}
        </Text>
      </View> */}
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
    borderColor: "rgba(255,255,255,0.07)",
    ...shadow.md,
  },
  mapArea: {
    width: "100%",
    height: 150,
  },
  pinAnchor: {
    position: "absolute",
    width: PIN_SIZE,
    height: PIN_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  pinPulse: {
    position: "absolute",
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    backgroundColor: dark.blue,
  },
  pinDot: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    borderRadius: PIN_SIZE / 2,
    backgroundColor: dark.blue,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: dark.blue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  pinCore: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: dark.white,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  footerText: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
    flex: 1,
  },
});

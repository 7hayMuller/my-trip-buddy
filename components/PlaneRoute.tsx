import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { colors, dark, spacing } from "../theme";
import { RouteSegment } from "../types";

interface PlaneRouteProps {
  segments: RouteSegment[];
}

function SingleLeg({ segment }: { segment: RouteSegment }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(600),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return (
    <View style={styles.legRow}>
      <View style={styles.cityBlock}>
        <Text style={styles.iata}>{segment.from}</Text>
        <Text style={styles.cityName}>{segment.fromCity}</Text>
      </View>

      <View style={styles.lineWrap}>
        <View style={styles.dot} />
        <View style={[styles.line]} />
        <View style={styles.dot} />

        <Animated.Text
          style={[
            styles.plane,
            {
              opacity: anim.interpolate({
                inputRange: [0, 0.05, 0.9, 1],
                outputRange: [0, 1, 1, 0],
              }),
              transform: [
                {
                  translateX: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 170],
                  }),
                },
              ],
            },
          ]}
        >
          ✈
        </Animated.Text>
      </View>

      <View style={styles.cityBlock}>
        <Text style={styles.iata}>{segment.to}</Text>
        <Text style={styles.cityName}>{segment.toCity}</Text>
      </View>
    </View>
  );
}

function MultiLeg({ segments }: { segments: RouteSegment[] }) {
  const anims = useRef(segments.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const legs = anims.map((anim, i) =>
      Animated.sequence([
        Animated.delay(i * 1800),
        Animated.timing(anim, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(200),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    const loop = Animated.loop(Animated.parallel(legs));
    loop.start();
    return () => loop.stop();
  }, [anims]);

  const cities: { code: string; name: string }[] = [
    { code: segments[0].from, name: segments[0].fromCity },
    ...segments.map((s) => ({ code: s.to, name: s.toCity })),
  ];

  return (
    <View style={styles.multiRow}>
      {cities.map((city, i) => (
        <React.Fragment key={i}>
          <View style={styles.multiCityBlock}>
            <Text style={styles.multiIata}>{city.code}</Text>
            <Text style={styles.multiCityName}>{city.name}</Text>
          </View>

          {i < segments.length && (
            <View style={styles.multiLineWrap}>
              <View style={styles.multiLine} />
              <Animated.Text
                style={[
                  styles.multiPlane,
                  {
                    opacity: anims[i].interpolate({
                      inputRange: [0, 0.08, 0.88, 1],
                      outputRange: [0, 1, 1, 0],
                    }),
                    transform: [
                      {
                        translateX: anims[i].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 60],
                        }),
                      },
                    ],
                  },
                ]}
              >
                ✈
              </Animated.Text>
            </View>
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

export default function PlaneRoute({ segments }: PlaneRouteProps) {
  if (segments.length === 1) {
    return <SingleLeg segment={segments[0]} />;
  }
  return <MultiLeg segments={segments} />;
}

const styles = StyleSheet.create({
  legRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  cityBlock: { alignItems: "center", width: 56 },
  iata: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: 0.5,
  },
  cityName: {
    fontSize: 9,
    color: colors.muted,
    fontWeight: "600",
    marginTop: 1,
  },

  lineWrap: {
    flex: 1,
    height: 28,
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: dark.blue,
    zIndex: 2,
  },
  line: {
    flex: 1,
    height: 1.5,
    backgroundColor: colors.routeLine,
  },
  plane: {
    position: "absolute",
    left: 4,
    fontSize: 16,
    color: colors.white,
    zIndex: 3,
  },

  multiRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  multiCityBlock: { alignItems: "center" },
  multiIata: { fontSize: 13, fontWeight: "900", color: colors.white },
  multiCityName: { fontSize: 8, color: colors.muted, fontWeight: "600" },
  multiLineWrap: {
    flex: 1,
    height: 20,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },
  multiLine: {
    width: "100%",
    height: 1.5,
    backgroundColor: colors.routeLine,
  },
  multiPlane: {
    position: "absolute",
    left: 0,
    fontSize: 12,
    color: colors.white,
    zIndex: 3,
  },
});

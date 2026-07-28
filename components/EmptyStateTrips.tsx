import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { dark, spacing } from "../theme";

export function EmptyStateTrips() {
  const nav = useRouter();
  const { t } = useTranslation("emptyStateTrips");
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const feature1Anim = useRef(new Animated.Value(0)).current;
  const feature2Anim = useRef(new Animated.Value(0)).current;
  const feature3Anim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 8,
      bounciness: 8,
    }).start();

    Animated.sequence([
      Animated.timing(feature1Anim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(feature2Anim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(feature3Anim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [feature1Anim, feature2Anim, feature3Anim, floatAnim, scaleAnim]);

  const createFeatureAnimStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [
      {
        translateX: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-60, 0],
        }),
      },
    ],
  });

  return (
    <View style={s.container}>
      <Video
        source={require("../assets/videos/sky_loop.mp4")}
        rate={1.0}
        volume={0}
        isMuted={true}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[
          "rgba(5,5,5,0.4)",
          "rgba(5,5,5,0.6)",
          "rgba(5,5,5,0.85)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.background}>
        <View style={s.content}>
          <Text style={s.heading}>{t("heading")}</Text>

          <Text style={s.subheading}>{t("subheading")}</Text>

          <View style={s.featuresList}>
            <Animated.View
              style={[s.featureItem, createFeatureAnimStyle(feature1Anim)]}
            >
              <View style={[s.featureBadge, { backgroundColor: dark.green }]}>
                <Ionicons name="checkmark" size={16} color={dark.ink} />
              </View>
              <Text style={s.featureText}>{t("feature1")}</Text>
            </Animated.View>

            <Animated.View
              style={[s.featureItem, createFeatureAnimStyle(feature2Anim)]}
            >
              <View style={[s.featureBadge, { backgroundColor: dark.pink }]}>
                <Image
                  source={require("../assets/images/icon-gallery.png")}
                  style={{ width: 18, height: 18 }}
                />
              </View>
              <Text style={s.featureText}>{t("feature2")}</Text>
            </Animated.View>

            <Animated.View
              style={[s.featureItem, createFeatureAnimStyle(feature3Anim)]}
            >
              <View style={[s.featureBadge, { backgroundColor: dark.blue }]}>
                <Image
                  source={require("../assets/images/icon-country.png")}
                  style={{ width: 18, height: 18 }}
                />
              </View>
              <Text style={s.featureText}>{t("feature3")}</Text>
            </Animated.View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => nav.push("/trip-form")}
            style={[s.buttonWrapper, s.button, { backgroundColor: dark.pink }]}
          >
            <Text style={s.buttonText}>{t("cta")}</Text>
            <Ionicons name="arrow-forward" size={18} color={dark.ink} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: dark.pink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  heading: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: spacing.sm,
    lineHeight: 34,
  },
  subheading: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 22,
    maxWidth: 280,
    fontWeight: "600",
  },
  featuresList: {
    width: "100%",
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  featureBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  featureText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    flex: 1,
  },
  buttonWrapper: {
    width: "100%",
    marginBottom: spacing.md,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: 20,
    shadowColor: dark.pink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "800",
    color: dark.ink,
  },
  secondaryCTA: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    textDecorationLine: "underline",
  },
});

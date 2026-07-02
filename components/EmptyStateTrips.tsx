import { Ionicons } from "@expo/vector-icons";
import { ResizeMode, Video } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors, spacing } from "../theme";

export function EmptyStateTrips() {
  const nav = useRouter();
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
          "rgba(17,30,53,0.3)",
          "rgba(17,30,53,0.5)",
          "rgba(17,30,53,0.7)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.background}>
        <View style={s.content}>
          <Text style={s.heading}>
            Toda grande viagem começa com essa vista
          </Text>

          <Text style={s.subheading}>
            Organize cada detalhe e prepare-se para decolar.
          </Text>

          <View style={s.featuresList}>
            <Animated.View
              style={[s.featureItem, createFeatureAnimStyle(feature1Anim)]}
            >
              <LinearGradient
                colors={[colors.purple, colors.blush]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.featureBadge}
              >
                <Ionicons name="checkmark" size={16} color={colors.white} />
              </LinearGradient>
              <Text style={s.featureText}>Crie um checklist personalizado</Text>
            </Animated.View>

            <Animated.View
              style={[s.featureItem, createFeatureAnimStyle(feature2Anim)]}
            >
              <LinearGradient
                colors={[colors.sage, colors.teal]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.featureBadge}
              >
                <Ionicons name="image" size={16} color={colors.white} />
              </LinearGradient>
              <Text style={s.featureText}>
                Escolha seus looks para a viagem
              </Text>
            </Animated.View>

            <Animated.View
              style={[s.featureItem, createFeatureAnimStyle(feature3Anim)]}
            >
              <LinearGradient
                colors={[colors.gold, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.featureBadge}
              >
                <Ionicons name="map" size={16} color={colors.white} />
              </LinearGradient>
              <Text style={s.featureText}>Separe os pontos de visitação</Text>
            </Animated.View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => nav.push("/trips")}
            style={s.buttonWrapper}
          >
            <LinearGradient
              colors={[colors.blush, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.button}
            >
              <Text style={s.buttonText}>Organizar minha viagem agora</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </LinearGradient>
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
    shadowColor: colors.blush,
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
    shadowColor: colors.blush,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.white,
  },
  secondaryCTA: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    textDecorationLine: "underline",
  },
});

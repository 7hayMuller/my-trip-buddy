import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing } from "../theme";

export function EmptyStateTrips() {
  const nav = useRouter();
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
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
  }, []);

  const floatInterpolate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 20],
  });

  return (
    <View style={s.container}>
      <LinearGradient
        colors={[colors.blushLight, colors.tealLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.background}
      >
        <View style={s.content}>
          {/* Animated floating icon */}
          <Animated.View
            style={[
              s.iconContainer,
              {
                transform: [
                  { translateY: floatInterpolate },
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={[colors.blush, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.iconGradient}
            >
              <Ionicons name="airplane" size={64} color={colors.white} />
            </LinearGradient>
          </Animated.View>

          {/* Heading */}
          <Text style={s.heading}>Sua Próxima Aventura Aguarda!</Text>

          {/* Subheading */}
          <Text style={s.subheading}>
            Organize uma viagem incrível e comece a planejar cada detalhe
          </Text>

          {/* Features list */}
          <View style={s.featuresList}>
            <View style={s.featureItem}>
              <LinearGradient
                colors={[colors.purple, colors.blush]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.featureBadge}
              >
                <Ionicons name="checkmark" size={16} color={colors.white} />
              </LinearGradient>
              <Text style={s.featureText}>Checklist automático</Text>
            </View>

            <View style={s.featureItem}>
              <LinearGradient
                colors={[colors.sage, colors.teal]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.featureBadge}
              >
                <Ionicons name="image" size={16} color={colors.white} />
              </LinearGradient>
              <Text style={s.featureText}>Looks & inspiração</Text>
            </View>

            <View style={s.featureItem}>
              <LinearGradient
                colors={[colors.gold, colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.featureBadge}
              >
                <Ionicons name="map" size={16} color={colors.white} />
              </LinearGradient>
              <Text style={s.featureText}>Mapa de destinos</Text>
            </View>
          </View>

          {/* CTA Button */}
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
              <Text style={s.buttonText}>Criar Minha Primeira Viagem</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary CTA */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => nav.push("/trips")}
          >
            <Text style={s.secondaryCTA}>Ver todas as opções →</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
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
    color: colors.navy,
    textAlign: "center",
    marginBottom: spacing.sm,
    lineHeight: 34,
  },
  subheading: {
    fontSize: 15,
    color: colors.muted,
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
    backgroundColor: "rgba(255,255,255,0.6)",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
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
    color: colors.navy,
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
    color: colors.navy,
    textDecorationLine: "underline",
  },
});

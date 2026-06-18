import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Animated,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { colors, spacing, radius } from "../theme";

export default function LoginScreen() {
  const nav = useRouter();
  const insets = useSafeAreaInsets();
  const { loginWithEmail, verifyCode, loading, isSignedIn } = useAuth();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);

  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  // Redirecionar para home se já está logado
  useEffect(() => {
    if (isSignedIn) {
      nav.replace("/(tabs)");
    }
  }, [isSignedIn]);

  // Animação de entrada
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      speed: 8,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Email obrigatório", "Digite seu email para continuar");
      return;
    }

    const result = await loginWithEmail(email);
    if (result.success) {
      setSent(true);
      Alert.alert(
        "Link enviado!",
        `Verifique seu email (${email}) e clique no link para acessar`,
        [
          {
            text: "OK",
            onPress: () => {
              setEmail("");
              setSent(false);
            },
          },
        ]
      );
    } else {
      Alert.alert("Erro", result.error || "Erro ao enviar link");
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      Alert.alert("Código obrigatório", "Digite o código recebido no email");
      return;
    }

    const result = await verifyCode(email, code);
    if (result.success) {
      setCode("");
      setSent(false);
      setEmail("");
      // isSignedIn vai mudar e redirecionar automaticamente
    } else {
      Alert.alert("Erro", result.error || "Código inválido");
    }
  };

  return (
    <View style={s.root}>
      <LinearGradient
        colors={[colors.offwhite, colors.cream]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[s.content, { paddingTop: insets.top }]}>
        {/* Logo/Header */}
        <View style={s.header}>
          <View style={s.logoCircle}>
            <Ionicons name="airplane" size={50} color={colors.white} />
          </View>
          <Text style={s.title}>My Trip Buddy</Text>
          <Text style={s.subtitle}>Organize suas viagens com estilo</Text>
        </View>

        {/* Features */}
        <View style={s.features}>
          <FeatureItem
            icon="checkmark-circle"
            title="Checklist Inteligente"
            description="Organize tudo que precisa fazer"
          />
          <FeatureItem
            icon="image"
            title="Looks & Inspiração"
            description="Salve seus looks do Pinterest"
          />
          <FeatureItem
            icon="map"
            title="Mapa de Destinos"
            description="Explore lugares para visitar"
          />
        </View>
      </View>

      {/* Login Section */}
      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        {!sent ? (
          <>
            <View>
              <Text style={s.inputLabel}>Email</Text>
              <TextInput
                style={s.input}
                placeholder="seu@email.com"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[s.button, (loading || !email.trim()) && s.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading || !email.trim()}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={
                  loading || !email.trim()
                    ? [colors.border, colors.border]
                    : [colors.blush, "#D4697B"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.buttonGrad}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="mail" size={20} color={colors.white} />
                    <Text style={s.buttonText}>Enviar link de acesso</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={s.terms}>
              Enviaremos um link seguro{"\n"}para seu email
            </Text>
          </>
        ) : (
          <>
            <Text style={s.sentTitle}>Código enviado! ✅</Text>
            <Text style={s.sentSubtitle}>
              Verifique seu email e digite o código de 6 dígitos
            </Text>

            <View>
              <Text style={s.inputLabel}>Código</Text>
              <TextInput
                style={s.input}
                placeholder="000000"
                value={code}
                onChangeText={setCode}
                editable={!loading}
                placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              style={[s.button, (loading || !code.trim()) && s.buttonDisabled]}
              onPress={handleVerifyCode}
              disabled={loading || !code.trim()}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={
                  loading || !code.trim()
                    ? [colors.border, colors.border]
                    : [colors.blush, "#D4697B"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.buttonGrad}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color={colors.white} />
                    <Text style={s.buttonText}>Verificar código</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setSent(false); setEmail(""); setCode(""); }}>
              <Text style={s.changeEmail}>Usar outro email</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={s.featureItem}>
      <View style={s.featureIcon}>
        <Ionicons name={icon as any} size={24} color={colors.blush} />
      </View>
      <View style={s.featureText}>
        <Text style={s.featureTitle}>{title}</Text>
        <Text style={s.featureDesc}>{description}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },

  header: {
    alignItems: "center",
    marginBottom: spacing.xl * 2,
  },

  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.blush,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    shadowColor: colors.blush,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.navy,
    marginBottom: spacing.sm,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    color: colors.muted,
    textAlign: "center",
    fontWeight: "600",
  },

  features: {
    gap: spacing.md,
  },

  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.blushLight,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  featureText: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.navy,
    marginBottom: 2,
  },

  featureDesc: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
  },

  footer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.navy,
    marginBottom: spacing.sm,
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.navy,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },

  button: {
    borderRadius: radius.lg,
    overflow: "hidden",
    shadowColor: colors.blush,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },

  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },

  buttonGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },

  buttonText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.white,
  },

  terms: {
    fontSize: 11,
    color: colors.muted,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 16,
  },

  termsLink: {
    color: colors.navy,
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  sentTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.navy,
    textAlign: "center",
    marginBottom: spacing.sm,
  },

  sentSubtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
    marginBottom: spacing.lg,
    fontWeight: "500",
  },

  changeEmail: {
    fontSize: 13,
    color: colors.blush,
    textAlign: "center",
    fontWeight: "700",
    marginTop: spacing.md,
    textDecorationLine: "underline",
  },
});

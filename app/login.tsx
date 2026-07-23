import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../hooks/useAuth";
import { dark, radius, spacing } from "../theme";

export default function LoginScreen() {
  const nav = useRouter();
  const insets = useSafeAreaInsets();
  const { loginWithEmail, verifyCode, loginWithGoogle, loading, isSignedIn } =
    useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);

  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (isSignedIn) {
      nav.replace("/(tabs)");
    }
  }, [isSignedIn, nav]);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      speed: 8,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const result = await loginWithGoogle();
    setGoogleLoading(false);
    if (result.error) Alert.alert("Erro", result.error);
  };

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
        ],
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
    } else {
      Alert.alert("Erro", result.error || "Código inválido");
    }
  };

  return (
    <View style={s.root}>
      {/* <Video
        source={require("../assets/videos/boarding_loop.mp4")}
        rate={1.0}
        volume={0}
        isMuted={true}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        style={StyleSheet.absoluteFill}
      /> */}
      <LinearGradient
        colors={["rgba(5,5,5,0.4)", "rgba(5,5,5,0.6)", "rgba(5,5,5,0.8)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[s.content, { paddingTop: insets.top }]}>
        <Image
          source={require("../assets/images/splash-icon.png")}
          style={{
            width: 200,
            height: 200,
          }}
        />
        <Image
          source={require("../assets/images/buddy-logo.png")}
          style={{
            width: 300,
            height: 300,
            marginTop: -50,
            marginLeft: 50,
          }}
        />
      </View>

      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        {!sent ? (
          <>
            {Platform.OS !== "web" && (
              <>
                <TouchableOpacity
                  style={[s.googleBtn, googleLoading && s.buttonDisabled]}
                  onPress={handleGoogleLogin}
                  disabled={googleLoading || loading}
                  activeOpacity={0.85}
                >
                  {googleLoading ? (
                    <ActivityIndicator color={dark.white} size="small" />
                  ) : (
                    <>
                      <Image
                        source={require("../assets/images/icon-gmail.png")}
                        style={{ width: 22, height: 22 }}
                      />
                      <Text style={s.googleBtnText}>Continuar com Google</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={s.orRow}>
                  <View style={s.orLine} />
                  <Text style={s.orText}>ou</Text>
                  <View style={s.orLine} />
                </View>
              </>
            )}

            <View>
              <Text style={s.inputLabel}>Email</Text>
              <TextInput
                style={s.input}
                placeholder="seu@email.com"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
                placeholderTextColor={dark.muted}
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
              <View
                style={[
                  s.buttonGrad,
                  {
                    backgroundColor:
                      loading || !email.trim() ? dark.border : dark.lime,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={dark.ink} size="small" />
                ) : (
                  <>
                    <Image
                      source={require("../assets/images/icon-mail.png")}
                      style={{ width: 24, height: 24 }}
                    />
                    <Text style={s.buttonText}>Enviar link de acesso</Text>
                  </>
                )}
              </View>
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
                placeholderTextColor={dark.muted}
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
              <View
                style={[
                  s.buttonGrad,
                  {
                    backgroundColor:
                      loading || !code.trim() ? dark.border : dark.lime,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={dark.ink} size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color={dark.ink} />
                    <Text style={s.buttonText}>Verificar código</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setSent(false);
                setEmail("");
                setCode("");
              }}
            >
              <Text style={s.changeEmail}>Usar outro email</Text>
            </TouchableOpacity>
          </>
        )}
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
    backgroundColor: dark.pink,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
    shadowColor: dark.pink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    color: dark.white,
    marginBottom: spacing.sm,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
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
    backgroundColor: dark.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: dark.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },

  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: "rgba(236,107,163,0.15)",
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
    color: dark.white,
    marginBottom: 2,
  },

  featureDesc: {
    fontSize: 12,
    color: dark.muted,
    fontWeight: "500",
  },

  footer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: dark.white,
    marginBottom: spacing.sm,
  },

  input: {
    borderWidth: 1,
    borderColor: dark.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: dark.white,
    marginBottom: spacing.md,
    backgroundColor: dark.surfaceAlt,
  },

  button: {
    borderRadius: radius.lg,
    overflow: "hidden",
    shadowColor: dark.lime,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
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
    color: dark.ink,
  },

  terms: {
    fontSize: 11,
    color: dark.blue,
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 16,
  },

  termsLink: {
    color: dark.white,
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  sentTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: dark.white,
    textAlign: "center",
    marginBottom: spacing.sm,
  },

  sentSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginBottom: spacing.lg,
    fontWeight: "500",
  },

  changeEmail: {
    fontSize: 13,
    color: dark.pink,
    textAlign: "center",
    fontWeight: "700",
    marginTop: spacing.md,
    textDecorationLine: "underline",
  },

  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: "#EA4335",
    borderRadius: radius.lg,
    paddingVertical: 13,
    backgroundColor: "#EA4335",
    shadowColor: "#EA4335",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: dark.white,
  },

  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: dark.lime,
  },
  orText: {
    fontSize: 11,
    fontWeight: "700",
    color: dark.pink,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});

import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import i18n from "../i18n";
import { supabase } from "../utils/supabase";

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
      scopes: ["email", "profile"],
    });

    checkUser();

    const { data: { subscription } } = supabase?.auth.onAuthStateChange?.((_, session) => {
      setUser(session?.user ?? null);
    }) ?? { data: { subscription: null } };

    return () => {
      subscription?.unsubscribe?.();
    };
  }, []);

  async function checkUser() {
    try {
      if (supabase) {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session?.user && !error) setUser(session.user);
      }
    } catch {}
    finally { setLoading(false); }
  }

  async function loginWithEmail(email: string) {
    if (!supabase) return { error: i18n.t("auth:supabaseNotConfigured") };
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      return { success: true };
    } catch (e: any) {
      return { error: e.message || i18n.t("auth:sendCodeError") };
    }
  }

  async function verifyCode(email: string, token: string) {
    if (!supabase) return { error: i18n.t("auth:supabaseNotConfigured") };
    try {
      const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
      if (error) throw error;
      if (data?.session?.user) {
        setUser(data.session.user);
        return { success: true };
      }
      return { error: i18n.t("auth:invalidCode") };
    } catch (e: any) {
      return { error: e.message || i18n.t("auth:invalidCode") };
    }
  }

  async function loginWithGoogle(): Promise<{ success?: boolean; error?: string }> {
    if (!supabase) return { error: i18n.t("auth:supabaseNotConfigured") };

    try {
      if (Platform.OS === "android") {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;

      if (!idToken) return { error: i18n.t("auth:noGoogleToken") };

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });

      if (error) throw error;
      if (data?.session?.user) {
        setUser(data.session.user);
        return { success: true };
      }
      return { error: i18n.t("auth:createSessionError") };
    } catch (e: any) {
      return { error: e.message || i18n.t("auth:googleLoginError") };
    }
  }

  async function logout() {
    try {
      if (supabase) await supabase.auth.signOut();
      setUser(null);
    } catch {}
  }

  return {
    user,
    loading,
    loginWithEmail,
    verifyCode,
    loginWithGoogle,
    logout,
    isSignedIn: !!user,
  };
}

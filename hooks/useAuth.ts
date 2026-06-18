import { useEffect, useState } from "react";
import * as Linking from "expo-linking";
import { supabase } from "../utils/supabase";

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase?.auth.onAuthStateChange?.((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    }) ?? { data: { subscription: null } };

    // Ouvir deep links para redirecionar após clique no email
    const subscription2 = Linking.addEventListener("url", ({ url }) => {
      console.log("🔗 Deep link chegou:", url);
      // Tenta recuperar sessão quando deep link chegar
      checkUser();
    });

    return () => {
      subscription?.unsubscribe?.();
      subscription2.remove();
    };
  }, []);

  async function checkUser() {
    try {
      if (supabase) {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session?.user && !error) {
          setUser(session.user);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar usuário:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loginWithEmail(email: string) {
    if (!supabase) return { error: "Supabase não configurado" };

    try {
      console.log("📧 Enviando código para:", email);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error("Erro ao enviar código:", error);
      return { error: error.message || "Erro ao enviar código" };
    }
  }

  async function verifyCode(email: string, token: string) {
    if (!supabase) return { error: "Supabase não configurado" };

    try {
      console.log("🔐 Verificando código:", token);

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      if (error) throw error;
      if (data?.session?.user) {
        setUser(data.session.user);
        return { success: true };
      }
      return { error: "Código inválido" };
    } catch (error: any) {
      console.error("Erro ao verificar código:", error);
      return { error: error.message || "Código inválido" };
    }
  }

  async function logout() {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      setUser(null);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  }

  return {
    user,
    loading,
    loginWithEmail,
    verifyCode,
    logout,
    isSignedIn: !!user,
  };
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

WebBrowser.maybeCompleteAuthSession();

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Verificar se já está logado na inicialização
  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const token = await AsyncStorage.getItem("@user_token");
      if (token && supabase) {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
          setUser(user);
        } else {
          await AsyncStorage.removeItem("@user_token");
        }
      }
    } catch (error) {
      console.error("Erro ao verificar usuário:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogle() {
    if (!supabase) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data.url) {
        // Abre o URL no navegador
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          "myappscheme://"
        );

        if (result.type === "success") {
          // Aguarda um pouco para a sessão ser criada
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Busca o usuário logado
          const { data: { session }, error: sessionError } =
            await supabase.auth.getSession();

          if (sessionError) throw sessionError;

          if (session) {
            await AsyncStorage.setItem(
              "@user_token",
              session.access_token
            );
            setUser(session.user);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      await AsyncStorage.removeItem("@user_token");
      setUser(null);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  }

  return {
    user,
    loading,
    loginWithGoogle,
    logout,
    isSignedIn: !!user,
  };
}

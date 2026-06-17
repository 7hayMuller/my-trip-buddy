import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID =
  "738475165712-n61jam6po5smpt2qpv3u9a6onh6rgu9r.apps.googleusercontent.com";

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
  });

  // Verificar se já está logado na inicialização
  useEffect(() => {
    checkUser();
  }, []);

  // Handle login response
  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      if (authentication?.accessToken) {
        loginWithGoogle(authentication.accessToken);
      }
    }
  }, [response]);

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

  async function loginWithGoogle(googleAccessToken: string) {
    if (!supabase) return;

    try {
      setLoading(true);

      // Busca o ID token do Google usando o access token
      const googleUserResponse = await fetch(
        "https://www.googleapis.com/oauth2/v1/userinfo",
        {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
        }
      );

      if (!googleUserResponse.ok) {
        throw new Error("Failed to get Google user info");
      }

      const googleUser = await googleUserResponse.json();

      // Sign in com Supabase usando o Google user info
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: googleAccessToken,
      });

      if (error) {
        // Tenta fazer sign up se o usuário não existe
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({
            email: googleUser.email,
            password: Math.random().toString(36).slice(-12),
            options: {
              data: {
                name: googleUser.name,
                picture: googleUser.picture,
              },
            },
          });

        if (signUpError) throw signUpError;
        if (signUpData.user) {
          setUser(signUpData.user);
        }
      } else {
        if (data.user) {
          setUser(data.user);
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
      setUser(null);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  }

  return {
    user,
    loading,
    loginWithGoogle: () => promptAsync(),
    logout,
    isSignedIn: !!user,
  };
}

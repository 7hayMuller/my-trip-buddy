import { useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { supabase } from '../utils/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '854857410639-a9i5quj1pbv1hm6k3obr1c5eo7k5n5j8.apps.googleusercontent.com'; // Substitua com seu Client ID

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    redirectUrl: 'https://tavfguxqxxmnsrpthmjv.supabase.co/auth/v1/callback', // Substitua com sua URL
  });

  // Verificar se já está logado na inicialização
  useEffect(() => {
    checkUser();
  }, []);

  // Handle login response
  useEffect(() => {
    if (response?.type === 'success') {
      loginWithGoogle(response.authentication?.accessToken);
    }
  }, [response]);

  async function checkUser() {
    try {
      const token = await AsyncStorage.getItem('@user_token');
      if (token && supabase) {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
          setUser(user);
        } else {
          await AsyncStorage.removeItem('@user_token');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loginWithGoogle(idToken?: string) {
    if (!supabase || !idToken) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) throw error;

      if (data.session?.access_token) {
        await AsyncStorage.setItem('@user_token', data.session.access_token);
        setUser(data.user);
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      await AsyncStorage.removeItem('@user_token');
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
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

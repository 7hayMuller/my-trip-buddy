import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { TripProvider } from '../hooks/useTrips';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { loading, isSignedIn } = useAuth();

  useEffect(() => {
    // Listen for all deep links to debug
    const subscription = Linking.addEventListener("url", (event) => {
      console.log("⚡ Deep link received:", event.url);
    });

    // Check initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("⚡ Initial URL:", url);
      }
    });

    return () => subscription.remove();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.offwhite }}>
        <ActivityIndicator size="large" color={colors.blush} />
      </View>
    );
  }

  return (
    <TripProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Temporariamente skip login - comment back in when ready */}
          {false ? (
            <Stack.Screen name="login" />
          ) : (
            <>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="pinterest-picker" />
              <Stack.Screen name="places-picker" />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            </>
          )}
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </TripProvider>
  );
}

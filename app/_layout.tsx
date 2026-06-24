import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import * as Linking from "expo-linking";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useAuth } from "../hooks/useAuth";
import { TripProvider } from "../hooks/useTrips";
import { colors } from "../theme";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { loading } = useAuth();

  useEffect(() => {
    const subscription = Linking.addEventListener("url", (event) => {
      console.log("⚡ Deep link received:", event.url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log("⚡ Initial URL:", url);
      }
    });

    return () => subscription.remove();
  }, []);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.offwhite,
        }}
      >
        <ActivityIndicator size="large" color={colors.blush} />
      </View>
    );
  }

  return (
    <TripProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          {false ? (
            <Stack.Screen name="login" />
          ) : (
            <>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="pinterest-picker" />
              <Stack.Screen name="places-picker" />
              <Stack.Screen name="modal" options={{ presentation: "modal" }} />
            </>
          )}
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </TripProvider>
  );
}

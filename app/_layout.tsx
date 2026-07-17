import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
  const { loading, isSignedIn } = useAuth();

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
          {!isSignedIn ? (
            <Stack.Screen name="login" />
          ) : (
            <>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="pinterest-picker" />
              <Stack.Screen name="modal" options={{ presentation: "modal" }} />
            </>
          )}
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </TripProvider>
  );
}

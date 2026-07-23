import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { useAuth } from "../hooks/useAuth";
import { TripProvider } from "../hooks/useTrips";
import { dark } from "../theme";

// Controla como uma notificação agendada (contagem regressiva) aparece
// enquanto o app está aberto em primeiro plano — sem isso, ela só apareceria
// com o app em background/fechado.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const { loading, isSignedIn } = useAuth();

  if (loading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: dark.bg,
          }}
        >
          <ActivityIndicator size="large" color={dark.pink} />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <TripProvider>
        <ThemeProvider value={DarkTheme}>
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
          <StatusBar style="light" />
        </ThemeProvider>
      </TripProvider>
    </GestureHandlerRootView>
  );
}

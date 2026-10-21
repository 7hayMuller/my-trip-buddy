import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import "../i18n";

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
          {/* Stack.Protected bloqueia as rotas de verdade — só omitir os
              Stack.Screen não impedia o app de abrir direto na home (rota
              inicial) sem sessão, mostrando "Usuário" no perfil. */}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Protected guard={!isSignedIn}>
              <Stack.Screen name="login" />
            </Stack.Protected>
            <Stack.Protected guard={isSignedIn}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="pinterest-picker" />
              <Stack.Screen name="trip-form" />
              <Stack.Screen name="budget" />
              <Stack.Screen name="looks-days" />
              <Stack.Screen name="look-viewer" />
              <Stack.Screen name="modal" options={{ presentation: "modal" }} />
            </Stack.Protected>
          </Stack>
          <StatusBar style="light" />
        </ThemeProvider>
      </TripProvider>
    </GestureHandlerRootView>
  );
}

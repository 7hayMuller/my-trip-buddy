import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";
import { useTrips } from "@/hooks/useTrips";

export default function TabLayout() {
  const { trips } = useTrips();
  const hasTrips = trips && trips.length > 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.blush,
        tabBarInactiveTintColor: colors.navy,
        headerShown: false,
        tabBarStyle: {
          height: hasTrips ? 100 : 0,
          paddingBottom: hasTrips ? 12 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: "Viagens",
          tabBarIcon: ({ color }) => <Ionicons name="briefcase" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

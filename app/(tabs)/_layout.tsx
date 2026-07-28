import { dark as DARK } from "@/theme";
import { Tabs } from "expo-router";
import { Image } from "react-native";
import { useTranslation } from "react-i18next";

const TAB_ICON_SIZE = 30;

export default function TabLayout() {
  const { t } = useTranslation("tabs");
  return (
    <Tabs
      screenOptions={{
        tabBarInactiveTintColor: DARK.muted,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: DARK.bg,
          borderTopColor: DARK.border,
          height: 100,
          paddingBottom: 5,
          //tdisplay: activeTrips ? "flex" : "none",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("home"),
          tabBarActiveTintColor: DARK.blue,
          tabBarIcon: () => (
            <Image
              source={require("../../assets/images/icon-home.png")}
              style={{ width: TAB_ICON_SIZE, height: TAB_ICON_SIZE }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: t("trips"),
          tabBarActiveTintColor: DARK.green,
          tabBarIcon: () => (
            <Image
              source={require("../../assets/images/icon-airport.png")}
              style={{ width: TAB_ICON_SIZE, height: TAB_ICON_SIZE }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="itinerary"
        options={{
          title: t("itinerary"),
          tabBarActiveTintColor: DARK.pink,
          tabBarIcon: () => (
            <Image
              source={require("../../assets/images/icon-country.png")}
              style={{ width: TAB_ICON_SIZE, height: TAB_ICON_SIZE }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="looks"
        options={{
          title: t("looks"),
          tabBarActiveTintColor: DARK.yellow,
          tabBarIcon: () => (
            <Image
              source={require("../../assets/images/icon-tshirt.png")}
              style={{ width: TAB_ICON_SIZE, height: TAB_ICON_SIZE }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile"),
          tabBarActiveTintColor: DARK.blue,
          tabBarIcon: () => (
            <Image
              source={require("../../assets/images/icon-profile.png")}
              style={{ width: TAB_ICON_SIZE, height: TAB_ICON_SIZE }}
            />
          ),
        }}
      />
    </Tabs>
  );
}

import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { HapticTab } from "@/components/haptic-tab";
import { IconHome } from "@/components/IconHome";
import { IconSuitcase } from "@/components/IconSuitcase";
import { colors } from "@/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.blush,
        tabBarInactiveTintColor: colors.navy,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <View style={{ flex: 1 }}>
            <LinearGradient
              colors={[colors.offwhite, colors.cream]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          </View>
        ),
        tabBarStyle: {
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 12,
          height: 100,
          paddingBottom: 12,
          paddingTop: 8,
          borderRadius: 0,
          flexDirection: 'row',
          shadowColor: colors.navy,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        },
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
          marginTop: 4,
          letterSpacing: 0.5,
          color: colors.navy,
        },
        tabBarIconStyle: {
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 20,
                backgroundColor: focused ? `${color}25` : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <IconHome color={color} size={focused ? 32 : 28} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: "Viagens",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 20,
                backgroundColor: focused ? `${color}25` : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <IconSuitcase color={color} size={focused ? 32 : 28} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, focused }) => (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 20,
                backgroundColor: focused ? `${color}25` : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'all 0.3s ease',
              }}
            >
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={focused ? 32 : 28}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

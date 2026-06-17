import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { HapticTab } from "@/components/haptic-tab";
import { IconHome } from "@/components/IconHome";
import { IconPlane } from "@/components/IconPlane";
import { colors } from "@/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.blush,
        tabBarInactiveTintColor: colors.muted,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: () => (
          <View style={{ flex: 1 }}>
            <LinearGradient
              colors={[colors.navy, colors.navy2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
            {/* Top border accent */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: `linear-gradient(90deg, ${colors.blush}, ${colors.sage}, ${colors.teal})`,
              }}
            />
          </View>
        ),
        tabBarStyle: {
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          elevation: 20,
          height: 80,
          paddingBottom: 12,
          paddingTop: 12,
          borderRadius: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '800',
          marginTop: 6,
          letterSpacing: 0.5,
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
              <IconPlane color={color} size={focused ? 32 : 28} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

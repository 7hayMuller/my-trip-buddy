import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../hooks/useAuth";
import { colors, spacing, radius } from "../../theme";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const nav = useRouter();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    await logout();
    nav.replace("/login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.offwhite }}>
      <ScrollView
        style={s.container}
        contentContainerStyle={[s.content, { paddingTop: insets.top + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Meu Perfil</Text>
        </View>

        {/* User Info Card */}
        <LinearGradient
          colors={[colors.blushLight, colors.accentLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.userCard}
        >
          <View style={s.avatarContainer}>
            <View style={s.avatar}>
              <Ionicons name="person" size={48} color={colors.white} />
            </View>
          </View>

          <View style={s.userInfo}>
            <Text style={s.userName}>
              {user?.user_metadata?.name || "Usuário"}
            </Text>
            <Text style={s.userEmail}>{user?.email || ""}</Text>
            <View style={s.badgeContainer}>
              <View style={s.badge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.green} />
                <Text style={s.badgeText}>Verificado</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Stats */}
        <View style={s.statsContainer}>
          <StatCard icon="airplane" label="Viagens" value="0" />
          <StatCard icon="checklist" label="Tarefas" value="0" />
          <StatCard icon="heart" label="Favoritados" value="0" />
        </View>

        {/* Settings Section */}
        <Text style={s.sectionLabel}>Configurações</Text>

        <TouchableOpacity style={s.settingItem} activeOpacity={0.7}>
          <View style={s.settingIcon}>
            <Ionicons name="notifications-outline" size={20} color={colors.navy} />
          </View>
          <Text style={s.settingText}>Notificações</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={s.settingItem} activeOpacity={0.7}>
          <View style={s.settingIcon}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.navy} />
          </View>
          <Text style={s.settingText}>Privacidade</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={s.settingItem} activeOpacity={0.7}>
          <View style={s.settingIcon}>
            <Ionicons name="help-circle-outline" size={20} color={colors.navy} />
          </View>
          <Text style={s.settingText}>Ajuda & Suporte</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </TouchableOpacity>

        {/* Logout Button */}
        <View style={s.logoutContainer}>
          <TouchableOpacity
            style={s.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#FF6B6B", "#FF5252"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.logoutGrad}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.white} />
              <Text style={s.logoutText}>Sair da Conta</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.lg }} />
      </ScrollView>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={s.statCard}>
      <Ionicons name={icon as any} size={24} color={colors.blush} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offwhite,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  header: {
    marginBottom: spacing.xl,
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.navy,
  },

  userCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    shadowColor: colors.blush,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },

  avatarContainer: {
    alignItems: "center",
    marginBottom: spacing.md,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.blush,
    justifyContent: "center",
    alignItems: "center",
  },

  userInfo: {
    alignItems: "center",
  },

  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.navy,
    marginBottom: spacing.xs,
  },

  userEmail: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "600",
    marginBottom: spacing.md,
  },

  badgeContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(15, 110, 86, 0.1)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.green,
  },

  statsContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },

  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.navy,
    marginVertical: spacing.xs,
  },

  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
    textAlign: "center",
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.muted,
    marginBottom: spacing.sm,
  },

  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },

  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.offwhite,
    justifyContent: "center",
    alignItems: "center",
  },

  settingText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.navy,
  },

  logoutContainer: {
    marginTop: spacing.xl,
  },

  logoutButton: {
    borderRadius: radius.lg,
    overflow: "hidden",
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },

  logoutGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },

  logoutText: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.white,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotifRemindersPicker } from "../../components/NotifRemindersPicker";
import { useAuth } from "../../hooks/useAuth";
import { useTrips } from "../../hooks/useTrips";
import { dark, radius, spacing } from "../../theme";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { notifSettings, toggleNotifDay, setCustomNotifDay } = useTrips();
  const nav = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation("profile");

  const handleLogout = async () => {
    await logout();
    nav.replace({ pathname: "/login" });
  };

  const notifyPermissionDenied = () => {
    Alert.alert(
      t("notifPermissionRequiredTitle"),
      t("notifPermissionRequiredMessage"),
    );
  };

  const handleToggleMilestone = async (days: number) => {
    const result = await toggleNotifDay(days);
    if (!result?.granted) notifyPermissionDenied();
  };

  const handleSetCustom = async (days: number | null) => {
    const result = await setCustomNotifDay(days);
    if (!result?.granted) notifyPermissionDenied();
  };

  return (
    <View style={{ flex: 1, backgroundColor: dark.bg }}>
      <ScrollView
        style={s.container}
        contentContainerStyle={[
          s.content,
          { paddingTop: insets.top + spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>{t("title")}</Text>
        </View>

        {/* User Info Card */}
        <View style={s.userCard}>
          <View style={s.avatarContainer}>
            <View style={s.avatar}>
              <Image
                source={require("../../assets/images/icon-profile.png")}
                style={s.avatarIcon}
              />
            </View>
          </View>

          <View style={s.userInfo}>
            <Text style={s.userName}>
              {user?.user_metadata?.name || t("defaultUserName")}
            </Text>
            <Text style={s.userEmail}>{user?.email || ""}</Text>
            {/* <View style={s.badgeContainer}>
              <View style={s.badge}>
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={dark.green}
                />
                <Text style={s.badgeText}>Verificado</Text>
              </View>
            </View> */}
          </View>
        </View>

        {/* Stats */}
        {/* <View style={s.statsContainer}>
          <StatCard icon="airplane" label="Viagens" value="0" color={dark.green} />
          <StatCard icon="checklist" label="Tarefas" value="0" color={dark.blue} />
          <StatCard icon="heart" label="Favoritados" value="0" color={dark.pink} />
        </View> */}

        {/* Settings Section */}
        <Text style={s.sectionLabel}>{t("settings")}</Text>

        <View style={s.notifCard}>
          <View style={s.notifHeader}>
            <View style={s.settingIcon}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color={dark.white}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.settingText}>{t("notifications")}</Text>
              <Text style={s.notifHint}>
                {t("notificationsHint")}
              </Text>
            </View>
          </View>

          <NotifRemindersPicker
            value={(notifSettings ?? []) as number[]}
            onToggleMilestone={handleToggleMilestone}
            onSetCustom={handleSetCustom}
          />
        </View>

        <TouchableOpacity style={s.settingItem} activeOpacity={0.7}>
          <View style={s.settingIcon}>
            <Ionicons name="lock-closed-outline" size={20} color={dark.white} />
          </View>
          <Text style={s.settingText}>{t("privacy")}</Text>
          <Ionicons name="chevron-forward" size={18} color={dark.muted} />
        </TouchableOpacity>

        <TouchableOpacity style={s.settingItem} activeOpacity={0.7}>
          <View style={s.settingIcon}>
            <Ionicons name="help-circle-outline" size={20} color={dark.white} />
          </View>
          <Text style={s.settingText}>{t("helpSupport")}</Text>
          <Ionicons name="chevron-forward" size={18} color={dark.muted} />
        </TouchableOpacity>

        {/* Logout Button */}
        <View style={s.logoutContainer}>
          <TouchableOpacity
            style={s.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Image
              source={require("../../assets/images/icon-logout.png")}
              style={{ width: 22, height: 22 }}
            />
            <Text style={s.logoutText}>{t("logout")}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.lg }} />
      </ScrollView>
    </View>
  );
}

// function StatCard({
//   icon,
//   label,
//   value,
//   color,
// }: {
//   icon: string;
//   label: string;
//   value: string;
//   color: string;
// }) {
//   return (
//     <View style={s.statCard}>
//       <Ionicons name={icon as any} size={24} color={color} />
//       <Text style={s.statValue}>{value}</Text>
//       <Text style={s.statLabel}>{label}</Text>
//     </View>
//   );
// }

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dark.bg,
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
    color: dark.white,
  },

  userCard: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    backgroundColor: dark.lime,
    shadowColor: dark.blue,
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
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarIcon: { width: 64, height: 64 },

  userInfo: {
    alignItems: "center",
  },

  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: dark.ink,
    marginBottom: spacing.xs,
  },

  userEmail: {
    fontSize: 13,
    color: "rgba(10,10,10,0.6)",
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
    backgroundColor: "rgba(0,0,0,0.15)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: dark.green,
  },

  statsContainer: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },

  statCard: {
    flex: 1,
    backgroundColor: dark.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: dark.border,
  },

  statValue: {
    fontSize: 18,
    fontWeight: "900",
    color: dark.white,
    marginVertical: spacing.xs,
  },

  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: dark.muted,
    textAlign: "center",
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: dark.muted,
    marginBottom: spacing.sm,
  },

  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: dark.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: dark.border,
  },

  notifCard: {
    backgroundColor: dark.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: dark.border,
  },
  notifHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  notifHint: {
    fontSize: 11,
    fontWeight: "600",
    color: dark.muted,
    marginTop: 2,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: dark.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },

  settingText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: dark.white,
  },

  logoutContainer: {
    marginTop: spacing.xl,
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "#FF5252",
    shadowColor: "#FF5252",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },

  logoutText: {
    fontSize: 15,
    fontWeight: "800",
    color: dark.white,
  },
});

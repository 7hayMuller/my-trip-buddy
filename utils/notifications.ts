import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { Trip } from "../types";

export const MILESTONES = [50, 40, 30, 20, 10, 5, 1] as const;
export type Milestone = (typeof MILESTONES)[number];

export type NotificationSettings = Record<Milestone, boolean>;

const SETTINGS_KEY = "@wanderlust_notif_settings";
// Prefixo usado no identifier de cada notificação agendada, pra conseguir
// cancelar só as de contagem regressiva (sem mexer em outras que o app
// venha a agendar por outro motivo no futuro).
const NOTIF_PREFIX = "trip-countdown-";
const CHANNEL_ID = "trip-countdown";

const DEFAULT_SETTINGS: NotificationSettings = {
  50: true,
  40: true,
  30: true,
  20: true,
  10: true,
  5: true,
  1: true,
};

export async function loadNotificationSettings(): Promise<NotificationSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveNotificationSettings(
  settings: NotificationSettings,
): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

export async function requestNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

function messageFor(milestone: Milestone, tripName: string): string {
  if (milestone === 1) return `${tripName} é amanhã! 🎉 Prepare a mala!`;
  return `Faltam ${milestone} dias para ${tripName}! ✈️`;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Contagem regressiva da viagem",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function cancelScheduledCountdowns(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(NOTIF_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

// Reagenda as notificações de contagem regressiva pra viagem informada,
// conforme os marcos habilitados em `settings`. Cancela tudo que já estava
// agendado antes — chamar de novo (viagem trocou, marco mudou) é sempre
// seguro, nunca duplica.
export async function rescheduleTripCountdown(
  trip: Pick<Trip, "id" | "name" | "depart"> | null,
  settings: NotificationSettings,
): Promise<void> {
  await cancelScheduledCountdowns();
  if (!trip || !trip.depart) return;

  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  await ensureAndroidChannel();

  const depart = new Date(`${trip.depart}T09:00:00`);
  if (Number.isNaN(depart.getTime())) return;
  const now = new Date();

  for (const milestone of MILESTONES) {
    if (!settings[milestone]) continue;
    const triggerDate = new Date(depart);
    triggerDate.setDate(triggerDate.getDate() - milestone);
    if (triggerDate <= now) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `${NOTIF_PREFIX}${trip.id}-${milestone}`,
      content: {
        title: "My Trip Buddy",
        body: messageFor(milestone, trip.name),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: CHANNEL_ID,
      },
    });
  }
}

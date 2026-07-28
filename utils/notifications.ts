import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import i18n from "../i18n";
import { Trip } from "../types";

// Cada número é um lembrete ativo: "avisar X dias antes da viagem". A lista
// em si já representa os lembretes ativos (sem entrada = sem aviso) — mistura
// marcos fixos (MILESTONES, com checkbox na UI) e no máximo um valor
// personalizado digitado pela pessoa.
export type NotificationSettings = number[];

export const MILESTONES = [50, 40, 30, 20, 10, 5, 1] as const;

const SETTINGS_KEY = "@wanderlust_notif_settings";
// Prefixo usado no identifier de cada notificação agendada, pra conseguir
// cancelar só as de contagem regressiva (sem mexer em outras que o app
// venha a agendar por outro motivo no futuro).
const NOTIF_PREFIX = "trip-countdown-";
const CHANNEL_ID = "trip-countdown";

const DEFAULT_SETTINGS: NotificationSettings = [30, 7, 1];

export async function loadNotificationSettings(): Promise<NotificationSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return [...DEFAULT_SETTINGS];
    const parsed = JSON.parse(raw);
    // Formato antigo: { "50": true, "40": false, ... }. Migra pra lista dos
    // marcos que estavam ligados.
    if (!Array.isArray(parsed)) {
      return Object.entries(parsed)
        .filter(([, on]) => on)
        .map(([days]) => Number(days))
        .sort((a, b) => b - a);
    }
    return parsed;
  } catch {
    return [...DEFAULT_SETTINGS];
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

function messageFor(daysBefore: number, tripName: string): string {
  if (daysBefore === 1)
    return i18n.t("notifRemindersPicker:notifTomorrow", { tripName });
  return i18n.t("notifRemindersPicker:notifCountdown", { daysBefore, tripName });
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: i18n.t("notifRemindersPicker:channelName"),
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
// uma por lembrete ativo em `settings`. Cancela tudo que já estava agendado
// antes — chamar de novo (viagem trocou, lembrete mudou) é sempre seguro,
// nunca duplica.
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

  for (const daysBefore of settings) {
    if (daysBefore <= 0) continue;
    const triggerDate = new Date(depart);
    triggerDate.setDate(triggerDate.getDate() - daysBefore);
    if (triggerDate <= now) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `${NOTIF_PREFIX}${trip.id}-${daysBefore}`,
      content: {
        title: "My Trip Buddy",
        body: messageFor(daysBefore, trip.name),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: CHANNEL_ID,
      },
    });
  }
}

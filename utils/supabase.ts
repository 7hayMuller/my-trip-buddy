import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const URL  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? '';
const KEY  = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const DEVICE_KEY = '@wanderlust_device_id';

export const supabase = URL && KEY
  ? createClient(URL, KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : null;

export const isConfigured = !!supabase;

/* ── device ID (chave única por instalação) ──────────────────────── */

export async function getDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await AsyncStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

/* ── sync ────────────────────────────────────────────────────────── */

export interface CloudData {
  trips:  any[];
  checks: any[];
  looks:  any[];
  places: any[];
}

export async function loadFromCloud(deviceId: string): Promise<CloudData | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('app_data')
      .select('trips, checks, looks, places')
      .eq('device_id', deviceId)
      .single();
    if (error || !data) return null;
    return data as CloudData;
  } catch {
    return null;
  }
}

export async function saveToCloud(deviceId: string, payload: CloudData): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('app_data').upsert({
      device_id: deviceId,
      ...payload,
      synced_at: new Date().toISOString(),
    });
  } catch {}
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const URL  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? '';
const KEY  = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const DEVICE_KEY = '@wanderlust_device_id';

// Durante o build estático do web (Expo `output: "static"`), este módulo é
// avaliado em Node puro, que não tem `WebSocket` global. O Supabase cria o
// cliente Realtime mesmo sem uso de `.channel()`, então passamos um stub
// nesse caso só para evitar o erro — RN e browsers sempre têm WebSocket nativo.
class NoopWebSocket {
  close() {}
  send() {}
  addEventListener() {}
  removeEventListener() {}
}

export const supabase = URL && KEY
  ? createClient(URL, KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      realtime: typeof WebSocket === 'undefined'
        ? { transport: NoopWebSocket as any }
        : undefined,
    })
  : null;

export const isConfigured = !!supabase;

/* ── device ID (chave única por instalação) ──────────────────────── */

let deviceIdCache: string | null = null;

export async function getDeviceId(): Promise<string> {
  // Return cached ID if available
  if (deviceIdCache) return deviceIdCache;

  try {
    let id = await AsyncStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await AsyncStorage.setItem(DEVICE_KEY, id).catch(() => {
        // Silently fail if AsyncStorage not available
      });
    }
    deviceIdCache = id;
    return id;
  } catch {
    // Fallback: generate and cache a temporary ID
    deviceIdCache = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return deviceIdCache;
  }
}

/* ── sync ────────────────────────────────────────────────────────── */

export interface CloudData {
  trips:  any[];
  checks: any[];
  looks:  any[];
}

export async function loadFromCloud(deviceId: string): Promise<CloudData | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('app_data')
      .select('trips, checks, looks')
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

/* ── image upload ────────────────────────────────────────────────── */

const IMAGES_BUCKET = 'trip-images';

function contentTypeFor(uri: string): string {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic' || ext === 'heif') return 'image/heic';
  return 'image/jpeg';
}

// Faz upload de uma imagem local (URI do image-picker) para o Storage e
// retorna a URL pública. Sem isso, salvaríamos só o caminho local do arquivo,
// que não existe em outros dispositivos nem sobrevive à limpeza de cache do SO.
export async function uploadImage(uri: string, path: string): Promise<string | null> {
  if (!supabase) return null;
  try {
    const arraybuffer = await fetch(uri).then((res) => res.arrayBuffer());
    const { error } = await supabase.storage
      .from(IMAGES_BUCKET)
      .upload(path, arraybuffer, { contentType: contentTypeFor(uri), upsert: true });
    if (error) return null;
    const { data } = supabase.storage.from(IMAGES_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}

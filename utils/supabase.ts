import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const URL  = process.env.EXPO_PUBLIC_SUPABASE_URL  ?? '';
const KEY  = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

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
        // Sem um storage explícito, no celular a sessão fica só em memória e o
        // usuário precisa logar de novo a cada abertura do app. No build
        // estático do web (Node, sem `window`) não há onde persistir.
        storage: typeof window !== 'undefined' ? AsyncStorage : undefined,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
      realtime: typeof WebSocket === 'undefined'
        ? { transport: NoopWebSocket as any }
        : undefined,
    })
  : null;

export const isConfigured = !!supabase;

// No celular, só renova o token com o app em primeiro plano — recomendação do
// Supabase para React Native, evita refresh falhando com o app em background.
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/* ── usuário logado ──────────────────────────────────────────────── */

// Os dados na nuvem e as imagens ficam ligados ao usuário (user_data.user_id e
// a pasta <user_id>/ no Storage), protegidos por RLS — ver
// supabase_security_migration.sql.
export async function getCurrentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

/* ── sync ────────────────────────────────────────────────────────── */

export interface CloudData {
  trips:  any[];
  checks: any[];
  looks:  any[];
}

export async function loadFromCloud(userId: string): Promise<CloudData | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('trips, checks, looks')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return data as CloudData;
  } catch {
    return null;
  }
}

export async function saveToCloud(userId: string, payload: CloudData): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('user_data').upsert({
      user_id: userId,
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

/* ── exclusão de conta ───────────────────────────────────────────── */

// Apaga as imagens do usuário (capas e looks). Precisa rodar antes de
// deleteAuthUser, enquanto ainda há sessão — as policies do Storage só deixam
// cada um apagar a própria pasta. A linha em user_data sai sozinha pelo
// on delete cascade quando o usuário é removido.
export async function deleteCloudImages(userId: string): Promise<void> {
  if (!supabase) return;
  for (const folder of ['covers', 'looks']) {
    const prefix = `${userId}/${folder}`;
    const { data: files } = await supabase.storage.from(IMAGES_BUCKET).list(prefix, { limit: 1000 });
    if (files?.length) {
      await supabase.storage.from(IMAGES_BUCKET).remove(files.map((f) => `${prefix}/${f.name}`));
    }
  }
}

// Exclui o usuário autenticado de auth.users via função SQL `delete_user`
// (ver supabase_delete_user_migration.sql) — o client não tem permissão de
// apagar usuários diretamente.
export async function deleteAuthUser(): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase not configured' };
  const { error } = await supabase.rpc('delete_user');
  return error ? { error: error.message } : {};
}

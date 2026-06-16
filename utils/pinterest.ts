import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'https://api.pinterest.com/v5';
const TOKEN_KEY = '@pinterest_access_token';

export const PINTEREST_CLIENT_ID =
  process.env.EXPO_PUBLIC_PINTEREST_CLIENT_ID ?? '';
export const PINTEREST_CLIENT_SECRET =
  process.env.EXPO_PUBLIC_PINTEREST_CLIENT_SECRET ?? '';
export const PINTEREST_STATIC_TOKEN =
  process.env.EXPO_PUBLIC_PINTEREST_ACCESS_TOKEN ?? '';

// ── token storage ────────────────────────────────────────────────────────────

export async function getStoredToken(): Promise<string | null> {
  // Static token from .env takes priority
  if (PINTEREST_STATIC_TOKEN) return PINTEREST_STATIC_TOKEN;
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function storeToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// ── code → access token exchange ─────────────────────────────────────────────

export async function exchangeCode(
  code: string,
  redirectUri: string,
  codeVerifier: string,
): Promise<string> {
  const credentials = btoa(`${PINTEREST_CLIENT_ID}:${PINTEREST_CLIENT_SECRET}`);
  const res = await fetch(`${BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }).toString(),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(data.message ?? 'Token exchange failed');
  return data.access_token as string;
}

// ── API calls ────────────────────────────────────────────────────────────────

export interface PinterestBoard {
  id: string;
  name: string;
  media?: { image_cover_url?: string };
  pin_count?: number;
}

export interface PinterestPin {
  id: string;
  title?: string;
  media?: {
    images?: {
      originals?: { url: string };
      '1200x'?: { url: string };
      '600x'?: { url: string };
      '400x300'?: { url: string };
    };
  };
}

export async function fetchBoards(token: string): Promise<PinterestBoard[]> {
  const res = await fetch(`${BASE_URL}/boards?page_size=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return (data.items ?? []) as PinterestBoard[];
}

export async function fetchPins(
  token: string,
  boardId: string,
  bookmark?: string,
): Promise<{ items: PinterestPin[]; bookmark?: string }> {
  const params = new URLSearchParams({ page_size: '50' });
  if (bookmark) params.set('bookmark', bookmark);
  const res = await fetch(`${BASE_URL}/boards/${boardId}/pins?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return { items: (data.items ?? []) as PinterestPin[], bookmark: data.bookmark };
}

export async function fetchAllPins(token: string): Promise<PinterestPin[]> {
  const res = await fetch(`${BASE_URL}/pins?page_size=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? `Erro ${res.status}`);
  return (data.items ?? []) as PinterestPin[];
}

export async function searchPins(
  token: string,
  query: string,
): Promise<PinterestPin[]> {
  const params = new URLSearchParams({ query, page_size: '50' });
  const res = await fetch(`${BASE_URL}/search/pins?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? `Erro ${res.status}`);
  return (data.items ?? []) as PinterestPin[];
}

export function pinterestSearchUrl(query: string): string {
  return `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
}

export function getPinImageUrl(pin: PinterestPin): string | null {
  const imgs = pin.media?.images;
  return (
    imgs?.['1200x']?.url ??
    imgs?.originals?.url ??
    imgs?.['600x']?.url ??
    imgs?.['400x300']?.url ??
    null
  );
}

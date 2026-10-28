import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../i18n";
import { supabase } from "./supabase";
import type { HotelDetails } from "./hotelDataService";

// Autocomplete/detalhes de hotéis via Edge Function `places`
// (supabase/functions/places) — a chave do Google fica só no servidor.

export interface HotelSuggestion {
  placeId: string;
  name: string;
  address: string;
}

export interface PlaceHotelDetails extends Omit<HotelDetails, "fetchedAt"> {
  placeId: string;
}

const CACHE_PREFIX = "@wanderlust_place_";
// A photoUri do Google não é permanente, então não guardamos por muito tempo.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Session token agrupa as chamadas de autocomplete + o details final numa
// única sessão de cobrança no Google. Um por busca (renovado após escolher).
export function newSessionToken(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function invoke<T>(body: Record<string, unknown>): Promise<T | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.functions.invoke("places", {
    body: { ...body, lang: i18n.language === "en" ? "en" : "pt-BR" },
  });
  if (error) {
    console.warn("[places]", error.message);
    return null;
  }
  return data as T;
}

export async function searchHotels(
  input: string,
  sessionToken: string,
): Promise<HotelSuggestion[]> {
  if (input.trim().length < 3) return [];
  const data = await invoke<{ suggestions: HotelSuggestion[] }>({
    action: "autocomplete",
    input,
    sessionToken,
  });
  return data?.suggestions ?? [];
}

export async function getHotelDetails(
  placeId: string,
  sessionToken?: string,
): Promise<PlaceHotelDetails | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + placeId);
    if (raw) {
      const cached = JSON.parse(raw);
      if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached;
    }
  } catch {}

  const data = await invoke<PlaceHotelDetails>({
    action: "details",
    placeId,
    sessionToken,
  });
  if (!data?.placeId) return null;

  try {
    await AsyncStorage.setItem(
      CACHE_PREFIX + placeId,
      JSON.stringify({ ...data, fetchedAt: Date.now() }),
    );
  } catch {}
  return data;
}

// ─── busca de lugares do itinerário ───────────────────────────────────────────

export interface PlaceLocation {
  placeId: string;
  name: string;
  lat: number;
  lon: number;
  country?: string;
}

export async function searchPlacesAutocomplete(
  input: string,
  sessionToken: string,
): Promise<HotelSuggestion[]> {
  if (input.trim().length < 2) return [];
  const data = await invoke<{ suggestions: HotelSuggestion[] }>({
    action: "search",
    input,
    sessionToken,
  });
  return data?.suggestions ?? [];
}

export async function getPlaceLocation(
  placeId: string,
  sessionToken?: string,
): Promise<PlaceLocation | null> {
  const data = await invoke<PlaceLocation>({
    action: "locate",
    placeId,
    sessionToken,
  });
  if (typeof data?.lat !== "number" || typeof data?.lon !== "number") return null;
  return data;
}

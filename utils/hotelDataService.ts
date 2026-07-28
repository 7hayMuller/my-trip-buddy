import AsyncStorage from "@react-native-async-storage/async-storage";

export interface HotelDetails {
  name: string;
  address: string;
  rating: number;
  totalRatings: number;
  priceLevel: number | null;
  photoUrl: string | null;
  googleMapsUrl: string;
  fetchedAt: number;
}

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? "";
const SV_BASE    = "https://maps.googleapis.com/maps/api/streetview";
const CACHE_PREFIX = "@wanderlust_hotel_";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// ─── cache ────────────────────────────────────────────────────────────────────

async function readCache(key: string): Promise<HotelDetails | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const cached: HotelDetails = JSON.parse(raw);
    if (Date.now() - cached.fetchedAt > CACHE_TTL_MS) return null;
    return cached;
  } catch {
    return null;
  }
}

async function writeCache(key: string, data: HotelDetails): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
  } catch {}
}

// ─── Street View Static ───────────────────────────────────────────────────────

/**
 * URL da Street View Static API — retorna JPEG direto, sem redirect.
 *
 * Não fazemos pré-verificação com /metadata porque essa chamada (fetch) é
 * bloqueada por CORS no browser (Expo web). A tag <img> (usada pelo expo-image)
 * não tem essa restrição; se a API não estiver habilitada, onError dispara no
 * HotelCard e o fallback Unsplash é exibido automaticamente.
 */
function streetViewUrl(hotelName: string, city: string): string {
  const loc = encodeURIComponent(`${hotelName}, ${city}`);
  return `${SV_BASE}?size=600x400&location=${loc}&fov=90&pitch=0&key=${GOOGLE_KEY}`;
}

// ─── busca principal ──────────────────────────────────────────────────────────

/**
 * Retorna detalhes + foto do hotel.
 * Usa Street View Static API — funciona com chave demo sem billing.
 * Não depende da Places API (New).
 */
export async function fetchHotelDetails(
  hotelName: string,
  city: string,
): Promise<HotelDetails | null> {
  if (!hotelName.trim()) return null;

  const cacheKey = `${hotelName}_${city}`.toLowerCase().replace(/\s+/g, "_");
  const cached = await readCache(cacheKey);
  if (cached) return cached;

  // Street View carregado direto pelo <Image> (sem fetch CORS-bloqueado)
  const photoUrl = streetViewUrl(hotelName, city);
  console.log("[hotelService] photoUrl:", photoUrl.slice(0, 90));

  const details: HotelDetails = {
    name: hotelName,
    address: city,
    rating: 0,
    totalRatings: 0,
    priceLevel: null,
    photoUrl,
    googleMapsUrl: `https://maps.google.com/?q=${encodeURIComponent(`${hotelName} ${city}`)}`,
    fetchedAt: Date.now(),
  };

  await writeCache(cacheKey, details);
  return details;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

export function priceLevelLabel(level: number | null): string {
  if (level === null) return "";
  return "$".repeat(Math.min(level + 1, 4));
}

export async function clearHotelCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const hotelKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (hotelKeys.length > 0) await AsyncStorage.multiRemove(hotelKeys);
  } catch {}
}

export function ratingStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

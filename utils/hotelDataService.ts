/**
 * hotelService.ts
 *
 * Busca foto e avaliação de um hotel pelo nome usando Google Places API (New).
 * Cacheia resultado por 24h — dados de hotel mudam pouco.
 *
 * Setup:
 *   1. console.cloud.google.com → ativar "Places API (New)"
 *   2. Criar API key → restringir ao bundle ID do app
 *   3. Substituir GOOGLE_PLACES_KEY abaixo
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── tipos ────────────────────────────────────────────────────────────────────

export interface HotelDetails {
  name: string;
  address: string;
  rating: number; // 1.0 – 5.0
  totalRatings: number;
  priceLevel: number | null; // 0-4, null se não disponível
  photoUrl: string | null; // URL direto da foto
  googleMapsUrl: string;
  fetchedAt: number;
}

// ─── config ───────────────────────────────────────────────────────────────────

// Em produção: leia de expo-constants / react-native-config
const GOOGLE_PLACES_KEY = "SUA_GOOGLE_PLACES_KEY_AQUI";

const PLACES_BASE = "https://places.googleapis.com/v1";
const CACHE_PREFIX = "@wanderlust_hotel_";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

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

// ─── foto ─────────────────────────────────────────────────────────────────────

function buildPhotoUrl(photoName: string): string {
  // photoName vem como "places/ChIJ.../photos/AUc7tX..."
  return (
    `${PLACES_BASE}/${photoName}/media` +
    `?maxHeightPx=600&maxWidthPx=800&key=${GOOGLE_PLACES_KEY}`
  );
}

// ─── busca principal ──────────────────────────────────────────────────────────

/**
 * Busca foto + avaliação do hotel pelo nome e cidade.
 * Usa Text Search da Places API (New).
 */
export async function fetchHotelDetails(
  hotelName: string,
  city: string,
  forceRefresh = false,
): Promise<HotelDetails | null> {
  const cacheKey = `${hotelName}_${city}`.toLowerCase().replace(/\s+/g, "_");

  if (!forceRefresh) {
    const cached = await readCache(cacheKey);
    if (cached) return cached;
  }

  try {
    // Text Search — encontra o hotel pelo nome + cidade
    const searchRes = await fetch(`${PLACES_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_KEY,
        // quais campos queremos (cobrança só sobre os solicitados)
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress," +
          "places.rating,places.userRatingCount,places.priceLevel," +
          "places.photos,places.googleMapsUri",
      },
      body: JSON.stringify({
        textQuery: `${hotelName} hotel ${city}`,
        languageCode: "pt",
        maxResultCount: 1,
        includedType: "lodging",
      }),
    });

    if (!searchRes.ok) {
      console.warn("[hotelService] Places search HTTP", searchRes.status);
      return null;
    }

    const searchData = await searchRes.json();
    const place = searchData?.places?.[0];
    if (!place) return null;

    // pega a primeira foto disponível
    const photoName: string | null = place.photos?.[0]?.name ?? null;

    const details: HotelDetails = {
      name: place.displayName?.text ?? hotelName,
      address: place.formattedAddress ?? city,
      rating: place.rating ?? 0,
      totalRatings: place.userRatingCount ?? 0,
      priceLevel: place.priceLevel ?? null,
      photoUrl: photoName ? buildPhotoUrl(photoName) : null,
      googleMapsUrl: place.googleMapsUri ?? "",
      fetchedAt: Date.now(),
    };

    await writeCache(cacheKey, details);
    return details;
  } catch (err) {
    console.error("[hotelService] erro:", err);
    return null;
  }
}

// ─── helpers de exibição ──────────────────────────────────────────────────────

/** Converte priceLevel (0-4) em símbolos $ */
export function priceLevelLabel(level: number | null): string {
  if (level === null) return "";
  return "$".repeat(Math.min(level + 1, 4));
}

/** Estrelas de avaliação como string visual */
export function ratingStars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty);
}

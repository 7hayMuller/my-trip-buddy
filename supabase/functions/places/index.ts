// Proxy da Google Places API (New) para o autocomplete de hotéis.
//
// A chave do Google fica só aqui, como secret do Supabase (GOOGLE_PLACES_KEY),
// e nunca vai pro bundle do app — variáveis EXPO_PUBLIC_* são embutidas no
// JS e qualquer um extrai do APK. Só usuários logados podem chamar.
//
// Deploy:
//   supabase secrets set GOOGLE_PLACES_KEY=<chave>
//   supabase functions deploy places

import { createClient } from "jsr:@supabase/supabase-js@2";

const GOOGLE_KEY = Deno.env.get("GOOGLE_PLACES_KEY") ?? "";
const PLACES = "https://places.googleapis.com/v1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

// types: ["lodging"] pro campo de hotel; sem filtro na busca de lugares do
// itinerário (cidades, museus, restaurantes...).
async function autocomplete(
  input: string,
  sessionToken?: string,
  lang?: string,
  types?: string[],
) {
  const res = await fetch(`${PLACES}/places:autocomplete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_KEY,
    },
    body: JSON.stringify({
      input,
      includedPrimaryTypes: types,
      languageCode: lang,
      sessionToken,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? `Places ${res.status}`);

  return (data.suggestions ?? [])
    .map((s: any) => s.placePrediction)
    .filter(Boolean)
    .map((p: any) => ({
      placeId: p.placeId,
      name: p.structuredFormat?.mainText?.text ?? p.text?.text ?? "",
      address: p.structuredFormat?.secondaryText?.text ?? "",
    }));
}

// Coordenadas + país de um lugar escolhido no autocomplete do itinerário.
async function locate(placeId: string, sessionToken?: string, lang?: string) {
  const params = new URLSearchParams();
  if (sessionToken) params.set("sessionToken", sessionToken);
  if (lang) params.set("languageCode", lang);
  const res = await fetch(`${PLACES}/places/${encodeURIComponent(placeId)}?${params}`, {
    headers: {
      "X-Goog-Api-Key": GOOGLE_KEY,
      "X-Goog-FieldMask": "id,displayName,location,addressComponents",
    },
  });
  const p = await res.json();
  if (!res.ok) throw new Error(p.error?.message ?? `Places ${res.status}`);

  const country = (p.addressComponents ?? []).find((c: any) =>
    c.types?.includes("country")
  );
  return {
    placeId: p.id,
    name: p.displayName?.text ?? "",
    lat: p.location?.latitude,
    lon: p.location?.longitude,
    country: country?.longText,
  };
}

// A URL de mídia da foto exige a chave na query; com skipHttpRedirect o Google
// devolve a photoUri final (googleusercontent), que pode ir pro app sem a chave.
async function photoUri(photoName: string): Promise<string | null> {
  const res = await fetch(
    `${PLACES}/${photoName}/media?maxWidthPx=800&skipHttpRedirect=true`,
    { headers: { "X-Goog-Api-Key": GOOGLE_KEY } },
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.photoUri ?? null;
}

const PRICE_LEVELS: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

async function details(placeId: string, sessionToken?: string, lang?: string) {
  const params = new URLSearchParams();
  if (sessionToken) params.set("sessionToken", sessionToken);
  if (lang) params.set("languageCode", lang);
  const res = await fetch(`${PLACES}/places/${encodeURIComponent(placeId)}?${params}`, {
    headers: {
      "X-Goog-Api-Key": GOOGLE_KEY,
      "X-Goog-FieldMask":
        "id,displayName,formattedAddress,rating,userRatingCount,priceLevel,googleMapsUri,photos",
    },
  });
  const p = await res.json();
  if (!res.ok) throw new Error(p.error?.message ?? `Places ${res.status}`);

  const firstPhoto = p.photos?.[0]?.name;
  return {
    placeId: p.id,
    name: p.displayName?.text ?? "",
    address: p.formattedAddress ?? "",
    rating: p.rating ?? 0,
    totalRatings: p.userRatingCount ?? 0,
    priceLevel: PRICE_LEVELS[p.priceLevel] ?? null,
    googleMapsUrl: p.googleMapsUri ?? "",
    photoUrl: firstPhoto ? await photoUri(firstPhoto) : null,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!GOOGLE_KEY) return json({ error: "GOOGLE_PLACES_KEY not set" }, 500);

  // O gateway já valida o JWT, mas a anon key também é um JWT válido —
  // aqui garantimos que é um usuário logado de verdade.
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, 401);

  try {
    const { action, input, placeId, sessionToken, lang } = await req.json();
    if (action === "autocomplete") {
      const text = String(input ?? "").trim();
      if (text.length < 3) return json({ suggestions: [] });
      return json({
        suggestions: await autocomplete(text.slice(0, 120), sessionToken, lang, ["lodging"]),
      });
    }
    if (action === "search") {
      const text = String(input ?? "").trim();
      if (text.length < 2) return json({ suggestions: [] });
      return json({ suggestions: await autocomplete(text.slice(0, 120), sessionToken, lang) });
    }
    if (action === "locate" && placeId) {
      return json(await locate(String(placeId), sessionToken, lang));
    }
    if (action === "details" && placeId) {
      return json(await details(String(placeId), sessionToken, lang));
    }
    return json({ error: "invalid action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 502);
  }
});

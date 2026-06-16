const BASE = "https://api.unsplash.com";
export const UNSPLASH_KEY = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY ?? "";

export interface UnsplashPhoto {
  id: string;
  width: number;
  height: number;
  urls: { regular: string; small: string; thumb: string };
  alt_description?: string;
  user: { name: string };
}

export async function searchPlacePhotos(
  query: string,
  perPage = 20,
  orientation: "landscape" | "portrait" | "squarish" = "landscape",
): Promise<UnsplashPhoto[]> {
  if (!UNSPLASH_KEY) throw new Error("NO_KEY");
  const params = new URLSearchParams({
    query,
    per_page: String(perPage),
    orientation,
    content_filter: "high",
  });
  const res = await fetch(`${BASE}/search/photos?${params}`, {
    headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors?.[0] ?? `Erro ${res.status}`);
  return (data.results ?? []) as UnsplashPhoto[];
}

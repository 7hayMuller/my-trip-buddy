const PHOTON_URL = "https://photon.komoot.io/api/";

export interface GeoSearchResult {
  label: string;
  lat: number;
  lon: number;
  country?: string;
}

// Photon (komoot) roda sobre os mesmos dados do OpenStreetMap que o
// Nominatim, mas com um índice de busca full-text bem mais tolerante a
// termos livres/landmarks ("shibuya crossing", "hollywood sign" etc). É
// gratuito, sem API key. Mesmo assim, mantemos um throttle leve pra não
// sobrecarregar o servidor demo público deles.
let queue: Promise<unknown> = Promise.resolve();

function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => new Promise((r) => setTimeout(r, 400)),
    () => new Promise((r) => setTimeout(r, 400)),
  );
  return run;
}

interface PhotonProps {
  name?: string;
  city?: string;
  state?: string;
  country?: string;
}

// Monta um rótulo curto e legível a partir dos campos estruturados do Photon
// (bem mais limpo que o display_name gigante do Nominatim).
function buildLabel(props: PhotonProps): string {
  const parts = [props.name, props.city ?? props.state, props.country].filter(
    (p): p is string => !!p,
  );
  const unique = parts.filter((p, i) => i === 0 || p !== parts[i - 1]);
  return unique.slice(0, 3).join(", ");
}

export function searchPlaces(query: string, limit = 5): Promise<GeoSearchResult[]> {
  const q = query.trim();
  if (!q) return Promise.resolve([]);

  return throttled(async () => {
    try {
      const params = new URLSearchParams({ q, limit: String(limit), lang: "en" });
      const res = await fetch(`${PHOTON_URL}?${params}`);
      if (!res.ok) return [];
      const data = await res.json();
      const features = Array.isArray(data?.features) ? data.features : [];
      const results: GeoSearchResult[] = [];
      for (const f of features) {
        const coords = f?.geometry?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) continue;
        const [lon, lat] = coords;
        if (typeof lat !== "number" || typeof lon !== "number") continue;
        const label = buildLabel(f.properties ?? {});
        if (!label) continue;
        results.push({ label, lat, lon, country: f.properties?.country });
      }
      return results;
    } catch {
      return [];
    }
  });
}

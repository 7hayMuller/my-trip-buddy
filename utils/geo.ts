// Coordenadas reais (lon, lat) por destino conhecido — usado tanto pelo mapa
// estilizado (WorldMapPin) quanto pelo mapa real (ItineraryMap).
export const DEST_COORDS: Record<string, { lon: number; lat: number }> = {
  // Japão
  japão:           { lon: 138.0,  lat: 36.0  },
  tóquio:          { lon: 139.7,  lat: 35.7  },
  tokyo:           { lon: 139.7,  lat: 35.7  },
  kyoto:           { lon: 135.8,  lat: 35.0  },
  osaka:           { lon: 135.5,  lat: 34.7  },
  // Coreia
  seul:            { lon: 126.9,  lat: 37.6  },
  seoul:           { lon: 126.9,  lat: 37.6  },
  coreia:          { lon: 127.8,  lat: 35.9  },
  // China
  beijing:         { lon: 116.4,  lat: 39.9  },
  pequim:          { lon: 116.4,  lat: 39.9  },
  shanghai:        { lon: 121.5,  lat: 31.2  },
  "hong kong":     { lon: 114.2,  lat: 22.3  },
  china:           { lon: 104.2,  lat: 35.9  },
  // SE Asiático
  bangkok:         { lon: 100.5,  lat: 13.8  },
  tailândia:       { lon: 100.9,  lat: 15.9  },
  bali:            { lon: 115.2,  lat: -8.4  },
  indonésia:       { lon: 113.9,  lat: -0.8  },
  singapura:       { lon: 103.8,  lat: 1.4   },
  singapore:       { lon: 103.8,  lat: 1.4   },
  vietnã:          { lon: 108.3,  lat: 14.1  },
  hanói:           { lon: 105.8,  lat: 21.0  },
  "ho chi minh":   { lon: 106.7,  lat: 10.8  },
  filipinas:       { lon: 122.6,  lat: 12.9  },
  manila:          { lon: 120.9,  lat: 14.6  },
  malásia:         { lon: 109.7,  lat: 4.2   },
  phuket:          { lon: 98.4,   lat: 7.9   },
  // Sul da Ásia
  índia:           { lon: 78.9,   lat: 20.6  },
  india:           { lon: 78.9,   lat: 20.6  },
  delhi:           { lon: 77.2,   lat: 28.6  },
  mumbai:          { lon: 72.9,   lat: 19.1  },
  goa:             { lon: 74.1,   lat: 15.3  },
  // Oriente Médio
  dubai:           { lon: 55.3,   lat: 25.2  },
  "abu dhabi":     { lon: 54.4,   lat: 24.5  },
  doha:            { lon: 51.5,   lat: 25.3  },
  "tel aviv":      { lon: 34.8,   lat: 32.1  },
  israel:          { lon: 35.2,   lat: 31.8  },
  jordânia:        { lon: 36.2,   lat: 31.2  },
  // Europa Ocidental
  paris:           { lon: 2.3,    lat: 48.9  },
  frança:          { lon: 2.2,    lat: 46.2  },
  lisboa:          { lon: -9.1,   lat: 38.7  },
  portugal:        { lon: -8.2,   lat: 39.4  },
  madrid:          { lon: -3.7,   lat: 40.4  },
  espanha:         { lon: -3.7,   lat: 40.4  },
  barcelona:       { lon: 2.2,    lat: 41.4  },
  london:          { lon: -0.1,   lat: 51.5  },
  londres:         { lon: -0.1,   lat: 51.5  },
  amsterdam:       { lon: 4.9,    lat: 52.4  },
  berlim:          { lon: 13.4,   lat: 52.5  },
  berlin:          { lon: 13.4,   lat: 52.5  },
  // Europa Sul
  roma:            { lon: 12.5,   lat: 41.9  },
  itália:          { lon: 12.6,   lat: 42.5  },
  milão:           { lon: 9.2,    lat: 45.5  },
  veneza:          { lon: 12.3,   lat: 45.4  },
  florença:        { lon: 11.3,   lat: 43.8  },
  grécia:          { lon: 21.8,   lat: 39.1  },
  santorini:       { lon: 25.4,   lat: 36.4  },
  atenas:          { lon: 23.7,   lat: 37.97 },
  croácia:         { lon: 15.2,   lat: 45.1  },
  dubrovnik:       { lon: 18.1,   lat: 42.6  },
  // Europa Norte
  estocolmo:       { lon: 18.1,   lat: 59.3  },
  suécia:          { lon: 18.6,   lat: 63.0  },
  oslo:            { lon: 10.8,   lat: 59.9  },
  noruega:         { lon: 10.0,   lat: 64.0  },
  copenhague:      { lon: 12.6,   lat: 55.7  },
  dinamarca:       { lon: 10.0,   lat: 56.3  },
  // Europa Leste
  viena:           { lon: 16.4,   lat: 48.2  },
  praga:           { lon: 14.4,   lat: 50.1  },
  budapeste:       { lon: 19.0,   lat: 47.5  },
  varsóvia:        { lon: 21.0,   lat: 52.2  },
  moscou:          { lon: 37.6,   lat: 55.8  },
  istambul:        { lon: 28.9,   lat: 41.0  },
  turquia:         { lon: 35.2,   lat: 38.9  },
  // África
  marrocos:        { lon: -7.1,   lat: 31.8  },
  cairo:           { lon: 31.2,   lat: 30.1  },
  egito:           { lon: 30.8,   lat: 26.8  },
  quênia:          { lon: 37.9,   lat: -0.4  },
  nairóbi:         { lon: 36.8,   lat: -1.3  },
  zanzibar:        { lon: 39.4,   lat: -6.2  },
  tanzânia:        { lon: 34.9,   lat: -6.4  },
  // América do Norte — EUA
  "nova york":     { lon: -74.0,  lat: 40.7  },
  "new york":      { lon: -74.0,  lat: 40.7  },
  nyc:             { lon: -74.0,  lat: 40.7  },
  ny:              { lon: -74.0,  lat: 40.7  },
  "los angeles":   { lon: -118.2, lat: 34.1  },
  la:              { lon: -118.2, lat: 34.1  },
  california:      { lon: -119.4, lat: 36.8  },
  "san francisco": { lon: -122.4, lat: 37.8  },
  "las vegas":     { lon: -115.1, lat: 36.2  },
  chicago:         { lon: -87.6,  lat: 41.9  },
  miami:           { lon: -80.2,  lat: 25.8  },
  orlando:         { lon: -81.4,  lat: 28.5  },
  boston:          { lon: -71.1,  lat: 42.4  },
  seattle:         { lon: -122.3, lat: 47.6  },
  denver:          { lon: -104.9, lat: 39.7  },
  dallas:          { lon: -96.8,  lat: 32.8  },
  houston:         { lon: -95.4,  lat: 29.8  },
  atlanta:         { lon: -84.4,  lat: 33.7  },
  washington:      { lon: -77.0,  lat: 38.9  },
  toronto:         { lon: -79.4,  lat: 43.7  },
  vancouver:       { lon: -123.1, lat: 49.3  },
  montreal:        { lon: -73.6,  lat: 45.5  },
  canadá:          { lon: -96.8,  lat: 56.1  },
  // Caribe / América Central
  cancún:          { lon: -86.8,  lat: 21.2  },
  méxico:          { lon: -102.6, lat: 23.6  },
  havana:          { lon: -82.4,  lat: 23.1  },
  cuba:            { lon: -79.5,  lat: 21.5  },
  "costa rica":    { lon: -84.2,  lat: 9.7   },
  // América do Sul
  brasil:          { lon: -51.9,  lat: -14.2 },
  "são paulo":     { lon: -46.6,  lat: -23.5 },
  "rio de janeiro":{ lon: -43.2,  lat: -22.9 },
  rio:             { lon: -43.2,  lat: -22.9 },
  "buenos aires":  { lon: -58.4,  lat: -34.6 },
  argentina:       { lon: -63.6,  lat: -38.4 },
  chile:           { lon: -71.5,  lat: -35.7 },
  peru:            { lon: -75.0,  lat: -9.2  },
  lima:            { lon: -77.0,  lat: -12.0 },
  colômbia:        { lon: -74.3,  lat: 4.6   },
  bogotá:          { lon: -74.1,  lat: 4.7   },
  cartagena:       { lon: -75.5,  lat: 10.4  },
  // Oceania
  austrália:       { lon: 133.8,  lat: -25.3 },
  sydney:          { lon: 151.2,  lat: -33.9 },
  melbourne:       { lon: 144.9,  lat: -37.8 },
  "nova zelândia": { lon: 172.5,  lat: -41.3 },
  auckland:        { lon: 174.8,  lat: -36.9 },
  // Ilhas
  maldivas:        { lon: 73.2,   lat: 3.2   },
  havaí:           { lon: -157.8, lat: 21.3  },
  hawaii:          { lon: -157.8, lat: 21.3  },
};

export interface DestinationCoord {
  lon: number;
  lat: number;
  label: string;
  country?: string;
}

// Resolve cada destino digitado (texto livre) para uma coordenada, na ordem
// em que os destinos foram adicionados. Se `overrides` tiver uma entrada
// exata para o destino (ex: escolhido pela busca do mapa, com coordenada
// precisa do Nominatim), ela tem prioridade sobre o lookup aproximado por
// substring no dicionário estático DEST_COORDS.
export function resolveDestinationCoords(
  destinations: string[],
  overrides?: Record<string, { lat: number; lon: number; country?: string }>,
): DestinationCoord[] {
  const seen = new Set<string>();
  const results: DestinationCoord[] = [];
  for (const dest of destinations) {
    const override = overrides?.[dest];
    if (override) {
      results.push({ ...override, label: dest });
      continue;
    }
    const lower = dest.toLowerCase();
    for (const [key, coord] of Object.entries(DEST_COORDS)) {
      if (lower.includes(key) && !seen.has(key)) {
        seen.add(key);
        results.push({ ...coord, label: dest });
        break;
      }
    }
  }
  return results;
}

// Paleta fixa pra colorir pins por país — mesma cor sempre pro mesmo país
// (hash determinístico do nome), pra não ficar tudo com a cor default e
// confundir quando há vários países no mapa. País desconhecido cai no cinza.
const COUNTRY_PALETTE = [
  '#14B8A6', '#FB7185', '#8B5CF6', '#F59E0B',
  '#22C55E', '#F97316', '#0EA5E9', '#EC4899',
];
const UNKNOWN_COUNTRY_COLOR = '#7E8EA6';

export function colorForCountry(country?: string): string {
  if (!country) return UNKNOWN_COUNTRY_COLOR;
  let hash = 0;
  for (let i = 0; i < country.length; i++) {
    hash = (hash * 31 + country.charCodeAt(i)) >>> 0;
  }
  return COUNTRY_PALETTE[hash % COUNTRY_PALETTE.length];
}

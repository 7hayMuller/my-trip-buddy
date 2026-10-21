export const colors = {
  // Horizon palette — calm ocean + sunset energy
  navy: "#162032",
  navy2: "#1E2D42",
  navyDeep: "#0D1626",

  // Primary: vivid teal (ocean calm)
  teal: "#14B8A6",
  teal2: "#0D9488",
  tealLight: "#CCFBF1",

  white: "#FFFFFF",
  cream: "#FAFBFE",
  offwhite: "#F1F5FB",
  muted: "#7E8EA6",
  border: "#DDE4EF",
  ink: "#162032",

  // Accent: coral-orange (sunset energy)
  accent: "#F97316",
  accentLight: "#FFF7ED",

  // Gold: warm amber
  gold: "#F59E0B",
  goldLight: "#FFFBEB",

  // Sage: fresh grass green
  sage: "#22C55E",
  sageLight: "#F0FDF4",

  // Purple: electric violet
  purple: "#8B5CF6",
  purpleLight: "#F5F3FF",

  // Green: emerald
  green: "#10B981",
  greenLight: "#ECFDF5",

  // Blush: vibrant rose
  blush: "#FB7185",
  blushLight: "#FFF1F2",

  // Hero gradients
  heroOverlay: "rgba(22,32,50,0.5)",
  heroGrad1: "rgba(22,32,50,0.0)",
  heroGrad2: "rgba(22,32,50,0.65)",
  heroGrad3: "rgba(13,22,38,0.95)",

  // Glassmorphism effects
  routeLine: "rgba(255,255,255,0.25)",
  routeDot: "#14B8A6",
  cdBg: "rgba(255,255,255,0.08)",
  cdBorder: "rgba(255,255,255,0.12)",
  cdNum: "#FFFFFF",
  cdLabel: "rgba(255,255,255,0.55)",
  cdSep: "rgba(255,255,255,0.25)",

  warning: "#D97706",
  warningLight: "#FEF5E7",
  warningBorder: "#F9E5B8",

  // Gradients: violet → coral → amber
  gradStart: "#8B5CF6",
  gradMid: "#F97316",
  gradEnd: "#F59E0B",
} as const;

// Paleta "dark pop-block" — fundo quase preto + blocos de cor bem saturada,
// baseada numa referência de UI enviada pelo usuário (amostrada por pixel).
// Convive com `colors` acima enquanto o app inteiro migra pra ela.
export const dark = {
  bg: "#050505",
  surface: "#0D0D0F",
  surfaceAlt: "#141416",
  border: "rgba(255,255,255,0.08)",
  white: "#FFFFFF",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,0.55)",
  mutedStrong: "rgba(255,255,255,0.35)",
  ink: "#0A0A0A",
  pink: "#EC6BA3",
  yellow: "#ECE22E",
  blue: "#4590F8",
  green: "#18E058",
  lime: "#b6fd02",
} as const;

export const fonts = {
  display: "PlayfairDisplay-Italic",
  displayBold: "PlayfairDisplay-BoldItalic",
  body: "Nunito-Regular",
  semibold: "Nunito-SemiBold",
  bold: "Nunito-Bold",
  extrabold: "Nunito-ExtraBold",
  black: "Nunito-Black",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
} as const;

export const shadow = {
  sm: {
    shadowColor: "#1B2B4B",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#1B2B4B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  teal: {
    shadowColor: "#3BBFB2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// Unsplash destination image map (free, no API key needed)
export const DESTINATION_IMAGES: Record<string, string> = {
  japão:
    "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800&q=80",
  tóquio:
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
  kyoto:
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80",
  paris:
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80",
  "nova york":
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
  "new york":
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
  ny: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
  roma: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80",
  barcelona:
    "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80",
  lisboa:
    "https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&q=80",
  dubai:
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80",
  bangkok:
    "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80",
  bali: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
  default:
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80",
};

export function getDestImage(dest: string): string {
  const lower = dest.toLowerCase();
  for (const [key, url] of Object.entries(DESTINATION_IMAGES)) {
    if (lower.includes(key)) return url;
  }
  return DESTINATION_IMAGES["default"];
}

// Prioridade: capa escolhida pelo usuário → foto do destino buscada no
// Unsplash (autoCover, salva pela home) → tabela fixa → imagem padrão.
export function getTripImage(trip: {
  name: string;
  destinations: string[];
  coverImage?: string;
  autoCover?: string;
  autoCoverFor?: string;
}): string {
  if (trip.coverImage) return trip.coverImage;
  // autoCover só vale para o destino que ela foi buscada (autoCoverFor) —
  // se o usuário trocou o destino, cai na tabela até a home buscar outra.
  if (trip.autoCover && trip.autoCoverFor === trip.destinations[0]) return trip.autoCover;
  return getKnownTripImage(trip) ?? DESTINATION_IMAGES["default"];
}

// Foto da tabela fixa DESTINATION_IMAGES, ou null se nenhum destino/nome bate.
export function getKnownTripImage(trip: {
  name: string;
  destinations: string[];
}): string | null {
  const text = [...trip.destinations, trip.name].join(" ");
  for (const [key, url] of Object.entries(DESTINATION_IMAGES)) {
    if (key !== "default" && matchesWord(text, key)) return url;
  }
  return null;
}

// Compara palavra inteira — com includes, "ny" batia em "Germany"/"Kenya" e
// "roma" em "Romania", mostrando a foto de Nova York/Roma.
function matchesWord(text: string, key: string): boolean {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}])${escaped}($|[^\\p{L}])`, "iu").test(text);
}

// Capa determinada só pelos destinos — sem fallback para coverImage
// customizado. Usada em telas onde a capa não deve ser editável pelo usuário.
export function getDestinationsImage(destinations: string[]): string {
  const lower = destinations.join(" ").toLowerCase();
  for (const [key, url] of Object.entries(DESTINATION_IMAGES)) {
    if (lower.includes(key)) return url;
  }
  return DESTINATION_IMAGES["default"];
}

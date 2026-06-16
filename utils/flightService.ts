import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

// ─── tipos ────────────────────────────────────────────────────────────────────

export type FlightStatus =
  | "scheduled"
  | "en-route"
  | "landed"
  | "delayed"
  | "cancelled"
  | "diverted"
  | "unknown";

export interface FlightInfo {
  flightIata: string;
  flightNumber: string;
  airlineIata: string;
  airlineName: string;
  airlineLogoUrl: string;

  aircraftIcao: string;
  aircraftModel: string;
  registration: string;

  depIata: string;
  depAirportName: string;
  depTerminal: string;
  depGate: string;
  depScheduled: string;
  depEstimated: string;
  depActual: string;

  arrIata: string;
  arrAirportName: string;
  arrTerminal: string;
  arrGate: string;
  arrBaggage: string;
  arrScheduled: string;
  arrEstimated: string;
  arrActual: string;

  status: FlightStatus;
  delayMinutes: number | null;
  duration: number;

  fetchedAt: number;
}

// ─── config ───────────────────────────────────────────────────────────────────

/**
 * Lê a key do app.config.ts via expo-constants.
 * Durante desenvolvimento você pode substituir direto aqui,
 * mas nunca commite a key em repositório público.
 *
 * app.config.ts:
 *   extra: { airlabsKey: process.env.AIRLABS_KEY }
 *
 * .env na raiz:
 *   AIRLABS_KEY=sua_chave_aqui
 */
const AIRLABS_KEY: string =
  (Constants.expoConfig?.extra?.airlabsKey as string | undefined) ??
  "252f7078-538a-4ac9-ba16-3319f03d50af"; // ← substitua aqui para dev rápido

const AIRLABS_BASE = "https://airlabs.co/api/v9";
const CACHE_PREFIX = "@wanderlust_flight_";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

// ─── helpers internos ─────────────────────────────────────────────────────────

function normalizeIata(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

function parseStatus(raw?: string): FlightStatus {
  const map: Record<string, FlightStatus> = {
    scheduled: "scheduled",
    "en-route": "en-route",
    landed: "landed",
    delayed: "delayed",
    cancelled: "cancelled",
    diverted: "diverted",
  };
  return map[raw?.toLowerCase() ?? ""] ?? "unknown";
}

function logoUrl(iata: string): string {
  return `https://airlabs.co/img/airline/s/${iata}.png`;
}

// ─── cache ────────────────────────────────────────────────────────────────────

async function readCache(key: string): Promise<FlightInfo | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const data: FlightInfo = JSON.parse(raw);
    if (Date.now() - data.fetchedAt > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

async function writeCache(key: string, data: FlightInfo): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
  } catch {}
}

// ─── fetch principal ──────────────────────────────────────────────────────────

/**
 * Busca status completo de um voo pelo número IATA.
 *
 * @param flightNumber  ex: "JL047", "G3 1234", "LA8082"
 * @param forceRefresh  ignora cache e busca dados frescos
 */
export async function fetchFlightInfo(
  flightNumber: string,
  forceRefresh = false,
): Promise<FlightInfo | null> {
  const iata = normalizeIata(flightNumber);
  if (!iata) return null;

  if (!forceRefresh) {
    const cached = await readCache(iata);
    if (cached) return cached;
  }

  try {
    const url = `${AIRLABS_BASE}/flight?flight_iata=${iata}&api_key=${AIRLABS_KEY}`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      console.warn(`[flightService] HTTP ${res.status} para ${iata}`);
      return null;
    }

    const json = await res.json();

    // AirLabs retorna erro com campo `errors` quando voo não existe
    if (json?.errors || !json?.response) return null;

    const d = json.response;

    const info: FlightInfo = {
      flightIata: d.flight_iata ?? iata,
      flightNumber: d.flight_number ?? iata.slice(2),
      airlineIata: d.airline_iata ?? "",
      airlineName: d.airline_name ?? d.airline_iata ?? "",
      airlineLogoUrl: logoUrl(d.airline_iata ?? ""),

      aircraftIcao: d.aircraft_icao ?? "",
      aircraftModel: d.model ?? "",
      registration: d.reg_number ?? "",

      depIata: d.dep_iata ?? "",
      depAirportName: d.dep_name ?? d.dep_iata ?? "",
      depTerminal: d.dep_terminal ?? "—",
      depGate: d.dep_gate ?? "—",
      depScheduled: d.dep_time ?? "",
      depEstimated: d.dep_estimated ?? d.dep_time ?? "",
      depActual: d.dep_actual ?? "",

      arrIata: d.arr_iata ?? "",
      arrAirportName: d.arr_name ?? d.arr_iata ?? "",
      arrTerminal: d.arr_terminal ?? "—",
      arrGate: d.arr_gate ?? "—",
      arrBaggage: d.arr_baggage ?? "—",
      arrScheduled: d.arr_time ?? "",
      arrEstimated: d.arr_estimated ?? d.arr_time ?? "",
      arrActual: d.arr_actual ?? "",

      status: parseStatus(d.status),
      delayMinutes: d.delayed ?? null,
      duration: d.duration ?? 0,

      fetchedAt: Date.now(),
    };

    await writeCache(iata, info);
    return info;
  } catch (err) {
    console.error("[flightService] erro na busca:", err);
    return null;
  }
}

// ─── helpers de exibição ──────────────────────────────────────────────────────

/** "2025-09-14 23:45" → "23:45" */
export function formatTime(datetime: string): string {
  if (!datetime) return "—";
  return datetime.split(" ")[1]?.slice(0, 5) ?? "—";
}

/** "2025-09-14 23:45" → "14 set" */
export function formatDate(datetime: string): string {
  if (!datetime) return "—";
  try {
    const d = new Date(datetime.replace(" ", "T"));
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  } catch {
    return "—";
  }
}

/** 870 → "14h 30min" */
export function formatDuration(minutes: number): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/** Status em português com cor */
export function statusLabel(status: FlightStatus): {
  text: string;
  emoji: string;
  color: string;
} {
  const map: Record<
    FlightStatus,
    { text: string; emoji: string; color: string }
  > = {
    scheduled: { text: "No horário", emoji: "🟢", color: "#0F6E56" },
    "en-route": { text: "Em voo", emoji: "✈️", color: "#3BBFB2" },
    landed: { text: "Pousou", emoji: "🛬", color: "#534AB7" },
    delayed: { text: "Atrasado", emoji: "🟡", color: "#B07D2E" },
    cancelled: { text: "Cancelado", emoji: "🔴", color: "#D4537E" },
    diverted: { text: "Desviado", emoji: "⚠️", color: "#D4537E" },
    unknown: { text: "Sem dados", emoji: "⚪", color: "#8FA3C0" },
  };
  return map[status];
}

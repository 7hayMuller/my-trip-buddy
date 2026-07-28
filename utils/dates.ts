import { eachDayOfInterval, format } from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import i18n from "../i18n";

export const UNASSIGNED_DAY_KEY = "sem-data";

export interface TripDay {
  key: string; // "YYYY-MM-DD"
  date: Date;
  dayNumber: number; // 1-based
  weekdayLabel: string; // "qui"
  dayLabel: string; // "24"
  monthLabel: string; // "julho"
}

// Sempre constrói a data com "T00:00:00" (mesma convenção de trip-form.tsx)
// pra evitar que o fuso horário jogue o dia pra trás/frente.
function parseDate(d: string): Date {
  return new Date(`${d}T00:00:00`);
}

// O locale ptBR do date-fns não tem forma abreviada real pro token "EEE"
// (retorna o nome completo, ex: "domingo") — por isso a abreviação de 3
// letras é montada manualmente aqui, indexada por getDay().
const WEEKDAY_SHORT: Record<string, string[]> = {
  pt: ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"],
  en: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
};

// Idioma é fixado na inicialização do app (detecção automática, sem toggle
// manual — ver i18n/index.ts), então não precisa ser reativo aqui.
function currentDateLocale() {
  return i18n.language === "en" ? enUS : ptBR;
}

export function getTripDays(depart: string, ret: string): TripDay[] {
  if (!depart) return [];

  const start = parseDate(depart);
  if (Number.isNaN(start.getTime())) return [];

  const endCandidate = ret ? parseDate(ret) : start;
  const end = Number.isNaN(endCandidate.getTime()) || endCandidate < start ? start : endCandidate;

  const weekdayShort = WEEKDAY_SHORT[i18n.language] ?? WEEKDAY_SHORT.pt;
  const locale = currentDateLocale();

  return eachDayOfInterval({ start, end }).map((date, i) => ({
    key: format(date, "yyyy-MM-dd"),
    date,
    dayNumber: i + 1,
    weekdayLabel: weekdayShort[date.getDay()],
    dayLabel: format(date, "d"),
    monthLabel: format(date, "MMMM", { locale }),
  }));
}

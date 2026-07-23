import { ExpenseEntry } from "../types";

// Frankfurter: taxas de câmbio (BCE), gratuito e sem API key.
// https://frankfurter.dev/
const API_URL = "https://api.frankfurter.dev/v1/latest";
const CURRENCIES_URL = "https://api.frankfurter.dev/v1/currencies";

// Fallback offline (ex: sem internet no momento de abrir o seletor) — usado
// só até a lista completa da API carregar, ou se ela falhar.
export const CURRENCIES = [
  "BRL",
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "ARS",
  "CLP",
  "CAD",
  "AUD",
  "MXN",
  "CHF",
] as const;

export interface CurrencyInfo {
  code: string;
  name: string;
}

let currenciesCache: CurrencyInfo[] | null = null;

// Lista completa de moedas suportadas (a mesma coberta pelas taxas de
// câmbio do Frankfurter), pra popular o seletor de moeda em vez de uma
// lista fixa curta. Cacheada em memória — muda raramente.
export async function getCurrencies(): Promise<CurrencyInfo[]> {
  if (currenciesCache) return currenciesCache;
  try {
    const res = await fetch(CURRENCIES_URL);
    if (!res.ok) throw new Error("bad response");
    const data = await res.json();
    const list = Object.entries(data)
      .map(([code, name]) => ({ code, name: String(name) }))
      .sort((a, b) => a.code.localeCompare(b.code));
    currenciesCache = list;
    return list;
  } catch {
    return CURRENCIES.map((code) => ({ code, name: code }));
  }
}

export async function getExchangeRate(
  from: string,
  to: string,
): Promise<number | null> {
  if (from === to) return 1;
  try {
    const params = new URLSearchParams({ base: from, symbols: to });
    const res = await fetch(`${API_URL}?${params}`);
    if (!res.ok) return null;
    const data = await res.json();
    const rate = data?.rates?.[to];
    return typeof rate === "number" ? rate : null;
  } catch {
    return null;
  }
}

// Retorna o valor convertido, ou null se a taxa não pôde ser obtida (ex: sem
// internet) — quem chama decide o fallback (normalmente guardar sem conversão
// e mostrar só o valor original).
export async function convertAmount(
  amount: number,
  from: string,
  to: string,
): Promise<number | null> {
  const rate = await getExchangeRate(from, to);
  return rate === null ? null : amount * rate;
}

// Valor de uma despesa na moeda de referência: direto se já estiver nela, ou
// o convertido salvo no momento do registro. Despesas em outra moeda cuja
// conversão falhou ficam de fora (não dá pra somar moedas diferentes).
export function amountInBudgetCurrency(
  e: ExpenseEntry,
  budgetCurrency: string,
): number | null {
  if (e.currency === budgetCurrency) return e.amount;
  return e.convertedAmount ?? null;
}

export function formatMoney(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

// Só o símbolo/código da moeda (ex: "R$", "US$", "€"), sem o valor — usado
// como prefixo fixo ao lado de um input numérico puro.
export function getCurrencySymbol(currency: string): string {
  try {
    const parts = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).formatToParts(0);
    return parts.find((p) => p.type === "currency")?.value ?? currency;
  } catch {
    return currency;
  }
}

// Formata um valor decimal com separadores de milhar/casas, sem símbolo de
// moeda (o símbolo já é mostrado à parte via getCurrencySymbol).
export function formatAmount(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function sumExpenses(
  expenses: ExpenseEntry[],
  budgetCurrency: string,
): number {
  return expenses.reduce((sum, e) => {
    const v = amountInBudgetCurrency(e, budgetCurrency);
    return v !== null ? sum + v : sum;
  }, 0);
}

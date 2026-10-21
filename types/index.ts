export interface FlightEntry {
  flightNumber: string;
  dest: string;
  // Data do voo (YYYY-MM-DD), opcional. Quando presente, o itinerário usa
  // essa data pra saber a partir de quando o destino desse voo passa a
  // "valer" e pina esse destino automaticamente no roteiro.
  date?: string;
}

export interface HotelEntry {
  name: string;
  conf: string;
  dest: string;
  // Datas de check-in/check-out (YYYY-MM-DD), opcionais — hotéis criados
  // antes dessa feature não têm esses campos e caem no fallback de divisão
  // automática dos dias da viagem (ver hotelDates em app/(tabs)/index.tsx).
  checkIn?: string;
  checkOut?: string;
}

export interface Trip {
  id: string;
  name: string;
  destinations: string[];
  // Coordenadas (e país, quando disponível) por destino, preenchidas ao
  // pinar um destino pela busca do mapa. Destinos sem entrada aqui caem no
  // lookup aproximado por nome em utils/geo.ts, sem país conhecido.
  destinationCoords?: Record<string, { lat: number; lon: number; country?: string }>;
  // Dia do roteiro (chave "YYYY-MM-DD" de utils/dates.ts) ao qual cada destino
  // pertence. Sem entrada = destino sem dia atribuído (ex: trips criadas antes
  // dessa feature) — cai no bucket "sem data" no navegador de datas.
  destinationDates?: Record<string, string>;
  // Pontos de visitação (ex: um museu, um restaurante) adicionados pela busca
  // no drawer da aba itinerário. Distintos de `destinations`: aquele campo é
  // só os países/cidades cadastrados na criação da viagem (trip-form) e
  // alimenta tema/visto/checklist — este aqui é só o roteiro do dia a dia.
  itineraryPoints?: string[];
  itineraryPointCoords?: Record<string, { lat: number; lon: number; country?: string }>;
  itineraryPointDates?: Record<string, string>;
  coverImage?: string;
  // Foto do primeiro destino buscada no Unsplash pela home quando não há capa
  // escolhida; autoCoverFor guarda pra qual destino ela foi buscada.
  autoCover?: string;
  autoCoverFor?: string;
  // Orçamento da viagem (tela app/budget.tsx). budgetCurrency é a moeda de
  // referência em que budgetTotal e o total gasto são exibidos — despesas
  // registradas em outra moeda guardam o valor original e o convertido.
  budgetTotal?: number;
  budgetCurrency?: string;
  expenses?: ExpenseEntry[];
  depart: string; // YYYY-MM-DD
  ret: string;    // YYYY-MM-DD
  flightNumber?: string;
  hotelName?: string;
  flightConf?: string;
  hotelConf?: string;
  segments?: RouteSegment[];
  flights?: FlightEntry[];
  hotels?: HotelEntry[];
  origin?: string;
}

export type ExpenseCategory =
  | "transporte"
  | "hospedagem"
  | "alimentacao"
  | "passeios"
  | "compras"
  | "outros";

export interface ExpenseEntry {
  id: string;
  amount: number;
  currency: string;
  // Valor convertido pra budgetCurrency da viagem, calculado no momento do
  // registro (taxa do dia). Ausente quando currency já é a de referência.
  convertedAmount?: number;
  category: ExpenseCategory;
  date?: string; // YYYY-MM-DD, dia da viagem (opcional)
  note?: string;
}

export interface RouteSegment {
  from: string; // IATA code
  fromCity: string;
  to: string;
  toCity: string;
}

export interface CheckItem {
  id: string;
  tripId: string;
  text: string;
  cat: "doc" | "fly" | "stay" | "look" | "misc" | "visa";
  done: boolean;
}

export interface ItinDay {
  dest: string;
  dateLabel: string;
  activities: string[];
}

export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  tag: "turismo" | "clima" | "eventos" | "gastronomia" | "dicas";
}

export interface LookItem {
  label: string;
  desc: string;
  mood:
    | "kawaii"
    | "urbano"
    | "minimal"
    | "bohemio"
    | "casual"
    | "esportivo"
    | "elegante";
  tip?: string;
}

export interface LookPin {
  id: string;
  tripId: string;
  imageUrl: string;
  title?: string;
  // País/pasta ao qual esse look pertence (ver app/(tabs)/looks.tsx). Sem
  // entrada cai na pasta "Outros".
  country?: string;
  // Dia do roteiro (chave "YYYY-MM-DD" de utils/dates.ts) ao qual esse look
  // foi salvo, opcional.
  date?: string;
}

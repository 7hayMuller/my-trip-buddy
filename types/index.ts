export interface FlightEntry {
  flightNumber: string;
  dest: string;
}

export interface HotelEntry {
  name: string;
  conf: string;
  dest: string;
}

export interface Trip {
  id: string;
  name: string;
  destinations: string[];
  coverImage?: string;
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
}

export interface PlacePin {
  id: string;
  tripId: string;
  name: string;
  imageUrl: string;
  thumbUrl: string;
}

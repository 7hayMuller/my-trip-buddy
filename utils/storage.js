import AsyncStorage from '@react-native-async-storage/async-storage';

const TRIPS_KEY = '@wanderlust_trips';
const CHECKS_KEY = '@wanderlust_checks';

const CASH_KEYWORDS = [
  'japão', 'japan', 'tóquio', 'tokyo', 'osaka', 'kyoto',
  'turquia', 'turkey', 'istambul', 'istanbul',
  'myanmar', 'birmânia', 'camboja', 'cambodia', 'laos',
  'marrocos', 'morocco', 'marrakech', 'egito', 'egypt',
];

const HEALTH_KEYWORDS = [
  'tailândia', 'thailand', 'bangkok', 'phuket',
  'bali', 'indonésia', 'indonesia',
  'vietnã', 'vietnam', 'hanói', 'ho chi minh',
  'índia', 'india', 'mumbai', 'delhi',
  'africa', 'áfrica', 'quênia', 'kenya', 'tanzânia', 'tanzania',
  'peru', 'lima', 'amazônia', 'amazon',
  'camboja', 'cambodia', 'nepal', 'sri lanka', 'laos',
];

export function getDefaultCheckItems(trip = {}) {
  const { destinations = [], hotels = [], flights = [] } = trip;
  const destText = destinations.join(' ').toLowerCase();
  const hasHotel = Array.isArray(hotels) && hotels.some((h) => h.name?.trim());

  const items = [
    { text: 'Passaporte válido',            cat: 'doc'  },
    { text: 'Seguro viagem contratado',     cat: 'doc'  },
    { text: 'Cópia digital dos documentos', cat: 'doc'  },
    hasHotel
      ? { text: 'Check-in hotel confirmado', cat: 'stay' }
      : { text: 'Reservar hotel',            cat: 'stay' },
    { text: 'Check-in online feito',        cat: 'fly'  },
    { text: 'Looks da mala montados',       cat: 'look' },
    { text: 'Câmera e carregadores',        cat: 'misc' },
    { text: 'Adaptador de tomada',          cat: 'misc' },
    { text: 'Chip / eSIM internacional',   cat: 'misc' },
    { text: 'Avisar banco sobre viagem',    cat: 'misc' },
  ];

  if (CASH_KEYWORDS.some((kw) => destText.includes(kw))) {
    items.push({ text: 'Câmbio / moeda local em espécie', cat: 'misc' });
  }

  if (HEALTH_KEYWORDS.some((kw) => destText.includes(kw))) {
    items.push({ text: 'Verificar vacinas necessárias', cat: 'doc' });
  }

  return items;
}

export function createDefaultChecks(tripId, trip = {}) {
  return getDefaultCheckItems(trip).map((item, i) => ({
    ...item,
    id: `${tripId}_${i}`,
    tripId,
    done: false,
  }));
}

export async function loadTrips() {
  try {
    const raw = await AsyncStorage.getItem(TRIPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveTrips(trips) {
  try { await AsyncStorage.setItem(TRIPS_KEY, JSON.stringify(trips)); } catch {}
}

export async function loadChecks() {
  try {
    const raw = await AsyncStorage.getItem(CHECKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveChecks(checks) {
  try { await AsyncStorage.setItem(CHECKS_KEY, JSON.stringify(checks)); } catch {}
}

const LOOKS_KEY  = '@wanderlust_looks';
const PLACES_KEY = '@wanderlust_places';

export async function loadLooks() {
  try {
    const raw = await AsyncStorage.getItem(LOOKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function saveLooks(looks) {
  try { await AsyncStorage.setItem(LOOKS_KEY, JSON.stringify(looks)); } catch {}
}

export async function loadPlaces() {
  try {
    const raw = await AsyncStorage.getItem(PLACES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function savePlaces(places) {
  try { await AsyncStorage.setItem(PLACES_KEY, JSON.stringify(places)); } catch {}
}

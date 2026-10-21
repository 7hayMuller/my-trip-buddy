export interface VisaWarning {
  message: string;
  status: 'required' | 'on_arrival';
}

const VISA_RULES: Array<{
  keywords: string[];
  message: string;
  status: 'required' | 'on_arrival';
  // Isenção temporária: viagens que começam até essa data não precisam de visto.
  exemptUntil?: string;
}> = [
  {
    keywords: ['eua', 'estados unidos', 'usa', 'new york', 'nova york', 'miami',
               'orlando', 'los angeles', 'chicago', 'san francisco', 'washington', 'boston'],
    message: 'EUA: visto B1/B2 obrigatório para brasileiros.',
    status: 'required',
  },
  {
    keywords: ['canada', 'canadá', 'toronto', 'vancouver', 'montreal', 'calgary'],
    message: 'Canadá: visto obrigatório (ou eTA, para quem teve visto canadense nos últimos 10 anos ou tem visto americano válido).',
    status: 'required',
  },
  {
    keywords: ['austrália', 'australia', 'sydney', 'melbourne', 'brisbane', 'perth'],
    message: 'Austrália: visto de visitante obrigatório (pedido online).',
    status: 'required',
  },
  {
    keywords: ['reino unido', 'uk', 'inglaterra', 'london', 'londres', 'scotland', 'escócia'],
    message: 'Reino Unido: sem visto, mas a autorização eletrônica ETA é obrigatória.',
    status: 'on_arrival',
  },
  {
    keywords: ['china', 'beijing', 'pequim', 'shanghai', 'xangai', 'guangzhou', 'chengdu'],
    message: 'China: visto obrigatório para brasileiros.',
    status: 'required',
    // Isenção de até 30 dias para brasileiros, prorrogada até 31/12/2026.
    exemptUntil: '2026-12-31',
  },
  {
    keywords: ['india', 'índia', 'mumbai', 'delhi', 'bangalore', 'kolkata'],
    message: 'Índia: e-Visa ou visto obrigatório.',
    status: 'required',
  },
  {
    keywords: ['nova zelândia', 'new zealand', 'auckland', 'wellington'],
    message: 'Nova Zelândia: NZeTA obrigatório para brasileiros.',
    status: 'required',
  },
  {
    keywords: ['egito', 'egypt', 'cairo', 'luxor', 'aswan'],
    message: 'Egito: visto na chegada disponível.',
    status: 'on_arrival',
  },
  {
    keywords: ['sri lanka', 'colombo'],
    message: 'Sri Lanka: ETA eletrônico necessário.',
    status: 'on_arrival',
  },
  {
    keywords: ['vietnã', 'vietnam', 'vietnan', 'hanói', 'hanoi', 'ho chi minh', 'da nang'],
    message: 'Vietnã: e-Visa necessário para brasileiros.',
    status: 'on_arrival',
  },
  {
    keywords: ['myanmar', 'birmânia', 'yangon', 'rangum'],
    message: 'Myanmar: e-Visa obrigatório para brasileiros.',
    status: 'required',
  },
  {
    keywords: ['nepal', 'katmandu', 'kathmandu'],
    message: 'Nepal: visto na chegada disponível.',
    status: 'on_arrival',
  },
];

// Rússia, Tailândia e Turquia não estão na lista: brasileiros entram sem visto
// para turismo.
export function getVisaWarnings(
  destinations: string[],
  origin = 'Brasil',
  depart?: string,
): VisaWarning[] {
  const originLower = origin.toLowerCase().trim();
  const isBrazilian =
    !originLower ||
    originLower.includes('brasil') ||
    originLower.includes('brazil');

  if (!isBrazilian) return [];

  const destText = destinations.join(' ');
  const travelDate = depart || new Date().toISOString().slice(0, 10);
  const warnings: VisaWarning[] = [];

  for (const rule of VISA_RULES) {
    if (rule.exemptUntil && travelDate <= rule.exemptUntil) continue;
    if (rule.keywords.some((kw) => matchesWord(destText, kw))) {
      warnings.push({ message: rule.message, status: rule.status });
    }
  }

  return warnings;
}

// Palavra inteira — com includes, 'uk' batia em "Ukraine" e 'usa' em "Busan".
function matchesWord(text: string, kw: string): boolean {
  return new RegExp(`(^|[^\\p{L}])${kw}($|[^\\p{L}])`, 'iu').test(text);
}

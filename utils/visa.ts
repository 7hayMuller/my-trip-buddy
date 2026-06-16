export interface VisaWarning {
  message: string;
  status: 'required' | 'on_arrival';
}

const VISA_RULES: Array<{
  keywords: string[];
  message: string;
  status: 'required' | 'on_arrival';
}> = [
  {
    keywords: ['eua', 'estados unidos', 'usa', 'new york', 'nova york', 'miami',
               'orlando', 'los angeles', 'chicago', 'san francisco', 'washington', 'boston'],
    message: 'EUA: visto B1/B2 obrigatório para brasileiros.',
    status: 'required',
  },
  {
    keywords: ['canada', 'canadá', 'toronto', 'vancouver', 'montreal', 'calgary'],
    message: 'Canadá: visto obrigatório para brasileiros.',
    status: 'required',
  },
  {
    keywords: ['austrália', 'australia', 'sydney', 'melbourne', 'brisbane', 'perth'],
    message: 'Austrália: ETA ou visto obrigatório.',
    status: 'required',
  },
  {
    keywords: ['reino unido', 'uk', 'inglaterra', 'london', 'londres', 'scotland', 'escócia'],
    message: 'Reino Unido: visto obrigatório para brasileiros.',
    status: 'required',
  },
  {
    keywords: ['china', 'beijing', 'pequim', 'shanghai', 'xangai', 'guangzhou', 'chengdu'],
    message: 'China: visto obrigatório para brasileiros.',
    status: 'required',
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
    keywords: ['rússia', 'russia', 'moscou', 'moscow', 'são petersburgo', 'st petersburg'],
    message: 'Rússia: visto obrigatório para brasileiros.',
    status: 'required',
  },
  {
    keywords: ['tailândia', 'thailand', 'bangkok', 'phuket', 'chiang mai'],
    message: 'Tailândia: visto na chegada disponível (30 dias).',
    status: 'on_arrival',
  },
  {
    keywords: ['turquia', 'turkey', 'istambul', 'istanbul', 'capadócia', 'cappadocia'],
    message: 'Turquia: e-Visa necessário para brasileiros.',
    status: 'on_arrival',
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

export function getVisaWarnings(destinations: string[], origin = 'Brasil'): VisaWarning[] {
  const originLower = origin.toLowerCase().trim();
  const isBrazilian =
    !originLower ||
    originLower.includes('brasil') ||
    originLower.includes('brazil');

  if (!isBrazilian) return [];

  const destText = destinations.join(' ').toLowerCase();
  const warnings: VisaWarning[] = [];

  for (const rule of VISA_RULES) {
    if (rule.keywords.some((kw) => destText.includes(kw))) {
      warnings.push({ message: rule.message, status: rule.status });
    }
  }

  return warnings;
}

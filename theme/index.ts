export const colors = {
  // 2025 trend palette - modern & sophisticated
  navy:        '#2D3E52',
  navy2:       '#3A4B63',
  navyDeep:    '#1F2D3D',

  // Modern accent colors
  teal:        '#6BA9A0',
  teal2:       '#5B9B91',
  tealLight:   '#E8F4F2',

  white:       '#FFFFFF',
  cream:       '#F9F7F4',
  offwhite:    '#F5F3F0',
  muted:       '#9BA5B0',
  border:      '#E5E0DB',
  ink:         '#2D3E52',

  // Trend colors: blush, sage, warm tones
  accent:      '#D8A8C4',
  accentLight: '#F7EAF3',

  gold:        '#C9A86F',
  goldLight:   '#F8F4ED',

  sage:        '#9CAF88',
  sageLight:   '#EEF2EA',

  purple:      '#7B68B6',
  purpleLight: '#F0E9FE',

  green:       '#7EA989',
  greenLight:  '#E8F2ED',

  blush:       '#E8A8C8',
  blushLight:  '#F8E8F2',

  // Hero gradients - updated for modern look
  heroOverlay: 'rgba(45,62,82,0.5)',
  heroGrad1:   'rgba(45,62,82,0.0)',
  heroGrad2:   'rgba(45,62,82,0.65)',
  heroGrad3:   'rgba(31,45,61,0.95)',

  // Glassmorphism effects
  routeLine:   'rgba(255,255,255,0.25)',
  routeDot:    '#6BA9A0',
  cdBg:        'rgba(255,255,255,0.08)',
  cdBorder:    'rgba(255,255,255,0.12)',
  cdNum:       '#FFFFFF',
  cdLabel:     'rgba(255,255,255,0.55)',
  cdSep:       'rgba(255,255,255,0.25)',

  warning:      '#D97706',
  warningLight: '#FEF5E7',
  warningBorder:'#F9E5B8',

  // Gradient colors for visual interest
  gradStart:   '#7B68B6',
  gradMid:     '#D8A8C4',
  gradEnd:     '#F8A8B8',
} as const;

export const fonts = {
  display: 'PlayfairDisplay-Italic',
  displayBold: 'PlayfairDisplay-BoldItalic',
  body: 'Nunito-Regular',
  semibold: 'Nunito-SemiBold',
  bold: 'Nunito-Bold',
  extrabold: 'Nunito-ExtraBold',
  black: 'Nunito-Black',
} as const;

export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
} as const;

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  28,
  full: 999,
} as const;

export const shadow = {
  sm: {
    shadowColor: '#1B2B4B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1B2B4B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  teal: {
    shadowColor: '#3BBFB2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// Unsplash destination image map (free, no API key needed)
export const DESTINATION_IMAGES: Record<string, string> = {
  'japão':      'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=800&q=80',
  'tóquio':     'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
  'kyoto':      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
  'paris':      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
  'nova york':  'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
  'new york':   'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
  'ny':         'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
  'roma':       'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
  'barcelona':  'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&q=80',
  'lisboa':     'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=800&q=80',
  'dubai':      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',
  'bangkok':    'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80',
  'bali':       'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80',
  'default':    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80',
};

export function getTripImage(trip: { name: string; destinations: string[] }): string {
  const lower = [...trip.destinations, trip.name].join(' ').toLowerCase();
  for (const [key, url] of Object.entries(DESTINATION_IMAGES)) {
    if (lower.includes(key)) return url;
  }
  return DESTINATION_IMAGES['default'];
}

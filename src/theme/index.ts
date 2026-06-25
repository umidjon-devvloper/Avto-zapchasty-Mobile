import { s, ms, vs, font, isSmall, isLarge, isTablet } from './responsive';

export { s, ms, vs, wp, font, isSmall, isLarge, isTablet, isIOS, isAndroid, SCREEN_W, SCREEN_H } from './responsive';

export const lightColors = {
  bg: '#f3f5fa',
  surface: '#e8edf6',
  card: '#ffffff',
  border: '#e6eaf2',
  hairline: '#eef1f7',

  text: '#0f1838',
  muted: '#6a7186',
  faint: '#9aa1b4',

  brand: '#172a6b',
  brandDark: '#0e1845',
  brandSoft: '#eaeef8',
  brandSoftAlt: '#dce5f8',
  onBrand: '#ffffff',

  primary: '#f47a1f',
  primaryDark: '#d75f0b',
  primarySoft: '#fff1e2',
  onPrimary: '#ffffff',

  ink: '#172a6b',
  inkSoft: '#2c3658',

  success: '#15a34a',
  successSoft: '#e6f6ec',
  danger: '#e23d3d',
  dangerSoft: '#fdeaea',
  info: '#2563eb',
  infoSoft: '#e7eefe',
  chip: '#eef1f7',
  star: '#f5a623',
  overlay: 'rgba(9,16,40,0.5)',
} as const;

export const darkColors = {
  bg: '#0f1117',
  surface: '#161b27',
  card: '#1c2436',
  border: '#252d42',
  hairline: '#1a2130',

  text: '#e2e8f8',
  muted: '#8892a8',
  faint: '#4a5168',

  brand: '#172a6b',
  brandDark: '#0e1845',
  brandSoft: '#1a2140',
  brandSoftAlt: '#0d1a35',
  onBrand: '#ffffff',

  primary: '#f47a1f',
  primaryDark: '#d75f0b',
  primarySoft: '#2a1804',
  onPrimary: '#ffffff',

  ink: '#d0d8f0',
  inkSoft: '#a8b4cc',

  success: '#15a34a',
  successSoft: '#0a2018',
  danger: '#e23d3d',
  dangerSoft: '#2a0808',
  info: '#2563eb',
  infoSoft: '#0a1830',
  chip: '#1a2030',
  star: '#f5a623',
  overlay: 'rgba(0,0,0,0.7)',
} as const;

export type Colors = typeof lightColors;

export const theme = {
  colors: lightColors,
  gradients: {
    brand: ['#22357f', '#172a6b', '#0e1845'] as const,
    brandSheen: ['#2b3f8c', '#16265f'] as const,
    primary: ['#ff8f43', '#f47a1f', '#e5640d'] as const,
  },
  space: { xs: s(4), sm: s(8), md: s(12), lg: s(16), xl: s(24), xxl: s(32) },
  radius: { sm: s(8), md: s(12), lg: s(16), xl: s(22), pill: 999 },
  font,
  shadow: {
    sm: {
      shadowColor: '#0b1230', shadowOpacity: 0.07, shadowRadius: 9,
      shadowOffset: { width: 0, height: 2 }, elevation: 2,
    },
    md: {
      shadowColor: '#0b1230', shadowOpacity: 0.1, shadowRadius: 18,
      shadowOffset: { width: 0, height: 7 }, elevation: 5,
    },
    lg: {
      shadowColor: '#0b1230', shadowOpacity: 0.15, shadowRadius: 28,
      shadowOffset: { width: 0, height: 14 }, elevation: 10,
    },
    brand: {
      shadowColor: '#f47a1f', shadowOpacity: 0.3, shadowRadius: 16,
      shadowOffset: { width: 0, height: 8 }, elevation: 6,
    },
    navy: {
      shadowColor: '#172a6b', shadowOpacity: 0.28, shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 }, elevation: 7,
    },
  },
} as const;

export const CONDITION_LABELS: Record<string, string> = {
  new: 'Yangi', used: "B/u", contract: 'Kontrakt', original: 'Original', duplicate: 'Dublikat',
};
export const STATUS_LABELS: Record<string, string> = {
  draft: 'Qoralama', pending: 'Tekshiruvda', active: 'Faol', sold: 'Sotilgan', rejected: 'Rad etilgan', archived: 'Arxiv',
};
export const FUEL_LABELS: Record<string, string> = {
  petrol: 'Benzin', diesel: 'Dizel', hybrid: 'Gibrid', electric: 'Elektr', gas: 'Gaz',
};

export const REPORT_REASONS: { value: string; label: string }[] = [
  { value: 'spam', label: 'Spam / reklama' },
  { value: 'fraud', label: 'Firibgarlik' },
  { value: 'prohibited', label: 'Taqiqlangan mahsulot' },
  { value: 'wrong_category', label: "Noto'g'ri kategoriya" },
  { value: 'duplicate', label: "Takroriy e'lon" },
  { value: 'offensive', label: 'Haqoratli kontent' },
  { value: 'other', label: 'Boshqa' },
];

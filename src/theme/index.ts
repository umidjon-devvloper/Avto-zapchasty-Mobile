// Zapchasty — premium marketplace temasi
// Brend identifikatori: chuqur navy ("Zapchast") + iliq to'q-sariq urg'u ("y").
import { s, ms, vs, font, isSmall, isLarge, isTablet } from './responsive';

// Responsive yordamchilarni qayta eksport qilamiz — sahifalar bitta joydan import qiladi.
export { s, ms, vs, wp, font, isSmall, isLarge, isTablet, isIOS, isAndroid, SCREEN_W, SCREEN_H } from './responsive';

export const theme = {
  colors: {
    // Yuzalar
    bg: '#f3f5fa',
    surface: '#e8edf6',
    card: '#ffffff',
    border: '#e6eaf2',
    hairline: '#eef1f7',

    // Matn
    text: '#0f1838',
    muted: '#6a7186',
    faint: '#9aa1b4',

    // Brend — navy
    brand: '#172a6b',
    brandDark: '#0e1845',
    brandSoft: '#eaeef8',
    onBrand: '#ffffff',

    // Urg'u / CTA — to'q-sariq (logodagi "y")
    primary: '#f47a1f',
    primaryDark: '#d75f0b',
    primarySoft: '#fff1e2',
    onPrimary: '#ffffff',

    // Navy siyoh
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
  },
  // Premium gradientlar
  gradients: {
    brand: ['#22357f', '#172a6b', '#0e1845'] as const,
    brandSheen: ['#2b3f8c', '#16265f'] as const,
    primary: ['#ff8f43', '#f47a1f', '#e5640d'] as const,
  },
  // Spacing va radius endi ekran kengligiga qarab miqyoslanadi.
  space: { xs: s(4), sm: s(8), md: s(12), lg: s(16), xl: s(24), xxl: s(32) },
  radius: { sm: s(8), md: s(12), lg: s(16), xl: s(22), pill: 999 },
  // Tipografiya shkalasi — to'g'ridan-to'g'ri theme.font orqali ham ishlatish mumkin.
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
    // Brend tugmasi uchun iliq soya
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

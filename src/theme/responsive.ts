// Responsive miqyoslash tizimi — barcha telefonlarga (iOS + Android) mos.
// Maqsad: dizayn iPhone SE (320) dan Pro Max / katta Android (430+) gacha
// bir xil mutanosib ko'rinishi. Qattiq piksellar o'rniga shu yordamchilardan foydalaning.
import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: RAW_W, height: RAW_H } = Dimensions.get('window');

// Telefonni eni/bo'yi (landscape holatda ham qisqa tomon = en) bo'yicha olamiz.
export const SCREEN_W = Math.min(RAW_W, RAW_H);
export const SCREEN_H = Math.max(RAW_W, RAW_H);

// Etalon (dizayn) o'lchovi — standart 375pt kenglikdagi telefon.
const BASE_W = 375;

// Tabletlar / juda katta ekranlarda kontent cho'zilib ketmasligi uchun
// effektiv kenglikni cheklaymiz.
const EFFECTIVE_W = Math.min(SCREEN_W, 440);

// Qurilma toifalari — shartli (conditional) layout uchun.
export const isSmall = SCREEN_W < 360;   // iPhone SE, kichik Android
export const isLarge = SCREEN_W >= 414;  // Plus / Pro Max / katta Android
export const isTablet = SCREEN_W >= 600;

const ratio = EFFECTIVE_W / BASE_W;

/** Chiziqli miqyos — spacing, padding, radius, ikonka o'lchovlari uchun. */
export function s(size: number): number {
  return Math.round(PixelRatio.roundToNearestPixel(size * ratio));
}

/**
 * Moderate scale — shrift va vizual o'lchovlar uchun.
 * factor (0..1) miqyoslash kuchini kamaytiradi: kichik ekranlarda matn
 * o'qilarli qoladi, kattalarda haddan tashqari kattalashmaydi.
 */
export function ms(size: number, factor = 0.5): number {
  return Math.round(PixelRatio.roundToNearestPixel(size + (s(size) - size) * factor));
}

/** Vertikal miqyos — hero balandligi kabi bo'y o'lchovlari uchun. */
export function vs(size: number): number {
  const h = Math.max(SCREEN_H, 640);
  return Math.round(PixelRatio.roundToNearestPixel(size * (h / 812)));
}

/** Ekran kengligining foizi (0..100). */
export function wp(percent: number): number {
  return Math.round((SCREEN_W * percent) / 100);
}

// Tayyor tipografiya shkalasi — barcha sahifalarda izchil matn o'lchovlari.
export const font = {
  xs: ms(11),
  sm: ms(13),
  md: ms(15),
  lg: ms(17),
  xl: ms(20),
  xxl: ms(24),
  display: ms(28),
} as const;

// Platformaga bog'liq mayda farqlar.
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

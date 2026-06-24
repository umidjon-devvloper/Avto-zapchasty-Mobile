import { API_URL } from '../config';

const ORIGIN = API_URL.replace(/\/api\/?$/, '');

// Local (/uploads/...) URL larni to'liq manzilga aylantiradi; R2 (http) URL o'zgarmaydi
export const resolveImage = (u?: string) =>
  !u ? '' : u.startsWith('http') ? u : ORIGIN + u;

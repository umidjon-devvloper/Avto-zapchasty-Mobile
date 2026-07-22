import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_URL } from '../config';
import { useAuth } from './auth';
import type {
  Brand, CarModel, ChatMessage, City, ConversationInfo, ConversationItem, Listing,
  Paginated, PartCategory, PartType, SellerPublicProfile, Suggestion, User,
} from './types';

export const http = axios.create({ baseURL: API_URL });

http.interceptors.request.use((config) => {
  const t = useAuth.getState().accessToken;
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;
async function doRefresh(): Promise<string | null> {
  const rt = useAuth.getState().refreshToken;
  if (!rt) return null;
  try {
    const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: rt });
    useAuth.getState().setTokens(data.accessToken, data.refreshToken);
    return data.accessToken as string;
  } catch {
    useAuth.getState().logout();
    return null;
  }
}

http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 403 = admin tomonidan bloklangan
    if (error.response?.status === 403) {
      const msg = (error.response?.data as { error?: string; message?: string })?.error
        ?? (error.response?.data as { message?: string })?.message ?? '';
      if (/block|ban|restrict/i.test(msg) || error.response?.status === 403) {
        useAuth.getState().setBlocked(true);
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      if (!refreshing) refreshing = doRefresh().finally(() => { refreshing = null; });
      const t = await refreshing;
      if (t) { original.headers.Authorization = `Bearer ${t}`; return http(original); }
    }
    return Promise.reject(error);
  }
);

export function errMessage(e: unknown): string {
  if (axios.isAxiosError(e)) return (e.response?.data as { error?: string })?.error || e.message;
  return e instanceof Error ? e.message : 'Xatolik';
}

export interface UploadFile { uri: string; name: string; type: string }

export const api = {
  // Auth
  sendOtp: (phone: string) =>
    http.post<{ ok: boolean; devCode?: string }>('/auth/send-otp', { phone }).then((r) => r.data),
  verifyOtp: (phone: string, code: string) =>
    http.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/verify-otp', { phone, code }).then((r) => r.data),
  register: (phone: string, password: string, name?: string) =>
    http.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/register', { phone, password, name }).then((r) => r.data),
  login: (phone: string, password: string) =>
    http.post<{ user: User; accessToken: string; refreshToken: string }>('/auth/login', { phone, password }).then((r) => r.data),
  me: () => http.get<{ user: User }>('/auth/me').then((r) => r.data.user),
  updateProfile: (body: { name?: string; shopName?: string; city?: string; avatar?: string }) =>
    http.patch<{ user: User }>('/auth/me', body).then((r) => r.data.user),
  deleteAccount: () => http.delete('/auth/me').then((r) => r.data),

  // Katalog
  categories: () => http.get<{ categories: PartCategory[] }>('/catalog/categories').then((r) => r.data.categories),
  subcategories: (id: string) =>
    http.get<{ subcategories: PartCategory[] }>(`/catalog/categories/${id}/subcategories`).then((r) => r.data.subcategories),
  brands: (popular?: boolean) =>
    http.get<{ brands: Brand[] }>('/catalog/brands', { params: popular ? { popular: 1 } : {} }).then((r) => r.data.brands),
  brandModels: (brandId: string) =>
    http.get<{ models: CarModel[] }>(`/catalog/brands/${brandId}/models`).then((r) => r.data.models),
  categoryPartTypes: (categoryId: string) =>
    http.get<{ partTypes: PartType[] }>(`/catalog/categories/${categoryId}/part-types`).then((r) => r.data.partTypes),
  cities: () => http.get<{ cities: City[] }>('/catalog/cities').then((r) => r.data.cities),

  // Qidiruv
  search: (params: Record<string, unknown>) =>
    http.get<Paginated<Listing>>('/search', { params }).then((r) => r.data),
  nearby: (lat: number, lng: number, limit = 10) =>
    http
      .get<{ items: Listing[]; tier: 'near' | 'city' | 'none' }>('/search/nearby', { params: { lat, lng, limit } })
      .then((r) => r.data),
  suggest: (q: string) =>
    http.get<{ items: Suggestion[] }>('/search/suggest', { params: { q } }).then((r) => r.data.items),

  // E'lonlar
  getListing: (id: string) =>
    http.get<{ listing: Listing; isFavorite: boolean }>(`/listings/${id}`).then((r) => r.data),
  createListing: (body: unknown) =>
    http.post<{ listing: Listing }>('/listings', body).then((r) => r.data.listing),
  updateListing: (id: string, body: unknown) =>
    http.patch<{ listing: Listing }>(`/listings/${id}`, body).then((r) => r.data.listing),
  myListings: (params: Record<string, unknown>) =>
    http.get<Paginated<Listing>>('/listings/my', { params }).then((r) => r.data),
  toggleFavorite: (id: string) =>
    http.post<{ isFavorite: boolean }>(`/listings/${id}/favorite`).then((r) => r.data),
  favorites: () => http.get<{ items: Listing[] }>('/listings/favorites/list').then((r) => r.data.items),
  setStatus: (id: string, status: string) =>
    http.patch<{ listing: Listing }>(`/listings/${id}/status`, { status }).then((r) => r.data.listing),
  removeListing: (id: string) => http.delete(`/listings/${id}`).then((r) => r.data),

  // Sotuvchi ochiq profili
  sellerProfile: (id: string) =>
    http.get<{ profile: SellerPublicProfile }>(`/users/${id}/profile`).then((r) => r.data.profile),

  // Push token
  registerPushToken: (token: string) => http.post('/users/push-token', { token }).then((r) => r.data),
  removePushToken: (token: string) => http.delete('/users/push-token', { data: { token } }).then((r) => r.data),

  // Chat
  conversations: () => http.get<{ items: ConversationItem[] }>('/chat/conversations').then((r) => r.data.items),
  getConversation: (id: string) =>
    http.get<{ conversation: ConversationInfo }>(`/chat/conversations/${id}`).then((r) => r.data.conversation),
  startConversation: (listingId: string) =>
    http.post<{ conversationId: string }>('/chat/conversations', { listingId }).then((r) => r.data.conversationId),
  getChatMessages: (id: string, before?: string) =>
    http.get<{ items: ChatMessage[] }>(`/chat/conversations/${id}/messages`, { params: before ? { before } : {} }).then((r) => r.data.items),
  sendChatMessage: (id: string, text: string) =>
    http.post<{ message: ChatMessage }>(`/chat/conversations/${id}/messages`, { text }).then((r) => r.data.message),
  markChatRead: (id: string) => http.post(`/chat/conversations/${id}/read`).then((r) => r.data),

  // Shikoyat
  report: (listingId: string, reason: string, comment: string) =>
    http.post('/reports', { listingId, reason, comment }).then((r) => r.data),

  // Rasm yuklash (multipart)
  uploadImages: (files: UploadFile[]) => {
    const form = new FormData();
    files.forEach((f) => form.append('images', { uri: f.uri, name: f.name, type: f.type } as unknown as Blob));
    return http
      .post<{ urls: string[] }>('/upload/images', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data.urls);
  },
};

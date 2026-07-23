import { io, type Socket } from 'socket.io-client';
import { API_URL } from '../config';
import { useAuth } from './auth';

const ORIGIN = API_URL.replace(/\/api\/?$/, '');
let socket: Socket | null = null;

// Joriy token bilan socket olish (kerak bo'lsa ulaydi)
export function getSocket(): Socket | null {
  const token = useAuth.getState().accessToken;
  if (!token) return null;
  if (!socket) {
    socket = io(ORIGIN, { auth: { token }, transports: ['websocket'], autoConnect: true });
  } else {
    socket.auth = { token };
    if (!socket.connected) socket.connect();
  }
  return socket;
}

// Token yangilanganda chaqiriladi: socket handshake tokeni faqat ulanishda tekshiriladi,
// shuning uchun yangi token bilan qayta ulanish kerak (aks holda realtime jimgina o'ladi).
export function refreshSocketAuth() {
  const token = useAuth.getState().accessToken;
  if (!socket || !token) return;
  socket.auth = { token };
  if (socket.connected) {
    socket.disconnect();
    socket.connect();
  } else {
    socket.connect();
  }
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

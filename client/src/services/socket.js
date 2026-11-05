import { io } from 'socket.io-client';

export function getSocketUrl() {
  if (typeof window === 'undefined') return 'http://localhost:5005';

  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  const savedUrl = localStorage.getItem('collab_socket_url');
  if (savedUrl) return savedUrl;

  const hostname = window.location.hostname;
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.')
  ) {
    return window.location.origin;
  }

  // Vercel serverless functions do not host persistent WebSockets
  return null;
}

let socket = null;

export function getSocket() {
  const url = getSocketUrl();
  if (!url) return null;

  if (!socket) {
    socket = io(url, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling']
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (s && !s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

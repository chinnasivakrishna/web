import { io } from 'socket.io-client';

let socket = null;

export const initSocket = () => {
  if (!socket) {
    let socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || '';
    
    if (socketUrl.endsWith('/api/v1')) {
      socketUrl = socketUrl.replace('/api/v1', '');
    } else if (socketUrl.endsWith('/api')) {
      socketUrl = socketUrl.replace('/api', '');
    }

    if (!socketUrl) {
      // Check window host or fallback to target backend url
      if (window.location.hostname === 'localhost') {
        socketUrl = 'https://web-blld.onrender.com';
      } else {
        socketUrl = window.location.origin;
      }
    }

    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected successfully:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection error (retrying):', err.message);
    });
  }
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

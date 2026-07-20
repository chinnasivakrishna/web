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
      socketUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;
    }

    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
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

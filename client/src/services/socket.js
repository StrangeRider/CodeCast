import { io } from 'socket.io-client';

// Initialise Socket connection back to host server
export const initSocket = () => {
  const backendUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || undefined;
  return io(backendUrl, {
    transports: ['websocket', 'polling'],
    forceNew: true,
    reconnectionAttempts: 5,
    timeout: 10000,
  });
};

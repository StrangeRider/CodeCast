import { io } from 'socket.io-client';

// Initialise Socket connection back to host server
export const initSocket = () => {
  return io({
    transports: ['websocket'],
    forceNew: true,
    reconnectionAttempts: 5,
    timeout: 10000,
  });
};

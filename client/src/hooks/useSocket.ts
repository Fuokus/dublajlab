import { useEffect, useCallback } from 'react';
import { useSocketContext } from '../contexts/SocketContext';

/**
 * Socket.IO event dinleme ve gönderme hook'u
 */
export function useSocket() {
  const { socket, connected } = useSocketContext();

  const emit = useCallback(
    (event: string, data?: unknown) => {
      if (socket) {
        socket.emit(event, data);
      }
    },
    [socket]
  );

  const on = useCallback(
    (event: string, handler: (...args: unknown[]) => void) => {
      if (socket) {
        socket.on(event, handler as (...args: unknown[]) => void);
      }
    },
    [socket]
  );

  const off = useCallback(
    (event: string, handler?: (...args: unknown[]) => void) => {
      if (socket) {
        socket.off(event, handler as (...args: unknown[]) => void);
      }
    },
    [socket]
  );

  return { socket, connected, emit, on, off };
}

/**
 * Belirli bir socket event'ini dinleyen hook
 */
export function useSocketEvent(event: string, handler: (...args: unknown[]) => void) {
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;

    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
    };
  }, [socket, event, handler]);
}

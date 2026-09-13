import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import type { Room, Player, RenderProgress } from '../types';

interface UseRoomReturn {
  room: Room | null;
  playerId: string | null;
  error: string | null;
  renderProgress: RenderProgress | null;
  renderOutput: string | null;
  createRoom: (nickname: string) => void;
  joinRoom: (roomCode: string, nickname: string) => void;
  selectScene: (sceneId: string) => void;
  toggleReady: (isReady: boolean) => void;
  startGame: () => void;
  leaveRoom: () => void;
  notifyRecordingComplete: (dialogueId: string) => void;
}

/**
 * Oda state yönetimi hook'u
 */
export function useRoom(): UseRoomReturn {
  const { socket, emit, on, off } = useSocket();
  const [room, setRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renderProgress, setRenderProgress] = useState<RenderProgress | null>(null);
  const [renderOutput, setRenderOutput] = useState<string | null>(null);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleError = (data: { message: string }) => {
      setError(data.message);
      setTimeout(() => setError(null), 5000);
    };

    const handleRoomCreated = (data: { room: Room; playerId: string }) => {
      setRoom(data.room);
      setPlayerId(data.playerId);
      setError(null);
    };

    const handleRoomJoined = (data: { room: Room; playerId: string }) => {
      setRoom(data.room);
      setPlayerId(data.playerId);
      setError(null);
    };

    const handleRoomUpdated = (data: { room: Room }) => {
      setRoom(data.room);
    };

    const handlePlayerJoined = (data: { room: Room }) => {
      setRoom(data.room);
    };

    const handlePlayerLeft = (data: { room: Room }) => {
      setRoom(data.room);
    };

    const handleSceneSelected = (data: { room: Room }) => {
      setRoom(data.room);
    };

    const handleGameStarted = (data: { room: Room }) => {
      setRoom(data.room);
    };

    const handleHostChanged = (data: { newHostId: string; newHostSocketId: string }) => {
      setRoom((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          hostSocketId: data.newHostSocketId,
          players: prev.players.map((p) => ({
            ...p,
            isHost: p.id === data.newHostId,
          })),
        };
      });
    };

    const handleRenderProgressUpdate = (data: RenderProgress) => {
      setRenderProgress(data);
      if (data.status === 'completed') {
        setRoom((prev) => prev ? { ...prev, status: 'completed' } : null);
      }
    };

    const handleRenderComplete = (data: { outputPath: string }) => {
      setRenderOutput(data.outputPath);
      setRenderProgress((prev) => prev ? { ...prev, progress: 100, status: 'completed' } : null);
      setRoom((prev) => prev ? { ...prev, status: 'completed' } : null);
    };

    const handleRenderError = (data: { error: string }) => {
      setError(`Video oluşturulurken bir hata oluştu: ${data.error}`);
      setRenderProgress(null);
      setRoom((prev) => prev ? { ...prev, status: 'recording' } : null);
    };

    const handleAllRecordingsComplete = () => {
      // Tüm kayıtlar tamamlandı bildirimi
    };

    socket.on('error', handleError);
    socket.on('room:created', handleRoomCreated);
    socket.on('room:joined', handleRoomJoined);
    socket.on('room:updated', handleRoomUpdated);
    socket.on('room:playerJoined', handlePlayerJoined);
    socket.on('room:playerLeft', handlePlayerLeft);
    socket.on('room:sceneSelected', handleSceneSelected);
    socket.on('room:gameStarted', handleGameStarted);
    socket.on('room:hostChanged', handleHostChanged);
    socket.on('render:progress', handleRenderProgressUpdate);
    socket.on('render:complete', handleRenderComplete);
    socket.on('render:error', handleRenderError);
    socket.on('recording:allCompleted', handleAllRecordingsComplete);

    return () => {
      socket.off('error', handleError);
      socket.off('room:created', handleRoomCreated);
      socket.off('room:joined', handleRoomJoined);
      socket.off('room:updated', handleRoomUpdated);
      socket.off('room:playerJoined', handlePlayerJoined);
      socket.off('room:playerLeft', handlePlayerLeft);
      socket.off('room:sceneSelected', handleSceneSelected);
      socket.off('room:gameStarted', handleGameStarted);
      socket.off('room:hostChanged', handleHostChanged);
      socket.off('render:progress', handleRenderProgressUpdate);
      socket.off('render:complete', handleRenderComplete);
      socket.off('render:error', handleRenderError);
      socket.off('recording:allCompleted', handleAllRecordingsComplete);
    };
  }, [socket]);

  const createRoom = useCallback(
    (token: string) => {
      emit('room:create', { token });
    },
    [emit]
  );

  const joinRoom = useCallback(
    (roomCode: string, token: string) => {
      emit('room:join', { roomCode: roomCode.toUpperCase(), token });
    },
    [emit]
  );

  const selectScene = useCallback(
    (sceneId: string) => {
      if (room) {
        emit('room:selectScene', { roomId: room.id, sceneId });
      }
    },
    [emit, room]
  );

  const toggleReady = useCallback(
    (isReady: boolean) => {
      if (room && playerId) {
        emit('room:toggleReady', { roomId: room.id, playerId, isReady });
      }
    },
    [emit, room, playerId]
  );

  const startGame = useCallback(() => {
    if (room) {
      emit('room:startGame', { roomId: room.id });
    }
  }, [emit, room]);

  const leaveRoom = useCallback(() => {
    emit('room:leave');
    setRoom(null);
    setPlayerId(null);
    setRenderProgress(null);
    setRenderOutput(null);
    setError(null);
  }, [emit]);

  const notifyRecordingComplete = useCallback(
    (dialogueId: string) => {
      if (room) {
        emit('recording:completed', { roomId: room.id, dialogueId });
      }
    },
    [emit, room]
  );

  return {
    room,
    playerId,
    error,
    renderProgress,
    renderOutput,
    createRoom,
    joinRoom,
    selectScene,
    toggleReady,
    startGame,
    leaveRoom,
    notifyRecordingComplete,
  };
}

import { useMemo, useEffect, useState } from 'react';
import { SocketProvider, useSocketContext } from './contexts/SocketContext';
import { useRoom } from './hooks/useRoom';
import { getUser, getToken, saveToken, removeToken } from './utils/auth';
import HomePage from './components/HomePage';
import RoomLobby from './components/RoomLobby';
import GameScreen from './components/GameScreen';
import FinalScreen from './components/FinalScreen';
import AdminPanel from './components/admin/AdminPanel';
import BackgroundMusic from './components/BackgroundMusic';
import type { AppView } from './types';
import type { DiscordUser } from './utils/auth';

function AppContent() {
  const { connected } = useSocketContext();
  const {
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
  } = useRoom();

  const [user, setUser] = useState<DiscordUser | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);

  // Sayfa yüklendiğinde token kontrolü
  useEffect(() => {
    // URL'deki token parametresini kontrol et (Discord callback'ten dönen)
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    const errorFromUrl = params.get('error');

    const roomFromUrl = params.get('room');

    if (tokenFromUrl || errorFromUrl) {
      if (tokenFromUrl) saveToken(tokenFromUrl);
      if (errorFromUrl) console.error('Discord giriş hatası:', errorFromUrl);
      
      // Sadece token ve error'u temizle, room kalsın
      let newUrl = '/';
      if (roomFromUrl) newUrl += `?room=${roomFromUrl}`;
      window.history.replaceState({}, document.title, newUrl);
    }

    // Mevcut kullanıcıyı kontrol et
    const currentUser = getUser();
    setUser(currentUser);
  }, []);

  // Mevcut görünümü belirle
  const currentView: AppView = useMemo(() => {
    if (!room) return 'home';
    if (room.status === 'completed' || room.status === 'rendering') return 'final';
    if (room.status === 'recording' || room.status === 'playing') return 'game';
    return 'lobby';
  }, [room]);

  return (
    <div className="min-h-screen bg-surface-900 relative">
      {/* Müzik çalar (Sadece ana sayfa ve lobide görünür) */}
      {(currentView === 'home' || currentView === 'lobby') && !showAdmin && (
        <BackgroundMusic />
      )}

      {showAdmin ? (
        <AdminPanel onBack={() => setShowAdmin(false)} />
      ) : (
        <>
          {currentView === 'home' && (
            <HomePage
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          error={error}
          connected={connected}
          user={user}
          onOpenAdmin={() => setShowAdmin(true)}
        />
      )}

      {currentView === 'lobby' && room && playerId && (
        <RoomLobby
          room={room}
          playerId={playerId}
          onSelectScene={selectScene}
          onToggleReady={toggleReady}
          onStartGame={startGame}
          onLeave={leaveRoom}
          error={error}
        />
      )}

      {currentView === 'game' && room && playerId && (
        <GameScreen
          room={room}
          playerId={playerId}
          onRecordingComplete={notifyRecordingComplete}
          error={error}
        />
      )}

      {currentView === 'final' && room && (
        <FinalScreen
          renderProgress={renderProgress}
          renderOutput={renderOutput}
          roomCode={room.code}
          onNewDub={leaveRoom}
        />
      )}
      </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  );
}

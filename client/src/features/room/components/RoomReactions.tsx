import React, { useState, useEffect } from 'react';
import { socketService } from '../../../services/socket.service';
import { useRoomStore } from '../../../store/roomStore';
import { useAuthStore } from '../../../store/authStore';

interface RoomReactionsProps {
  roomCode: string;
}

const REACTION_EMOJIS = ['🔥', '❤️', '🎵', '👏', '🎉', '⚡'];

interface FloatingEmoji {
  id: string;
  emoji: string;
  leftPercent: number;
}

export const RoomReactions: React.FC<RoomReactionsProps> = ({ roomCode }) => {
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([]);
  const { addReaction } = useRoomStore();
  const { user } = useAuthStore();

  // Listen for socket reactions from other participants
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleReaction = (data: { emoji: string; userId: string; username: string }) => {
      addReaction(data.emoji, data.userId, data.username);
      triggerFloatingEmoji(data.emoji);
    };

    socket.on('ROOM:REACTION', handleReaction);

    return () => {
      socket.off('ROOM:REACTION', handleReaction);
    };
  }, [addReaction]);

  const triggerFloatingEmoji = (emoji: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    const leftPercent = Math.floor(Math.random() * 70) + 15;
    setFloatingEmojis((prev) => [...prev, { id, emoji, leftPercent }]);

    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== id));
    }, 2500);
  };

  const handleSendReaction = (emoji: string) => {
    socketService.emitReaction(roomCode, emoji);
    if (user) {
      addReaction(emoji, user.id, user.username);
    }
    triggerFloatingEmoji(emoji);
  };

  return (
    <div className="relative">
      {/* Floating particles container */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingEmojis.map((item) => (
          <div
            key={item.id}
            className="absolute bottom-24 text-3xl select-none animate-[floatUp_2.5s_cubic-bezier(0.1,0.8,0.2,1)_forwards]"
            style={{ left: `${item.leftPercent}%` }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Floating Reaction Pill (Clean shadcn solid pill, NO GLOW) */}
      <div className="p-1.5 px-3 rounded-full border border-zinc-800 bg-zinc-950 shadow-sm flex items-center justify-center gap-1.5 max-w-fit mx-auto">
        <span className="text-[11px] font-medium text-zinc-500 pl-1 select-none hidden sm:inline">
          React:
        </span>
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleSendReaction(emoji)}
            className="w-8 h-8 rounded-full hover:bg-zinc-900 active:scale-125 transition-transform flex items-center justify-center text-lg cursor-pointer select-none"
            title={`React with ${emoji}`}
          >
            <span>{emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

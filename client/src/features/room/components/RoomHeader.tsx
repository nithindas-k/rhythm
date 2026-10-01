import React, { useState } from 'react';
import { Copy, Check, LogOut, Heart, Users, Activity } from 'lucide-react';
import { useRoomStore } from '../../../store/roomStore';
import { toast } from '../../../components/ui/Toast';

interface RoomHeaderProps {
  onLeaveRoom: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({ onLeaveRoom }) => {
  const { room, latencyMs } = useRoomStore();
  const [copied, setCopied] = useState(false);

  if (!room) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      toast.success(`Copied room code: ${room.code}`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy room code');
    }
  };

  const isCouples = room.type === 'couples';

  return (
    <header className="w-full rounded-2xl border border-zinc-800/80 bg-zinc-950 px-4 sm:px-5 py-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
      {/* Left: Mode Badge & Room Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center border border-zinc-800 shrink-0 ${
            isCouples ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'
          }`}
        >
          {isCouples ? (
            <Heart className="w-4 h-4 fill-current" />
          ) : (
            <Users className="w-4 h-4" />
          )}
        </div>

        <div className="min-w-0 flex items-center gap-2.5 flex-wrap">
          <h2 className="font-semibold text-sm text-zinc-100 tracking-tight">
            {isCouples ? 'Couples Session' : 'Party Room'}
          </h2>

          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
            {isCouples ? '2-Person Sync' : 'Group Sync'}
          </span>

          {/* Room Code Pill */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-900 hover:bg-zinc-850 active:scale-95 border border-zinc-800 text-xs font-mono font-medium text-zinc-300 transition-colors cursor-pointer"
              title="Click to copy room code"
            >
              <span className="tracking-wider uppercase">{room.code}</span>
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-zinc-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Right Controls: Latency Status & Leave */}
      <div className="flex items-center gap-2.5 shrink-0 ml-auto sm:ml-0">
        {/* Latency Badge (Pure shadcn badge, no green dot) */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400">
          <Activity className="w-3.5 h-3.5 text-zinc-400" />
          <span>{latencyMs !== null && latencyMs >= 0 ? `${latencyMs}ms` : 'Connecting'}</span>
        </div>

        {/* Leave Room Button */}
        <button
          onClick={onLeaveRoom}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 active:scale-95 border border-red-500/20 text-red-400 text-xs font-medium transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Leave Room</span>
        </button>
      </div>
    </header>
  );
};

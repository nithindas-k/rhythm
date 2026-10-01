import React, { useState } from 'react';
import { ListMusic, Plus, Play, Trash2, Music } from 'lucide-react';
import { useRoomStore } from '../../../store/roomStore';
import { useAuthStore } from '../../../store/authStore';
import { socketService } from '../../../services/socket.service';
import { SongPickerModal } from './SongPickerModal';

interface RoomQueueProps {
  roomCode: string;
}

export const RoomQueue: React.FC<RoomQueueProps> = ({ roomCode }) => {
  const { queue, canControl, isHost } = useRoomStore();
  const { user } = useAuthStore();
  const [songPickerOpen, setSongPickerOpen] = useState(false);

  const handlePlayNow = (songId: string) => {
    if (!canControl) return;
    socketService.changeSong(roomCode, songId);
    socketService.removeFromQueue(roomCode, songId);
  };

  const handleRemove = (songId: string) => {
    socketService.removeFromQueue(roomCode, songId);
  };

  return (
    <div className="p-5 rounded-3xl bg-zinc-900/60 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-white tracking-tight">
            Shared Queue
          </h3>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 font-mono font-medium border border-white/10">
            {queue.length}
          </span>
        </div>

        <button
          onClick={() => setSongPickerOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.15] active:scale-95 border border-white/10 text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          <span>Add Track</span>
        </button>
      </div>

      {/* Queue items */}
      {queue.length === 0 ? (
        <div className="py-10 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] space-y-3 px-4">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-500 mx-auto">
            <Music className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-zinc-300">Queue is empty</p>
            <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
              Anyone in this room can add upcoming songs to the playlist!
            </p>
          </div>
          <button
            onClick={() => setSongPickerOpen(true)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline underline-offset-4"
          >
            + Add First Track
          </button>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {queue.map((item, index) => {
            const canDelete = isHost || canControl || item.addedBy === user?.id;

            return (
              <div
                key={`${item.songId}-${index}`}
                className="group p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.05] transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-[11px] font-mono font-medium text-zinc-500 w-4 text-center shrink-0">
                    {index + 1}
                  </span>

                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-950 border border-white/10 shrink-0 relative">
                    {item.song?.coverUrl ? (
                      <img
                        src={item.song.coverUrl}
                        alt={item.song.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <Music className="w-4 h-4" />
                      </div>
                    )}

                    {canControl && (
                      <button
                        onClick={() => handlePlayNow(item.songId)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                        title="Play track now"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">
                      {item.song?.title || 'Unknown Song'}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {item.song?.artist || 'Unknown Artist'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {canControl && (
                    <button
                      onClick={() => handlePlayNow(item.songId)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                      title="Play now"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => handleRemove(item.songId)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Song Picker Modal */}
      <SongPickerModal
        isOpen={songPickerOpen}
        onClose={() => setSongPickerOpen(false)}
        roomCode={roomCode}
      />
    </div>
  );
};

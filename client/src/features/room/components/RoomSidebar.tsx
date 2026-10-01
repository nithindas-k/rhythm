import React, { useState } from 'react';
import { ListMusic, Users, Plus, Play, Trash2, Music, Crown, Radio, ShieldCheck } from 'lucide-react';
import { useRoomStore } from '../../../store/roomStore';
import { useAuthStore } from '../../../store/authStore';
import { socketService } from '../../../services/socket.service';
import { roomService } from '../../../services/room.service';
import { SongPickerModal } from './SongPickerModal';
import { Avatar } from '../../../components/ui/Avatar';
import { formatTime } from '../../../utils/formatTime';
import { toast } from '../../../components/ui/Toast';
import { cn } from '../../../utils/cn';

interface RoomSidebarProps {
  roomCode: string;
}

export const RoomSidebar: React.FC<RoomSidebarProps> = ({ roomCode }) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'listeners'>('queue');
  const [songPickerOpen, setSongPickerOpen] = useState(false);

  const { queue, members, room, canControl, isHost } = useRoomStore();
  const { user } = useAuthStore();

  const handlePlayNow = (songId: string) => {
    if (!canControl) return;
    socketService.changeSong(roomCode, songId);
    socketService.removeFromQueue(roomCode, songId);
  };

  const handleRemoveFromQueue = (songId: string) => {
    socketService.removeFromQueue(roomCode, songId);
  };

  const handleToggleControl = async (targetUserId: string, currentControl: boolean) => {
    if (!room || !isHost) return;
    try {
      await roomService.updateControl(room.code, targetUserId, !currentControl);
      toast.success(!currentControl ? 'Control granted' : 'Control revoked');
    } catch {
      toast.error('Failed to update control');
    }
  };

  return (
    <aside className="w-full h-full rounded-2xl border border-zinc-800/80 bg-zinc-950 p-5 sm:p-6 shadow-sm flex flex-col min-h-[480px] transition-all">
      {/* Tabs Header */}
      <div className="w-full flex items-center justify-between gap-3 pb-3.5 border-b border-zinc-900 shrink-0">
        {/* iOS / shadcn Segmented Tabs Control */}
        <div className="inline-flex h-9 items-center rounded-lg bg-zinc-900 p-1 text-zinc-400 border border-zinc-800/80 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all cursor-pointer select-none',
              activeTab === 'queue'
                ? 'bg-zinc-950 text-zinc-100 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <ListMusic className="w-3.5 h-3.5 shrink-0" />
            <span>Queue</span>
            <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-mono leading-none bg-zinc-800 text-zinc-300">
              {queue.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('listeners')}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all cursor-pointer select-none',
              activeTab === 'listeners'
                ? 'bg-zinc-950 text-zinc-100 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span>Listeners</span>
            <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-mono leading-none bg-zinc-800 text-zinc-300">
              {members.length}
            </span>
          </button>
        </div>

        {/* Action Button for Queue */}
        {activeTab === 'queue' && (
          <button
            onClick={() => setSongPickerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-850 active:scale-95 border border-zinc-800 text-xs font-medium text-zinc-200 transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Track</span>
          </button>
        )}
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 w-full overflow-y-auto pr-1 flex flex-col pt-3 min-h-0">
        {activeTab === 'queue' ? (
          /* QUEUE TAB */
          queue.length === 0 ? (
            <div className="flex-1 w-full rounded-xl border border-dashed border-zinc-800/80 bg-zinc-900/30 flex flex-col items-center justify-center p-6 text-center gap-3 min-h-[300px]">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-inner">
                <Music className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-zinc-300">Queue is empty</p>
                <p className="text-[11px] text-zinc-500 max-w-xs leading-normal">
                  Add tracks to keep the playback going.
                </p>
              </div>
              <button
                onClick={() => setSongPickerOpen(true)}
                className="mt-1 text-xs text-zinc-300 hover:text-white font-medium underline underline-offset-4 cursor-pointer"
              >
                + Add Tracks
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {queue.map((item, index) => {
                const canDelete = isHost || canControl || item.addedBy === user?.id;

                return (
                  <div
                    key={`${item.songId}-${index}`}
                    className="group p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/60 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-[11px] font-mono font-medium text-zinc-500 w-4 text-center shrink-0">
                        {index + 1}
                      </span>

                      <div className="w-9 h-9 rounded-md overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 relative">
                        {item.song?.coverUrl ? (
                          <img
                            src={item.song.coverUrl}
                            alt={item.song.title}
                            className="w-full h-full object-cover select-none"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600">
                            <Music className="w-3.5 h-3.5" />
                          </div>
                        )}

                        {canControl && (
                          <button
                            onClick={() => handlePlayNow(item.songId)}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-zinc-100 transition-opacity cursor-pointer"
                            title="Play track now"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-zinc-200 truncate">
                          {item.song?.title || 'Unknown Song'}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {item.song?.artist || 'Unknown Artist'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.song?.durationMs ? (
                        <span className="text-[10px] font-mono text-zinc-500">
                          {formatTime(item.song.durationMs, true)}
                        </span>
                      ) : null}

                      {canDelete && (
                        <button
                          onClick={() => handleRemoveFromQueue(item.songId)}
                          className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
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
          )
        ) : (
          /* LISTENERS TAB (No green dot!) */
          <div className="space-y-1.5">
            {members.map((member) => {
              const isCurrentUser = member.userId === user?.id;
              const isRoomHost = member.userId === room?.hostId;

              return (
                <div
                  key={member.userId}
                  className="p-2.5 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/60 flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar
                      src={member.avatarUrl}
                      name={member.username || 'Listener'}
                      size="sm"
                    />

                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate flex items-center gap-1.5">
                        <span>{member.username || 'Listener'}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] text-zinc-400">
                            (You)
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate">
                        {isRoomHost ? 'Session Host' : member.hasControl ? 'DJ' : 'Listener'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isRoomHost ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Crown className="w-3 h-3 text-amber-400" />
                        Host
                      </span>
                    ) : member.hasControl ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                        <Radio className="w-3 h-3" />
                        DJ
                      </span>
                    ) : null}

                    {isHost && !isRoomHost && (
                      <button
                        onClick={() => handleToggleControl(member.userId, member.hasControl)}
                        className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                          member.hasControl
                            ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                            : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                        }`}
                        title={member.hasControl ? 'Revoke DJ control' : 'Grant DJ control'}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SongPickerModal
        isOpen={songPickerOpen}
        onClose={() => setSongPickerOpen(false)}
        roomCode={roomCode}
      />
    </aside>
  );
};

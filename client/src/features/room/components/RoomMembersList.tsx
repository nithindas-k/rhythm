import React from 'react';
import { Crown, Radio, Users, ShieldCheck } from 'lucide-react';
import { Avatar } from '../../../components/ui/Avatar';
import { useRoomStore } from '../../../store/roomStore';
import { useAuthStore } from '../../../store/authStore';
import { roomService } from '../../../services/room.service';
import { toast } from '../../../components/ui/Toast';

export const RoomMembersList: React.FC = () => {
  const { members, room, isHost } = useRoomStore();
  const { user } = useAuthStore();

  const handleToggleControl = async (targetUserId: string, currentControl: boolean) => {
    if (!room || !isHost) return;
    try {
      await roomService.updateControl(room.code, targetUserId, !currentControl);
      toast.success(!currentControl ? 'Control granted' : 'Control revoked');
    } catch {
      toast.error('Failed to update member control');
    }
  };

  return (
    <div className="p-5 rounded-3xl bg-zinc-900/60 backdrop-blur-2xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <h3 className="font-bold text-sm text-white tracking-tight">
            Participants
          </h3>
        </div>
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 font-mono font-medium border border-white/10">
          {members.length} {members.length === 1 ? 'listener' : 'listeners'}
        </span>
      </div>

      {/* Members list */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {members.map((member) => {
          const isCurrentUser = member.userId === user?.id;
          const isRoomHost = member.userId === room?.hostId;

          return (
            <div
              key={member.userId}
              className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] flex items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <Avatar
                    src={member.avatarUrl}
                    name={member.username || 'Listener'}
                    size="sm"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-900" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                    <span>{member.username || 'Listener'}</span>
                    {isCurrentUser && (
                      <span className="text-[10px] text-emerald-400 font-medium">
                        (You)
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {isRoomHost ? 'Session Host' : member.hasControl ? 'Co-DJ' : 'Listener'}
                  </p>
                </div>
              </div>

              {/* Status Badges & Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {isRoomHost ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm">
                    <Crown className="w-3 h-3 text-amber-400" />
                    Host
                  </span>
                ) : member.hasControl ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <Radio className="w-3 h-3" />
                    DJ
                  </span>
                ) : null}

                {/* Host Control Toggle Switch for Non-Host Members */}
                {isHost && !isRoomHost && (
                  <button
                    onClick={() => handleToggleControl(member.userId, member.hasControl)}
                    className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                      member.hasControl
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white'
                    }`}
                    title={member.hasControl ? 'Revoke playback control' : 'Grant playback control'}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

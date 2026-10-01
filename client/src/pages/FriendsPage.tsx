import React, { useState } from 'react';
import { Users, UserPlus } from 'lucide-react';
import { FriendSearch } from '../features/friends/components/FriendSearch';
import { FriendRequests } from '../features/friends/components/FriendRequests';
import { FriendList } from '../features/friends/components/FriendList';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Input } from '../components/ui/Input';
import { roomService } from '../services/room.service';
import { toast } from '../components/ui/Toast';

export const FriendsPage: React.FC = () => {
  const [inviteModalUser, setInviteModalUser] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const handleSendInvite = async () => {
    if (!inviteModalUser) return;
    const cleanCode = roomCode.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      toast.error('Please enter a valid 6-character room code');
      return;
    }

    setIsInviting(true);
    try {
      await roomService.invite(cleanCode, inviteModalUser);
      toast.success('Room invitation sent to your friend!');
      setInviteModalUser(null);
      setRoomCode('');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send room invite';
      toast.error(msg);
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-[var(--foreground)] flex items-center gap-3">
          <Users className="w-8 h-8 text-[var(--primary)]" />
          Friends & Social
        </h1>
        <p className="text-sm text-[var(--foreground-muted)]">
          Connect with friends to listen synchronously in Couples and Party rooms.
        </p>
      </div>

      {/* Main Grid: Search & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Search & Pending */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="p-6 rounded-3xl glass-panel border border-[var(--border)] flex flex-col gap-4">
            <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[var(--primary)]" />
              Find Friends
            </h3>
            <FriendSearch />
          </div>

          <FriendRequests />
        </div>

        {/* Right Column: Friends List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
              Your Friends
            </h2>
          </div>

          <FriendList onInviteToRoom={(userId) => setInviteModalUser(userId)} />
        </div>
      </div>

      {/* Invite to Room Modal */}
      <Dialog
        isOpen={Boolean(inviteModalUser)}
        onClose={() => setInviteModalUser(null)}
        title="Invite Friend to Room"
        description="Enter the 6-character room code to send an invite notification."
      >
        <div className="flex flex-col gap-4 py-2">
          <Input
            label="Room Code"
            placeholder="e.g. K9X2MW"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="uppercase font-mono tracking-widest font-bold"
          />

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setInviteModalUser(null)}
              disabled={isInviting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSendInvite}
              isLoading={isInviting}
            >
              Send Invite
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

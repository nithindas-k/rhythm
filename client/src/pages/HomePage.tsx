import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Headphones, Heart, Users, Sparkles, ArrowRight, KeyRound } from 'lucide-react';
import { ModeCard } from '../features/home/components/ModeCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Dialog } from '../components/ui/Dialog';
import { toast } from '../components/ui/Toast';
import { useAuthStore } from '../store/authStore';
import { roomService } from '../services/room.service';
import { ROUTES } from '../constants/routes';

export const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'couples' | 'party'>('couples');
  const [isCreating, setIsCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const handleCreateRoom = async () => {
    setIsCreating(true);
    try {
      const room = await roomService.createRoom(selectedType);
      toast.success(`${selectedType === 'couples' ? 'Couples' : 'Party'} room created! Code: ${room.code}`);
      setIsCreateModalOpen(false);
      navigate(ROUTES.ROOM(room.code));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create room';
      toast.error(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = joinCode.trim().toUpperCase();
    if (clean.length !== 6) {
      toast.error('Please enter a valid 6-character room code');
      return;
    }
    navigate(ROUTES.ROOM(clean));
  };

  return (
    <div className="flex flex-col gap-10">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl p-8 sm:p-12 overflow-hidden glass-panel border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] via-[var(--surface-elevated)] to-[var(--surface)] shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-[var(--primary)] opacity-[0.12] blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/30 text-[var(--primary)] text-xs font-semibold w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            Spotify-Style Real-Time Listening
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Ready to listen,{' '}
            <span className="text-[var(--primary)]">
              {user?.username || 'music explorer'}?
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[var(--foreground-muted)] leading-relaxed">
            Choose how you want to listen today: dive into solo exploration, start a synchronized 2-person session, or host an all-out music party.
          </p>

          {/* Quick Join Code Form */}
          <form
            onSubmit={handleJoinByCode}
            className="flex items-center gap-3 pt-3 max-w-md w-full"
          >
            <Input
              placeholder="Enter 6-char Room Code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              icon={<KeyRound className="w-4 h-4" />}
              className="uppercase tracking-widest font-mono font-bold"
            />
            <Button type="submit" variant="primary" size="md" className="shrink-0 gap-1.5 font-bold">
              Join <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Mode Selector Section */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            Choose Your Listening Mode
          </h2>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)]">
            Select a mode to jump directly into the music.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mode 1: Solo */}
          <ModeCard
            title="Solo Mode"
            badge="Personal Library"
            description="Explore trending tracks, search millions of licensed songs, curate playlists, and favorite tracks."
            icon={<Headphones className="w-7 h-7 text-[var(--primary)]" />}
            gradient="bg-[var(--primary)]"
            onClick={() => navigate(ROUTES.SOLO)}
            ctaText="Browse Music"
          />

          {/* Mode 2: Couples */}
          <ModeCard
            title="Couples Room"
            badge="Private Sync"
            description="Invite a partner for an intimate, latency-synchronized music experience. Both hear the exact same moment."
            icon={<Heart className="w-7 h-7 text-rose-400" />}
            gradient="bg-rose-500"
            onClick={() => {
              setSelectedType('couples');
              setIsCreateModalOpen(true);
            }}
            ctaText="Start Couples Session"
            isPopular
          />

          {/* Mode 3: Party */}
          <ModeCard
            title="Party Room"
            badge="Multi-User Jam"
            description="Host a room for your friend group. Share audio controls, take queue requests, and vote on tracks."
            icon={<Users className="w-7 h-7 text-indigo-400" />}
            gradient="bg-indigo-500"
            onClick={() => {
              setSelectedType('party');
              setIsCreateModalOpen(true);
            }}
            ctaText="Host Music Party"
          />
        </div>
      </div>

      {/* Create Room Modal */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={selectedType === 'couples' ? 'Create Couples Room' : 'Host Party Room'}
        description={
          selectedType === 'couples'
            ? 'A private synchronized session designed for two people.'
            : 'A synchronized group room where friends can join and collaborate on the queue.'
        }
      >
        <div className="flex flex-col gap-4 py-2">
          <div className="p-4 rounded-2xl glass-panel border border-[var(--border)] flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/15 text-[var(--primary)] flex items-center justify-center shrink-0">
              {selectedType === 'couples' ? (
                <Heart className="w-5 h-5" />
              ) : (
                <Users className="w-5 h-5" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold text-[var(--foreground)] capitalize">
                {selectedType} Room
              </h4>
              <p className="text-xs text-[var(--foreground-muted)]">
                Authoritative Redis synchronization &bull; Drift correction enabled
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateRoom}
              isLoading={isCreating}
              className="gap-2 font-bold"
            >
              Create & Launch Room
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

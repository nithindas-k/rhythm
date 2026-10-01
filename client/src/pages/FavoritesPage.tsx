import React from 'react';
import { Heart, Play, Shuffle, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../features/favorites/useFavorites';
import { SongList } from '../features/songs/SongList';
import { Button } from '../components/ui/Button';
import { usePlayerStore } from '../store/playerStore';
import { formatTime } from '../utils/formatTime';
import { ROUTES } from '../constants/routes';

export const FavoritesPage: React.FC = () => {
  const { data, isLoading } = useFavorites();
  const { playSong, toggleShuffle } = usePlayerStore();

  const favorites = data?.favorites || [];
  const songs = favorites.map((f) => f.song).filter(Boolean);

  const totalDurationMs = songs.reduce((acc, s) => acc + (s.durationMs || 0), 0);

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs);
    }
  };

  const handleShufflePlay = () => {
    if (songs.length > 0) {
      const randomIndex = Math.floor(Math.random() * songs.length);
      toggleShuffle();
      playSong(songs[randomIndex], songs);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Hero Header */}
      <div className="relative rounded-3xl p-6 md:p-10 overflow-hidden bg-gradient-to-br from-[var(--primary)]/20 via-[var(--surface-overlay)] to-[var(--surface)] border border-[var(--border)] shadow-xl flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
        <div className="w-40 h-40 md:w-52 md:h-52 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-purple-600 flex items-center justify-center text-white shadow-2xl shrink-0 glow-primary">
          <Heart className="w-20 h-20 fill-white" />
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <span className="text-xs uppercase font-extrabold tracking-widest text-[var(--primary)]">
            Playlist
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--foreground)]">
            Liked Songs
          </h1>
          <p className="text-xs md:text-sm text-[var(--foreground-muted)] flex items-center justify-center md:justify-start gap-2">
            <span>{songs.length} {songs.length === 1 ? 'song' : 'songs'}</span>
            {totalDurationMs > 0 && (
              <>
                <span>•</span>
                <span>{formatTime(totalDurationMs)} total</span>
              </>
            )}
          </p>

          {songs.length > 0 && (
            <div className="pt-4 flex items-center justify-center md:justify-start gap-4">
              <button
                onClick={handlePlayAll}
                className="w-14 h-14 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl glow-primary cursor-pointer"
                title="Play all liked songs"
              >
                <Play className="w-6 h-6 fill-current translate-x-0.5" />
              </button>

              <Button
                variant="outline"
                size="md"
                onClick={handleShufflePlay}
                className="gap-2"
              >
                <Shuffle className="w-4 h-4 text-[var(--primary)]" />
                Shuffle
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Track List */}
      <section className="space-y-4">
        {songs.length === 0 && !isLoading ? (
          <div className="p-16 text-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)]/30 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center mx-auto text-[var(--foreground-dim)]">
              <Heart className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--foreground)]">
                Songs you like will appear here
              </h3>
              <p className="text-sm text-[var(--foreground-muted)] mt-1 max-w-sm mx-auto">
                Save songs by tapping the heart icon on any track in Discover or your rooms.
              </p>
            </div>
            <Link to={ROUTES.SOLO}>
              <Button variant="primary" size="md" className="gap-2">
                <Compass className="w-4 h-4" />
                Find Songs to Like
              </Button>
            </Link>
          </div>
        ) : (
          <SongList
            songs={songs}
            isLoading={isLoading}
            emptyMessage="No liked songs yet."
          />
        )}
      </section>
    </div>
  );
};

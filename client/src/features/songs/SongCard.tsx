import React, { useState } from 'react';
import { Play, Pause, Heart, MoreHorizontal, ListPlus, Music } from 'lucide-react';
import type { Song } from '../../types/song.types';
import { usePlayerStore } from '../../store/playerStore';
import { useFavorites, useToggleFavorite } from '../favorites/useFavorites';
import { AddToPlaylistDialog } from '../../components/player/AddToPlaylistDialog';
import { cn } from '../../utils/cn';

interface SongCardProps {
  song: Song;
  queueContext?: Song[];
}

export const SongCard: React.FC<SongCardProps> = ({ song, queueContext }) => {
  const { currentSong, isPlaying, playSong, togglePlay, addToQueue } = usePlayerStore();
  const { data: favoritesData } = useFavorites();
  const { toggle: toggleFav } = useToggleFavorite();

  const [menuOpen, setMenuOpen] = useState(false);
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);

  const isCurrent = currentSong?.id === song.id;
  const isPlayingCurrent = isCurrent && isPlaying;

  const isFavorited = favoritesData?.favorites?.some(
    (f) => f.song?.id === song.id || f.id === song.id
  );

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, queueContext);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFav(song.id, Boolean(isFavorited));
  };

  return (
    <>
      <div
        onClick={handlePlayClick}
        className="group relative p-3.5 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all duration-300 flex flex-col cursor-pointer hover:shadow-xl hover:-translate-y-1"
      >
        {/* Artwork */}
        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[var(--surface-elevated)] shadow-md">
          {song.coverUrl ? (
            <img
              src={song.coverUrl}
              alt={song.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--foreground-dim)]">
              <Music className="w-12 h-12" />
            </div>
          )}

          {/* Hover / Active Play Button Overlay */}
          <div
            className={cn(
              'absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200',
              isPlayingCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
          >
            <button
              onClick={handlePlayClick}
              className="w-12 h-12 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center shadow-lg transform group-hover:scale-110 active:scale-95 transition-all glow-primary cursor-pointer"
              title={isPlayingCurrent ? 'Pause' : 'Play'}
            >
              {isPlayingCurrent ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current translate-x-0.5" />
              )}
            </button>
          </div>

          {/* Genre tag badge */}
          {song.genre && (
            <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10 uppercase tracking-wider">
              {song.genre}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4
              className={cn(
                'font-bold text-sm truncate transition-colors',
                isCurrent ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'
              )}
            >
              {song.title}
            </h4>
            <p className="text-xs text-[var(--foreground-muted)] truncate mt-0.5">
              {song.artist}
            </p>
          </div>

          {/* Quick Favorite Icon */}
          <button
            onClick={handleFavoriteClick}
            className={cn(
              'p-1 rounded-lg transition-colors cursor-pointer mt-0.5',
              isFavorited
                ? 'text-[var(--primary)] hover:text-[var(--primary-hover)]'
                : 'text-[var(--foreground-dim)] opacity-0 group-hover:opacity-100 hover:text-[var(--foreground)]'
            )}
            title={isFavorited ? 'Remove favorite' : 'Add favorite'}
          >
            <Heart className={cn('w-4 h-4', isFavorited && 'fill-current')} />
          </button>
        </div>

        {/* Menu button for queue & playlists */}
        <div className="mt-2 pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--foreground-dim)]">
          <span>{song.playCount?.toLocaleString() || 0} plays</span>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1 rounded text-[var(--foreground-dim)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)] transition-colors cursor-pointer"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-6 right-0 w-44 rounded-xl bg-[var(--surface-overlay)] border border-[var(--border)] shadow-xl p-1 z-30 animate-fade-in"
              >
                <button
                  onClick={() => {
                    addToQueue(song);
                    setMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-lg text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] flex items-center gap-2 text-left cursor-pointer"
                >
                  <ListPlus className="w-3.5 h-3.5 text-[var(--primary)]" />
                  Add to Queue
                </button>
                <button
                  onClick={() => {
                    setPlaylistDialogOpen(true);
                    setMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-lg text-xs font-medium text-[var(--foreground)] hover:bg-[var(--surface-hover)] flex items-center gap-2 text-left cursor-pointer"
                >
                  <Music className="w-3.5 h-3.5 text-[var(--primary)]" />
                  Add to Playlist
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddToPlaylistDialog
        isOpen={playlistDialogOpen}
        onClose={() => setPlaylistDialogOpen(false)}
        song={song}
      />
    </>
  );
};

import React, { useState } from 'react';
import { Play, Heart, MoreHorizontal, ListPlus, Music, Trash2 } from 'lucide-react';
import type { Song } from '../../types/song.types';
import { usePlayerStore } from '../../store/playerStore';
import { useFavorites, useToggleFavorite } from '../favorites/useFavorites';
import { AddToPlaylistDialog } from '../../components/player/AddToPlaylistDialog';
import { formatTime } from '../../utils/formatTime';
import { cn } from '../../utils/cn';

interface SongTableRowProps {
  song: Song;
  index: number;
  playlistContext?: Song[];
  onRemoveFromPlaylist?: (songId: string) => void;
}

export const SongTableRow: React.FC<SongTableRowProps> = ({
  song,
  index,
  playlistContext,
  onRemoveFromPlaylist,
}) => {
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

  const handleRowClick = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      playSong(song, playlistContext);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFav(song.id, Boolean(isFavorited));
  };

  return (
    <>
      <div
        onClick={handleRowClick}
        className={cn(
          'group px-4 py-2.5 rounded-xl flex items-center gap-4 transition-colors cursor-pointer border border-transparent select-none',
          isCurrent
            ? 'bg-[var(--surface-hover)] border-[var(--border)]'
            : 'hover:bg-[var(--surface-elevated)]'
        )}
      >
        {/* Index or Play Button */}
        <div className="w-6 flex items-center justify-center text-xs font-mono text-[var(--foreground-dim)] shrink-0">
          {isPlayingCurrent ? (
            <div className="flex items-center gap-0.5">
              <span className="w-1 h-3 bg-[var(--primary)] rounded-full animate-bounce" />
              <span className="w-1 h-4 bg-[var(--primary)] rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1 h-2 bg-[var(--primary)] rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          ) : (
            <>
              <span className="group-hover:hidden">{index + 1}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRowClick();
                }}
                className="hidden group-hover:flex items-center justify-center text-[var(--foreground)] hover:text-[var(--primary)]"
                title={isCurrent ? 'Pause' : 'Play'}
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Artwork & Title/Artist */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--surface-overlay)] shrink-0 shadow-sm">
            {song.coverUrl ? (
              <img
                src={song.coverUrl}
                alt={song.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--foreground-dim)]">
                <Music className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={cn(
                'text-sm font-semibold truncate',
                isCurrent ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'
              )}
            >
              {song.title}
            </p>
            <p className="text-xs text-[var(--foreground-dim)] truncate mt-0.5">
              {song.artist}
            </p>
          </div>
        </div>

        {/* Album (hidden on small screens) */}
        <div className="hidden md:block w-48 text-xs text-[var(--foreground-muted)] truncate">
          {song.album || '—'}
        </div>

        {/* Genre Pill (hidden on mobile) */}
        <div className="hidden lg:block w-28">
          {song.genre ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--surface-overlay)] text-[var(--foreground-muted)] border border-[var(--border)]">
              {song.genre}
            </span>
          ) : (
            <span className="text-xs text-[var(--foreground-dim)]">—</span>
          )}
        </div>

        {/* Play count */}
        <div className="hidden sm:block w-20 text-xs font-mono text-[var(--foreground-dim)] text-right">
          {song.playCount?.toLocaleString() || 0}
        </div>

        {/* Duration */}
        <div className="w-12 text-xs font-mono text-[var(--foreground-dim)] text-right shrink-0">
          {formatTime(song.durationMs)}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleFavoriteClick}
            className={cn(
              'p-1.5 rounded-lg transition-colors cursor-pointer',
              isFavorited
                ? 'text-[var(--primary)] hover:text-[var(--primary-hover)]'
                : 'text-[var(--foreground-dim)] opacity-0 group-hover:opacity-100 hover:text-[var(--foreground)]'
            )}
            title={isFavorited ? 'Remove favorite' : 'Add favorite'}
          >
            <Heart className={cn('w-4 h-4', isFavorited && 'fill-current')} />
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1.5 rounded-lg text-[var(--foreground-dim)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              title="More options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 bottom-6 w-44 rounded-xl bg-[var(--surface-overlay)] border border-[var(--border)] shadow-xl p-1 z-30 animate-fade-in"
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
                {onRemoveFromPlaylist && (
                  <button
                    onClick={() => {
                      onRemoveFromPlaylist(song.id);
                      setMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 flex items-center gap-2 text-left cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove from Playlist
                  </button>
                )}
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

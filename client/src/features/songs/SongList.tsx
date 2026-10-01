import React from 'react';
import { Clock3, Music } from 'lucide-react';
import type { Song } from '../../types/song.types';
import { SongTableRow } from './SongTableRow';

interface SongListProps {
  songs: Song[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRemoveFromPlaylist?: (songId: string) => void;
}

export const SongList: React.FC<SongListProps> = ({
  songs,
  isLoading,
  emptyMessage = 'No tracks found.',
  onRemoveFromPlaylist,
}) => {

  if (isLoading) {
    return (
      <div className="space-y-2 py-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="px-4 py-3 rounded-xl bg-[var(--surface-elevated)]/50 animate-pulse flex items-center gap-4"
          >
            <div className="w-6 h-4 bg-[var(--surface-overlay)] rounded" />
            <div className="w-10 h-10 bg-[var(--surface-overlay)] rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="w-1/3 h-4 bg-[var(--surface-overlay)] rounded" />
              <div className="w-1/4 h-3 bg-[var(--surface-overlay)] rounded" />
            </div>
            <div className="w-12 h-3 bg-[var(--surface-overlay)] rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (songs.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/30">
        <Music className="w-10 h-10 mx-auto text-[var(--foreground-dim)] mb-3" />
        <p className="text-sm font-medium text-[var(--foreground-muted)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Table Header */}
      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-dim)] flex items-center gap-4 border-b border-[var(--border)] select-none">
        <span className="w-6 text-center">#</span>
        <span className="flex-1">Title</span>
        <span className="hidden md:block w-48">Album</span>
        <span className="hidden lg:block w-28">Genre</span>
        <span className="hidden sm:block w-20 text-right">Plays</span>
        <span className="w-12 flex justify-end">
          <Clock3 className="w-4 h-4" />
        </span>
        <span className="w-16" />
      </div>

      {/* Rows */}
      <div className="mt-1 space-y-0.5">
        {songs.map((song, index) => (
          <SongTableRow
            key={song.id}
            song={song}
            index={index}
            playlistContext={songs}
            onRemoveFromPlaylist={onRemoveFromPlaylist}
          />
        ))}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Search, Plus, Play, Music, Flame, X } from 'lucide-react';
import { Dialog } from '../../../components/ui/Dialog';
import { useTrendingSongs, useSearchSongs } from '../../songs/useSongs';
import { useDebounce } from '../../../hooks/useDebounce';
import { socketService } from '../../../services/socket.service';
import { useRoomStore } from '../../../store/roomStore';
import { formatTime } from '../../../utils/formatTime';
import { toast } from '../../../components/ui/Toast';

interface SongPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
}

export const SongPickerModal: React.FC<SongPickerModalProps> = ({
  isOpen,
  onClose,
  roomCode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { playbackState, canControl } = useRoomStore();

  const { data: trendingSongs } = useTrendingSongs(6);
  const { data: searchData, isLoading } = useSearchSongs({
    q: debouncedSearch.trim() || undefined,
    limit: 15,
  });

  const songs = debouncedSearch.trim() ? searchData?.songs || [] : trendingSongs || [];

  const handleAddSong = (songId: string, songTitle: string) => {
    // If room has no active song and user has control, immediately play it!
    if (!playbackState?.trackId && canControl) {
      socketService.changeSong(roomCode, songId);
      toast.success(`Playing "${songTitle}" in room`);
    } else {
      socketService.addToQueue(roomCode, songId);
      toast.success(`Added "${songTitle}" to room queue`);
    }
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add to Room Queue"
      description="Pick a song to play together in real-time"
    >
      <div className="space-y-4 pt-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-dim)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search songs, artists, genres..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder-[var(--foreground-dim)] focus:outline-none focus:border-[var(--primary)]"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--foreground-dim)] hover:text-[var(--foreground)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Section title */}
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--foreground-dim)]">
          {debouncedSearch.trim() ? (
            <span>Search Results</span>
          ) : (
            <>
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Trending Recommendations</span>
            </>
          )}
        </div>

        {/* Song List */}
        <div className="max-h-72 overflow-y-auto space-y-1">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-[var(--foreground-dim)]">
              Loading songs...
            </div>
          ) : songs.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--foreground-dim)]">
              No songs found matching your search.
            </div>
          ) : (
            songs.map((song) => (
              <button
                key={song.id}
                onClick={() => handleAddSong(song.id, song.title)}
                className="w-full p-2.5 rounded-xl hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--border)] transition-all flex items-center justify-between group text-left cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--surface-overlay)] shrink-0">
                    {song.coverUrl ? (
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--foreground-dim)]">
                        <Music className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
                      {song.title}
                    </p>
                    <p className="text-xs text-[var(--foreground-dim)] truncate mt-0.5">
                      {song.artist}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-mono text-[var(--foreground-muted)] font-medium">
                    {formatTime(song.durationMs, true)}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md group-hover:scale-105">
                    {!playbackState?.trackId && canControl ? (
                      <Play className="w-4 h-4 fill-current translate-x-0.5" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </Dialog>
  );
};

import React, { useState } from 'react';
import { Search, Flame, Play, Music, Sparkles, X } from 'lucide-react';
import { useTrendingSongs, useSearchSongs } from '../features/songs/useSongs';
import { SongCard } from '../features/songs/SongCard';
import { SongList } from '../features/songs/SongList';
import { GenrePills } from '../features/songs/GenrePills';
import { Button } from '../components/ui/Button';
import { useDebounce } from '../hooks/useDebounce';
import { usePlayerStore } from '../store/playerStore';

export const SoloPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [sortOption, setSortOption] = useState<'trending' | 'newest' | 'oldest'>('trending');

  const debouncedSearch = useDebounce(searchQuery, 300);
  const { playSong } = usePlayerStore();

  const { data: trendingSongs, isLoading: isTrendingLoading } = useTrendingSongs(8);

  const { data: searchData, isLoading: isSearchLoading } = useSearchSongs({
    q: debouncedSearch.trim() || undefined,
    genre: selectedGenre || undefined,
    sort: sortOption,
    limit: 30,
  });

  const songs = searchData?.songs || [];
  const isFiltering = Boolean(debouncedSearch.trim() || selectedGenre);

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Banner & Search Controls */}
      <div className="relative rounded-3xl p-6 md:p-8 overflow-hidden bg-gradient-to-r from-[var(--surface-overlay)] via-[var(--surface)] to-[var(--surface-elevated)] border border-[var(--border)] shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--primary)]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] text-xs font-semibold text-[var(--primary)] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Discover & Solo Playback</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
            Explore Soundscapes
          </h1>
          <p className="mt-2 text-sm md:text-base text-[var(--foreground-muted)]">
            Stream high-fidelity royalty-free tracks, build playlists, or listen before inviting friends.
          </p>

          {/* Search bar input */}
          <div className="mt-6 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-dim)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tracks, artists, or albums..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder-[var(--foreground-dim)] focus:outline-none focus:border-[var(--primary)] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-dim)] hover:text-[var(--foreground)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as any)}
              className="py-2.5 px-3.5 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] cursor-pointer"
            >
              <option value="trending">Trending</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Genre Filter Pills */}
      <div>
        <GenrePills
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
        />
      </div>

      {/* Trending Section (shown when not actively searching) */}
      {!isFiltering && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">
                Trending Tracks
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
            {isTrendingLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-[var(--surface-elevated)] animate-pulse aspect-square"
                  />
                ))
              : (trendingSongs || []).slice(0, 4).map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    queueContext={trendingSongs}
                  />
                ))}
          </div>
        </section>
      )}

      {/* All Tracks / Filtered Results Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="text-lg md:text-xl font-bold text-[var(--foreground)]">
              {isFiltering ? 'Search Results' : 'All Music'}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] text-[var(--foreground-dim)]">
              {songs.length} tracks
            </span>
          </div>

          {songs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePlayAll}
              className="gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Play All
            </Button>
          )}
        </div>

        <SongList
          songs={songs}
          isLoading={isSearchLoading}
          emptyMessage={
            isFiltering
              ? `No tracks found for "${debouncedSearch || selectedGenre}". Try another keyword or genre!`
              : 'No songs available yet. Run the database seed to add sample tracks!'
          }
        />
      </section>
    </div>
  );
};

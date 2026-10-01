import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ListMusic,
  Plus,
  Music,
  Maximize2,
} from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { useRoomStore } from '../../store/roomStore';
import { formatTime } from '../../utils/formatTime';
import { ProgressSlider } from './ProgressSlider';
import { VolumeControl } from './VolumeControl';
import { QueueDrawer } from './QueueDrawer';
import { AddToPlaylistDialog } from './AddToPlaylistDialog';
import { NowPlayingModal } from './NowPlayingModal';
import { useFavorites, useToggleFavorite } from '../../features/favorites/useFavorites';
import { cn } from '../../utils/cn';

interface PlayerBarProps {
  onSeek: (positionMs: number) => void;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({ onSeek }) => {
  const {
    currentSong,
    isPlaying,
    playbackPositionMs,
    durationMs,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    queue,
    isQueueOpen,
    togglePlay,
    next,
    previous,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    setQueueOpen,
  } = usePlayerStore();

  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const { data: favoritesData } = useFavorites();
  const { toggle: toggleFav } = useToggleFavorite();
  const { isInRoom } = useRoomStore();

  if (isInRoom) return null;

  const isFavorited = currentSong
    ? favoritesData?.favorites?.some((f) => f.song?.id === currentSong.id || f.id === currentSong.id)
    : false;

  const handleFavoriteClick = () => {
    if (!currentSong) return;
    toggleFav(currentSong.id, Boolean(isFavorited));
  };

  return (
    <>
      <div className="fixed bottom-[53px] md:bottom-0 left-0 right-0 z-40 bg-[var(--surface-overlay)]/95 backdrop-blur-xl border-t border-[var(--border)] px-4 md:px-6 py-2.5 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left Track Info (Click to open full player window) */}
          <div className="flex items-center gap-3 w-1/4 min-w-[140px] md:min-w-[200px]">
            {currentSong ? (
              <>
                <div
                  onClick={() => setNowPlayingOpen(true)}
                  className="w-12 h-12 rounded-xl overflow-hidden bg-[var(--surface-elevated)] shrink-0 shadow-md relative group cursor-pointer"
                  title="Open Full Player Window"
                >
                  {currentSong.coverUrl ? (
                    <img
                      src={currentSong.coverUrl}
                      alt={currentSong.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--foreground-dim)]">
                      <Music className="w-5 h-5" />
                    </div>
                  )}
                  {/* Subtle expand icon overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Maximize2 className="w-4 h-4 drop-shadow" />
                  </div>
                </div>

                <div
                  onClick={() => setNowPlayingOpen(true)}
                  className="min-w-0 flex-1 cursor-pointer group"
                  title="Open Full Player Window"
                >
                  <p className="text-sm font-bold text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
                    {currentSong.title}
                  </p>
                  <p className="text-xs text-[var(--foreground-dim)] truncate group-hover:text-[var(--foreground-muted)] transition-colors">
                    {currentSong.artist}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleFavoriteClick}
                    className={cn(
                      'p-1.5 rounded-lg transition-colors cursor-pointer',
                      isFavorited
                        ? 'text-[var(--primary)] hover:text-[var(--primary-hover)]'
                        : 'text-[var(--foreground-dim)] hover:text-[var(--foreground)]'
                    )}
                    title={isFavorited ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
                  >
                    <Heart className={cn('w-4 h-4', isFavorited && 'fill-current')} />
                  </button>

                  <button
                    onClick={() => setPlaylistDialogOpen(true)}
                    className="p-1.5 rounded-lg text-[var(--foreground-dim)] hover:text-[var(--foreground)] transition-colors cursor-pointer hidden sm:block"
                    title="Add to Playlist"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 text-[var(--foreground-dim)]">
                <div className="w-12 h-12 rounded-xl bg-[var(--surface-elevated)] flex items-center justify-center">
                  <Music className="w-5 h-5 text-[var(--foreground-dim)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--foreground-muted)]">
                    No track playing
                  </p>
                  <p className="text-[10px] text-[var(--foreground-dim)]">
                    Pick a song to start listening
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Center Controls & Timeline */}
          <div className="flex flex-col items-center max-w-xl w-2/4 gap-1">
            {/* Buttons */}
            <div className="flex items-center gap-3 md:gap-5">
              <button
                onClick={toggleShuffle}
                disabled={!currentSong}
                className={cn(
                  'p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
                  isShuffled
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                )}
                title={isShuffled ? 'Shuffle enabled' : 'Shuffle disabled'}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={previous}
                disabled={!currentSong}
                className="p-1 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Previous track"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={togglePlay}
                disabled={!currentSong}
                className="w-9 h-9 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md glow-primary-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current translate-x-0.5" />
                )}
              </button>

              <button
                onClick={next}
                disabled={!currentSong}
                className="p-1 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Next track"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={cycleRepeat}
                disabled={!currentSong}
                className={cn(
                  'p-1 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
                  repeatMode !== 'off'
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
                )}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Scrubber Timeline */}
            <div className="w-full flex items-center gap-2.5">
              <span className="text-[11px] font-mono text-[var(--foreground-dim)] w-8 text-right">
                {formatTime(playbackPositionMs)}
              </span>

              <div className="flex-1">
                <ProgressSlider
                  currentMs={playbackPositionMs}
                  durationMs={durationMs}
                  onSeek={onSeek}
                />
              </div>

              <span className="text-[11px] font-mono text-[var(--foreground-dim)] w-8 text-left">
                {formatTime(durationMs)}
              </span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center justify-end gap-3 w-1/4 min-w-[120px]">
            <button
              onClick={() => setQueueOpen(!isQueueOpen)}
              className={cn(
                'relative p-1.5 rounded-lg transition-colors cursor-pointer',
                isQueueOpen
                  ? 'text-[var(--primary)] bg-[var(--surface-hover)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              )}
              title="Queue"
            >
              <ListMusic className="w-5 h-5" />
              {queue.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold flex items-center justify-center">
                  {queue.length > 9 ? '9+' : queue.length}
                </span>
              )}
            </button>

            <div className="hidden sm:block">
              <VolumeControl
                volume={volume}
                isMuted={isMuted}
                onVolumeChange={setVolume}
                onToggleMute={toggleMute}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Slide-out Queue Drawer */}
      <QueueDrawer />

      {/* Add To Playlist Dialog */}
      <AddToPlaylistDialog
        isOpen={playlistDialogOpen}
        onClose={() => setPlaylistDialogOpen(false)}
        song={currentSong}
      />

      {/* Full-Screen / Expanded Solo Now Playing Modal Window */}
      <NowPlayingModal
        isOpen={nowPlayingOpen}
        onClose={() => setNowPlayingOpen(false)}
        onSeek={onSeek}
      />
    </>
  );
};

import React, { useEffect, useState } from 'react';
import {
  ChevronDown,
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
} from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { formatTime } from '../../utils/formatTime';
import { ProgressSlider } from './ProgressSlider';
import { VolumeControl } from './VolumeControl';
import { AddToPlaylistDialog } from './AddToPlaylistDialog';
import { AudioWaveEffect } from '../../features/room/components/AudioWaveEffect';
import { useFavorites, useToggleFavorite } from '../../features/favorites/useFavorites';
import { cn } from '../../utils/cn';

interface NowPlayingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSeek: (positionMs: number) => void;
}

export const NowPlayingModal: React.FC<NowPlayingModalProps> = ({
  isOpen,
  onClose,
  onSeek,
}) => {
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
  const { data: favoritesData } = useFavorites();
  const { toggle: toggleFav } = useToggleFavorite();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !currentSong) return null;

  const isFavorited = favoritesData?.favorites?.some(
    (f) => f.song?.id === currentSong.id || f.id === currentSong.id
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-zinc-950/95 backdrop-blur-2xl text-zinc-100 overflow-hidden animate-fade-in select-none">
        {/* Ambient Artwork Glow */}
        {currentSong.coverUrl && (
          <div
            className="fixed inset-0 pointer-events-none opacity-20 blur-3xl scale-125"
            style={{
              backgroundImage: `url(${currentSong.coverUrl})`,
              backgroundPosition: 'center',
              backgroundSize: 'cover',
            }}
          />
        )}

        {/* Master Container - Locked to 100% Viewport Height (Zero Overflow / No Scrolling) */}
        <div className="relative z-10 w-full max-w-md mx-auto h-full max-h-screen flex flex-col justify-between py-3.5 sm:py-5 px-5 sm:px-6 overflow-hidden">
          {/* 1. Top Navigation Bar */}
          <div className="w-full flex items-center justify-between shrink-0">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors border border-zinc-800/80 text-xs font-medium cursor-pointer"
              title="Collapse Player"
            >
              <ChevronDown className="w-4 h-4" />
              <span>Collapse</span>
            </button>

            <div className="text-center px-2">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400">
                Playing Solo
              </span>
              <p className="text-xs font-medium text-zinc-200 truncate max-w-[150px] sm:max-w-[200px]">
                {currentSong.album || currentSong.title}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPlaylistDialogOpen(true)}
                className="p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors border border-zinc-800/80 cursor-pointer"
                title="Add to Playlist"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  onClose();
                  setQueueOpen(true);
                }}
                className="p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors border border-zinc-800/80 cursor-pointer relative"
                title="View Queue"
              >
                <ListMusic className="w-4 h-4" />
                {queue.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-bold flex items-center justify-center">
                    {queue.length > 9 ? '9+' : queue.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* 2. Main Stage: Flexibly sized to fit any screen height without scrolling */}
          <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center my-auto py-1">
            {/* Auto-scaling Artwork: dynamically adapts height to available space */}
            <div className="flex-1 min-h-0 flex items-center justify-center w-full py-1 sm:py-2">
              <div className="h-full max-h-[220px] sm:max-h-[280px] md:max-h-[320px] aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800/80 shadow-2xl shrink-0 group relative">
                {currentSong.coverUrl ? (
                  <img
                    src={currentSong.coverUrl}
                    alt={currentSong.title}
                    className="w-full h-full object-cover select-none transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">
                    <Music className="w-12 h-12 sm:w-16 sm:h-16" />
                  </div>
                )}
              </div>
            </div>

            {/* Song Title & Like Button */}
            <div className="w-full flex items-center justify-between mt-2.5 sm:mt-4 gap-3 shrink-0">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight truncate">
                  {currentSong.title}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 font-medium truncate mt-0.5">
                  {currentSong.artist}
                </p>
              </div>

              <button
                onClick={() => toggleFav(currentSong.id, Boolean(isFavorited))}
                className={cn(
                  'p-2 sm:p-2.5 rounded-full transition-all cursor-pointer shrink-0',
                  isFavorited
                    ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                )}
                title={isFavorited ? 'Remove from Favorites' : 'Save to Favorites'}
              >
                <Heart className={cn('w-5 h-5 sm:w-6 sm:h-6', isFavorited && 'fill-current')} />
              </button>
            </div>

            {/* Timeline Progress Scrubber */}
            <div className="w-full mt-2.5 sm:mt-3.5 space-y-1 shrink-0">
              <ProgressSlider
                currentMs={playbackPositionMs}
                durationMs={durationMs}
                onSeek={onSeek}
              />
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 px-0.5">
                <span>{formatTime(playbackPositionMs, true)}</span>
                <span>{formatTime(durationMs, true)}</span>
              </div>
            </div>

            {/* 5 Playback Controls (Dedicated Hero Row - Zero Overlaps) */}
            <div className="w-full flex items-center justify-between px-2 mt-2.5 sm:mt-4 shrink-0">
              {/* Shuffle */}
              <button
                onClick={toggleShuffle}
                className={cn(
                  'p-2 rounded-full transition-colors cursor-pointer',
                  isShuffled
                    ? 'text-emerald-400 bg-emerald-950/40'
                    : 'text-zinc-400 hover:text-white'
                )}
                title={isShuffled ? 'Shuffle On' : 'Shuffle Off'}
              >
                <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Previous */}
              <button
                onClick={previous}
                className="p-2 text-zinc-300 hover:text-white transition-colors cursor-pointer active:scale-95"
                title="Previous Track"
              >
                <SkipBack className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              </button>

              {/* Play / Pause Hero Button */}
              <button
                onClick={togglePlay}
                className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-white text-zinc-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl font-bold cursor-pointer"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
                ) : (
                  <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current translate-x-0.5" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={next}
                className="p-2 text-zinc-300 hover:text-white transition-colors cursor-pointer active:scale-95"
                title="Next Track"
              >
                <SkipForward className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
              </button>

              {/* Repeat */}
              <button
                onClick={cycleRepeat}
                className={cn(
                  'p-2 rounded-full transition-colors cursor-pointer',
                  repeatMode !== 'off'
                    ? 'text-emerald-400 bg-emerald-950/40'
                    : 'text-zinc-400 hover:text-white'
                )}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
          </div>

          {/* 3. Bottom Utility Bar: Audio Wave Visualizer on Left, Volume on Right */}
          <div className="w-full flex items-center justify-between pt-3 sm:pt-4 border-t border-zinc-900/80 shrink-0">
            {/* Left: Synchronized Audio Wave Visualizer */}
            <div className="flex items-center">
              <AudioWaveEffect isPlaying={isPlaying} />
            </div>

            {/* Right: Volume Control */}
            <div className="flex items-center">
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

      {/* Add to Playlist Dialog */}
      <AddToPlaylistDialog
        isOpen={playlistDialogOpen}
        onClose={() => setPlaylistDialogOpen(false)}
        song={currentSong}
      />
    </>
  );
};

import { create } from 'zustand';
import type { Song } from '../types/song.types';

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  playbackPositionMs: number;
  durationMs: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  queue: Song[];
  history: Song[];
  originalQueue: Song[];
  isQueueOpen: boolean;

  // Actions
  playSong: (song: Song, contextQueue?: Song[]) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  seek: (positionMs: number) => void;
  next: () => void;
  previous: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (song: Song) => void;
  playNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setQueueOpen: (open: boolean) => void;
  updatePosition: (positionMs: number) => void;
  updateDuration: (durationMs: number) => void;
}

const getInitialVolume = (): number => {
  const saved = localStorage.getItem('rhythm_volume');
  if (saved !== null) {
    const parsed = parseFloat(saved);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) return parsed;
  }
  return 0.8;
};

function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  playbackPositionMs: 0,
  durationMs: 0,
  volume: getInitialVolume(),
  isMuted: false,
  repeatMode: 'off',
  isShuffled: false,
  queue: [],
  history: [],
  originalQueue: [],
  isQueueOpen: false,

  playSong: (song: Song, contextQueue?: Song[]) => {
    let nextQueue: Song[] = [];
    let origQueue: Song[] = [];

    if (contextQueue && contextQueue.length > 0) {
      origQueue = [...contextQueue];
      const songIndex = contextQueue.findIndex((s) => s.id === song.id);
      if (songIndex !== -1) {
        nextQueue = contextQueue.slice(songIndex + 1);
      } else {
        nextQueue = contextQueue.filter((s) => s.id !== song.id);
      }
    } else {
      nextQueue = get().queue.filter((s) => s.id !== song.id);
      origQueue = nextQueue;
    }

    const { isShuffled, currentSong, history } = get();
    const updatedHistory = currentSong && currentSong.id !== song.id ? [...history, currentSong] : history;

    set({
      currentSong: song,
      queue: isShuffled ? shuffleArray(nextQueue) : nextQueue,
      originalQueue: origQueue,
      history: updatedHistory,
      playbackPositionMs: 0,
      durationMs: song.durationMs || 0,
      isPlaying: true,
    });
  },

  togglePlay: () => {
    const { isPlaying, currentSong } = get();
    if (!currentSong) return;
    set({ isPlaying: !isPlaying });
  },

  pause: () => set({ isPlaying: false }),
  resume: () => {
    if (get().currentSong) set({ isPlaying: true });
  },

  seek: (positionMs: number) => {
    const clamped = Math.max(0, Math.min(positionMs, get().durationMs || positionMs));
    set({ playbackPositionMs: clamped });
  },

  next: () => {
    const { repeatMode, currentSong, queue, history, originalQueue, isShuffled } = get();

    if (!currentSong) return;

    // Repeat one track
    if (repeatMode === 'one') {
      set({ playbackPositionMs: 0, isPlaying: true });
      return;
    }

    // Has items in queue
    if (queue.length > 0) {
      const [nextSong, ...remainingQueue] = queue;
      set({
        currentSong: nextSong,
        queue: remainingQueue,
        history: [...history, currentSong],
        playbackPositionMs: 0,
        durationMs: nextSong.durationMs || 0,
        isPlaying: true,
      });
      return;
    }

    // Queue empty, but repeat all is active
    if (repeatMode === 'all' && originalQueue.length > 0) {
      const allTracks = isShuffled ? shuffleArray(originalQueue) : [...originalQueue];
      const [firstSong, ...rest] = allTracks;
      set({
        currentSong: firstSong,
        queue: rest,
        history: [currentSong],
        playbackPositionMs: 0,
        durationMs: firstSong.durationMs || 0,
        isPlaying: true,
      });
      return;
    }

    // End of playback
    set({ isPlaying: false, playbackPositionMs: 0 });
  },

  previous: () => {
    const { playbackPositionMs, history, queue, currentSong } = get();

    // If played more than 3 seconds, restart current track
    if (playbackPositionMs > 3000 || history.length === 0) {
      set({ playbackPositionMs: 0 });
      return;
    }

    // Otherwise go back to last track in history
    const prevSong = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    const newQueue = currentSong ? [currentSong, ...queue] : queue;

    set({
      currentSong: prevSong,
      history: newHistory,
      queue: newQueue,
      playbackPositionMs: 0,
      durationMs: prevSong.durationMs || 0,
      isPlaying: true,
    });
  },

  setVolume: (volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    localStorage.setItem('rhythm_volume', clamped.toString());
    set({ volume: clamped, isMuted: clamped === 0 });
  },

  toggleMute: () => {
    const { isMuted } = get();
    set({ isMuted: !isMuted });
  },

  toggleShuffle: () => {
    const { isShuffled, queue, originalQueue, currentSong } = get();
    if (!isShuffled) {
      // Turn shuffle on
      set({ isShuffled: true, queue: shuffleArray(queue) });
    } else {
      // Turn shuffle off: restore original order for unplayed tracks
      const currentId = currentSong?.id;
      const filtered = originalQueue.filter((s) => s.id !== currentId);
      set({ isShuffled: false, queue: filtered });
    }
  },

  cycleRepeat: () => {
    const { repeatMode } = get();
    const nextMode: RepeatMode =
      repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
    set({ repeatMode: nextMode });
  },

  addToQueue: (song: Song) => {
    const { queue } = get();
    set({ queue: [...queue, song] });
  },

  playNext: (song: Song) => {
    const { queue } = get();
    set({ queue: [song, ...queue] });
  },

  removeFromQueue: (index: number) => {
    const { queue } = get();
    const newQueue = queue.filter((_, i) => i !== index);
    set({ queue: newQueue });
  },

  clearQueue: () => set({ queue: [] }),

  setQueueOpen: (open: boolean) => set({ isQueueOpen: open }),

  updatePosition: (positionMs: number) => set({ playbackPositionMs: positionMs }),

  updateDuration: (durationMs: number) => set({ durationMs }),
}));

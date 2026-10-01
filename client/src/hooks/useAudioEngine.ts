import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { useRoomStore } from '../store/roomStore';
import { songService } from '../services/song.service';
import { toast } from '../components/ui/Toast';

/**
 * useAudioEngine — Solo (non-room) audio playback via HTML <audio>.
 * All songs come from JioSaavn as direct AAC URLs, so no YouTube player is needed.
 */
export function useAudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playRecordedRef = useRef<string | null>(null);
  const lastSongIdRef = useRef<string | null>(null);
  const isInRoom = useRoomStore((s) => s.isInRoom);

  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    updatePosition,
    updateDuration,
    pause,
    next,
  } = usePlayerStore();

  // ── Initialize <audio> element ────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        updateDuration(Math.floor(audio.duration * 1000));
      }
    };

    const handleTimeUpdate = () => {
      const positionMs = Math.floor(audio.currentTime * 1000);
      updatePosition(positionMs);

      // Record play after 15s or 50% of track
      const currentTrack = usePlayerStore.getState().currentSong;
      if (
        currentTrack &&
        playRecordedRef.current !== currentTrack.id &&
        (audio.currentTime >= 15 ||
          (audio.duration && audio.currentTime >= audio.duration * 0.5))
      ) {
        playRecordedRef.current = currentTrack.id;
        songService.recordPlay(currentTrack.id).catch(() => {});
      }
    };

    const handleEnded = () => next();

    const handleError = () => {
      if (audio.getAttribute('src') && audio.error) {
        console.error('Audio playback error:', audio.error);
        toast.error('Unable to play this track. Moving to next...');
        pause();
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = null;
    };
  }, [updateDuration, updatePosition, pause, next]);

  // ── Handle song changes ───────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentSong) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      lastSongIdRef.current = null;
      return;
    }

    if (lastSongIdRef.current !== currentSong.id) {
      lastSongIdRef.current = currentSong.id;
      playRecordedRef.current = null;

      audio.src = currentSong.audioUrl;
      audio.currentTime = 0;

      if (isPlaying) {
        audio.play().catch((err) => {
          console.warn('Autoplay prevented:', err);
          pause();
        });
      }
    }
  }, [currentSong, isPlaying, pause]);

  // ── Stop solo audio when user enters a room ───────────────────────────────
  useEffect(() => {
    if (isInRoom && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, [isInRoom]);

  // ── Play / Pause ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (isInRoom) return;
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (isPlaying && audio.paused) {
      audio.play().catch((err) => {
        console.warn('Play failed:', err);
        pause();
      });
    } else if (!isPlaying && !audio.paused) {
      audio.pause();
    }
  }, [isPlaying, currentSong, pause, isInRoom]);

  // ── Volume / Mute ─────────────────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, isMuted ? 0 : volume));
      audio.muted = isMuted;
    }
  }, [volume, isMuted]);

  // ── Seek ──────────────────────────────────────────────────────────────────
  const seekTo = useCallback(
    (positionMs: number) => {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = positionMs / 1000;
        updatePosition(positionMs);
      }
    },
    [updatePosition]
  );

  return { seekTo };
}

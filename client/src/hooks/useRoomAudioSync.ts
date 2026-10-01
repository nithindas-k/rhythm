import { useEffect, useRef, useState, useCallback } from 'react';
import { useRoomStore } from '../store/roomStore';
import { socketService } from '../services/socket.service';
import { SOCKET_EVENTS } from '../constants/socketEvents';
import { SYNC_CONSTANTS } from '../constants/sync.constants';
import { songService } from '../services/song.service';
import { engineManager } from '../engines/engineManager';
import { ClockSync } from '../utils/clockSync';
import type { Song } from '../types/song.types';

export function useRoomAudioSync(roomCode: string) {
  const engineRef = useRef(engineManager.getAudioFileEngine());
  const scheduledTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clockOffsetRef = useRef(0);
  const lastPlaybackVersionRef = useRef<number>(-1);
  const lastDriftSeekRef = useRef<number>(0);
  const isBufferingReportedRef = useRef(false);

  const [currentPositionMs, setCurrentPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [localVolume, setLocalVolume] = useState(() => {
    const saved = localStorage.getItem('rhythm_room_volume');
    return saved !== null ? parseFloat(saved) : 0.8;
  });
  const [isLocalMuted, setIsLocalMuted] = useState(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);

  const {
    playbackState,
    currentSong,
    clockOffsetMs,
    canControl,
    waitingForMember,
    setCurrentSong,
    setClockOffset,
    setAudioGateLocked,
  } = useRoomStore();

  // ── 1. Clock Sync ─────────────────────────────────────────────────────────
  useEffect(() => {
    const clockSync = new ClockSync((offsetMs, latencyMs) => {
      setClockOffset(offsetMs, latencyMs);
      clockOffsetRef.current = offsetMs;
    });
    clockSync.start();
    return () => clockSync.stop();
  }, [setClockOffset]);

  useEffect(() => {
    clockOffsetRef.current = clockOffsetMs;
  }, [clockOffsetMs]);

  // ── 2. Initialize Audio Engine & Global Callbacks ─────────────────────────
  useEffect(() => {
    const engine = engineRef.current;

    engine.init('', {
      onBuffering: (isBuffering) => {
        const state = useRoomStore.getState().playbackState;
        // Only report buffering if room is actively playing and engine is already initialized
        if (!state?.isPlaying) return;
        if (!engine.isReady() && isBuffering) return;

        if (isBufferingReportedRef.current !== isBuffering) {
          isBufferingReportedRef.current = isBuffering;
          const version = state.version ?? 0;
          socketService.getSocket()?.emit(SOCKET_EVENTS.BUFFERING_STATE, {
            roomCode,
            isBuffering,
            version,
          });
        }
      },
      onError: (error) => {
        console.error('[AudioEngine] Playback error:', error);
      },
      onDurationChange: (durMs) => {
        if (durMs > 0) setDurationMs(durMs);
      },
      onTimeUpdate: (posMs) => {
        setCurrentPositionMs(posMs);
      },
    });

    return () => {
      if (scheduledTimerRef.current) clearTimeout(scheduledTimerRef.current);
      engine.pause();
    };
  }, [roomCode]);

  // ── 3. Local Volume & Mute ────────────────────────────────────────────────
  useEffect(() => {
    const engine = engineRef.current;
    const vol = isLocalMuted ? 0 : localVolume * 100;
    engine.setVolume(vol);
    if (isLocalMuted) engine.mute(); else engine.unMute();
    localStorage.setItem('rhythm_room_volume', localVolume.toString());
  }, [localVolume, isLocalMuted]);

  // ── 4. Ready Barrier: SYNC_LOAD → cue paused → SYNC_READY ────────────────
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleSyncLoad = async (data: {
      roomCode: string;
      trackId: string;
      positionMs: number;
      version: number;
    }) => {
      if (data.version <= lastPlaybackVersionRef.current) return;
      lastPlaybackVersionRef.current = data.version;

      // 1. Fetch song metadata if not already loaded
      let song: Song | null = useRoomStore.getState().currentSong;
      if (song?.id !== data.trackId) {
        try {
          song = await songService.getById(data.trackId);
          setCurrentSong(song);
        } catch (err) {
          console.error('Failed to load song on SYNC_LOAD:', err);
          return;
        }
      }

      // 2. Cue audio at the start position (paused)
      await engineRef.current.cue(data.trackId, data.positionMs, song?.audioUrl);

      // 3. Tell the server we are ready
      socket.emit(SOCKET_EVENTS.SYNC_READY, {
        roomCode,
        trackId: data.trackId,
        version: data.version,
      });
    };

  
    const handleSyncStart = async (data: {
      trackId: string;
      positionMs: number;
      scheduledAt: number;
      version: number;
    }) => {
      if (data.version <= lastPlaybackVersionRef.current) return;
      lastPlaybackVersionRef.current = data.version;

      let song = useRoomStore.getState().currentSong;
      if (!song || song.id !== data.trackId) {
        try {
          song = await songService.getById(data.trackId);
          setCurrentSong(song);
        } catch {
          // ignore — engine will still try to play
        }
      }

      await engineRef.current.cue(data.trackId, data.positionMs, song?.audioUrl);

      if (scheduledTimerRef.current) {
        clearTimeout(scheduledTimerRef.current);
        scheduledTimerRef.current = null;
      }

      const serverNow = Date.now() + clockOffsetRef.current;
      const delayMs = data.scheduledAt - serverNow;

      if (delayMs > 0) {
        engineRef.current.seekTo(data.positionMs);
        scheduledTimerRef.current = setTimeout(async () => {
          try {
            await engineRef.current.play();
          } catch {
            setNeedsUserInteraction(true);
            setAudioGateLocked(true);
          }
        }, delayMs);
      } else {
        const catchupPos = data.positionMs + Math.abs(delayMs);
        engineRef.current.seekTo(catchupPos);
        try {
          await engineRef.current.play();
        } catch {
          setNeedsUserInteraction(true);
          setAudioGateLocked(true);
        }
      }
    };

    socket.on(SOCKET_EVENTS.SYNC_LOAD, handleSyncLoad);
    socket.on(SOCKET_EVENTS.SYNC_START, handleSyncStart);

    return () => {
      socket.off(SOCKET_EVENTS.SYNC_LOAD, handleSyncLoad);
      socket.off(SOCKET_EVENTS.SYNC_START, handleSyncStart);
    };
  }, [roomCode, setCurrentSong, setAudioGateLocked]);

  // ── 6. Authoritative State (Pause / Seek / Join in Progress) ───────────────
  useEffect(() => {
    if (!playbackState) return;
    if (playbackState.version < lastPlaybackVersionRef.current) return;
    lastPlaybackVersionRef.current = playbackState.version;

    const engine = engineRef.current;
    if (!engine) return;

    if (!playbackState.isPlaying) {
      if (scheduledTimerRef.current) {
        clearTimeout(scheduledTimerRef.current);
        scheduledTimerRef.current = null;
      }
      engine.pause();
      const currentPos = engine.getCurrentPositionMs();
      if (Math.abs(currentPos - playbackState.positionMs) > 1000) {
        engine.seekTo(playbackState.positionMs);
      }
      setCurrentPositionMs(playbackState.positionMs);
    } else {
      const trackId = playbackState.trackId;
      if (!trackId) return;

      const syncAndPlay = async (song: Song) => {
        // Calculate exact real-time playback position accounting for elapsed time
        const serverNow = Date.now() + clockOffsetRef.current;
        const elapsedMs = Math.max(0, serverNow - (playbackState.serverTimestamp || Date.now()));
        const targetPos = playbackState.positionMs + elapsedMs;

        await engine.cue(trackId, targetPos, song.audioUrl);
        engine.seekTo(targetPos);

        try {
          await engine.play();
        } catch {
          setNeedsUserInteraction(true);
          setAudioGateLocked(true);
        }
      };

      const currentLoadedSong = useRoomStore.getState().currentSong;
      if (!currentLoadedSong || currentLoadedSong.id !== trackId) {
        songService
          .getById(trackId)
          .then((song) => {
            setCurrentSong(song);
            syncAndPlay(song);
          })
          .catch((err) => {
            console.error('Failed to load track on authoritative state update:', err);
          });
      } else {
        if (!engine.isPlaying()) {
          syncAndPlay(currentLoadedSong);
        }
      }
    }
  }, [playbackState, currentSong, setAudioGateLocked, setCurrentSong]);

  // ── 7. Drift Correction (every 5s) ────────────────────────────────────────
  useEffect(() => {
    if (!playbackState?.isPlaying || !playbackState.scheduledAt) return;

    const driftInterval = setInterval(() => {
      const engine = engineRef.current;
      if (!engine || engine.isBuffering()) return;

      const serverNow = Date.now() + clockOffsetRef.current;
      const elapsedMs = serverNow - playbackState.scheduledAt!;
      const expectedMs = playbackState.positionMs + elapsedMs;
      const actualMs = engine.getCurrentPositionMs();
      const drift = Math.abs(actualMs - expectedMs);

      if (drift < SYNC_CONSTANTS.DRIFT_IGNORE_MS) {
        if (drift < SYNC_CONSTANTS.DRIFT_RESTORE_RATE_MS) {
          engine.setPlaybackRate(SYNC_CONSTANTS.NORMAL_PLAYBACK_RATE);
        }
        return;
      }

      if (drift <= SYNC_CONSTANTS.DRIFT_SEEK_THRESHOLD_MS) {
        engine.setPlaybackRate(
          actualMs < expectedMs
            ? SYNC_CONSTANTS.NUDGE_RATE_FASTER
            : SYNC_CONSTANTS.NUDGE_RATE_SLOWER
        );
        return;
      }

      const now = Date.now();
      if (now - lastDriftSeekRef.current >= SYNC_CONSTANTS.DRIFT_SEEK_COOLDOWN_MS) {
        lastDriftSeekRef.current = now;
        engine.seekTo(expectedMs);
        engine.setPlaybackRate(SYNC_CONSTANTS.NORMAL_PLAYBACK_RATE);
      }
    }, SYNC_CONSTANTS.DRIFT_CHECK_INTERVAL_MS);

    return () => clearInterval(driftInterval);
  }, [playbackState?.isPlaying, playbackState?.scheduledAt, playbackState?.positionMs]);

  // ── 8. Unlock Audio Gate ──────────────────────────────────────────────────
  const handleUnlockAudio = useCallback(async () => {
    const engine = engineRef.current;
    if (engine) {
      engine.unMute();
      try { await engine.play(); } catch { /* ignore */ }
    }
    setNeedsUserInteraction(false);
    setAudioGateLocked(false);
  }, [setAudioGateLocked]);

  // ── 9. Playback Controls ──────────────────────────────────────────────────
  const handlePlay = useCallback(() => {
    if (!canControl || !playbackState?.trackId) return;
    socketService.play(roomCode, playbackState.trackId, currentPositionMs);
  }, [canControl, playbackState?.trackId, roomCode, currentPositionMs]);

  const handlePause = useCallback(() => {
    if (!canControl) return;
    socketService.pause(roomCode, currentPositionMs);
  }, [canControl, roomCode, currentPositionMs]);

  const handleSeek = useCallback(
    (positionMs: number) => {
      if (!canControl) return;
      socketService.seek(roomCode, positionMs);
    },
    [canControl, roomCode]
  );

  const togglePlay = useCallback(() => {
    if (playbackState?.isPlaying) handlePause(); else handlePlay();
  }, [playbackState?.isPlaying, handlePause, handlePlay]);

  const toggleLocalMute = useCallback(() => {
    setIsLocalMuted((prev) => !prev);
  }, []);

  return {
    currentPositionMs,
    durationMs,
    localVolume,
    setLocalVolume,
    isLocalMuted,
    toggleLocalMute,
    togglePlay,
    handleSeek,
    handleUnlockAudio,
    needsUserInteraction,
    waitingForMember,
    canControl,
    isPlaying: playbackState?.isPlaying ?? false,
    // JioSaavn songs are always audio-file — never YouTube
    isYouTubeTrack: false,
  };
}

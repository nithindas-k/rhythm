import type { PlaybackEngine, PlaybackEngineEvents } from './types';

export class AudioFilePlaybackEngine implements PlaybackEngine {
  readonly id = 'audio-file' as const;

  private audio: HTMLAudioElement | null = null;
  private events: PlaybackEngineEvents = {};
  private buffering = false;
  private currentPlaybackRate = 1.0;

  async init(_containerId: string, events: PlaybackEngineEvents): Promise<void> {
    this.events = events;

    if (!this.audio) {
      const audio = new Audio();
      audio.preload = 'auto';

      audio.addEventListener('loadedmetadata', () => {
        if (audio.duration && !isNaN(audio.duration)) {
          this.events.onDurationChange?.(Math.floor(audio.duration * 1000));
        }
      });

      audio.addEventListener('canplay', () => {
        this.buffering = false;
        this.events.onBuffering?.(false);
        this.events.onReady?.();
      });

      audio.addEventListener('waiting', () => {
        this.buffering = true;
        this.events.onBuffering?.(true);
      });

      audio.addEventListener('playing', () => {
        this.buffering = false;
        this.events.onBuffering?.(false);
        this.events.onStateChange?.(true);
      });

      audio.addEventListener('pause', () => {
        this.events.onStateChange?.(false);
      });

      audio.addEventListener('ended', () => {
        this.buffering = false;
        this.events.onEnded?.();
      });

      audio.addEventListener('timeupdate', () => {
        this.events.onTimeUpdate?.(Math.floor(audio.currentTime * 1000));
      });

      audio.addEventListener('error', () => {
        this.events.onError?.({
          code: audio.error?.code || 4,
          message: audio.error?.message || 'Audio file decode error',
          isEmbedError: false,
        });
      });

      this.audio = audio;
    }
  }

  async cue(_trackId: string, positionMs: number, trackUrl?: string): Promise<void> {
    if (!this.audio || !trackUrl) return;

    if (this.audio.src !== trackUrl) {
      this.audio.src = trackUrl;
    }
    this.audio.currentTime = positionMs / 1000;
    this.audio.pause();
    this.events.onReady?.();
  }

  async play(): Promise<void> {
    if (!this.audio) return;
    try {
      await this.audio.play();
    } catch (err) {
      console.warn('[AudioFilePlaybackEngine] play prevented:', err);
    }
  }

  pause(): void {
    if (this.audio && !this.audio.paused) {
      this.audio.pause();
    }
  }

  seekTo(positionMs: number): void {
    if (this.audio) {
      this.audio.currentTime = positionMs / 1000;
    }
  }

  setPlaybackRate(rate: number): void {
    if (this.currentPlaybackRate === rate) return;
    this.currentPlaybackRate = rate;
    if (this.audio) {
      this.audio.playbackRate = rate;
    }
  }

  setVolume(volumePercent: number): void {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volumePercent / 100));
    }
  }

  mute(): void {
    if (this.audio) {
      this.audio.muted = true;
    }
  }

  unMute(): void {
    if (this.audio) {
      this.audio.muted = false;
    }
  }

  getCurrentPositionMs(): number {
    return this.audio ? Math.floor(this.audio.currentTime * 1000) : 0;
  }

  getDurationMs(): number {
    return this.audio && !isNaN(this.audio.duration) ? Math.floor(this.audio.duration * 1000) : 0;
  }

  isBuffering(): boolean {
    return this.buffering;
  }

  isPlaying(): boolean {
    return this.audio ? !this.audio.paused : false;
  }

  isReady(): boolean {
    return Boolean(this.audio && this.audio.readyState >= 2);
  }

  destroy(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.removeAttribute('src');
      this.audio.load();
      this.audio = null;
    }
  }
}

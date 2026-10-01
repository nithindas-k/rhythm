export interface PlaybackEngineEvents {
  onReady?: () => void;
  onStateChange?: (isPlaying: boolean) => void;
  onBuffering?: (isBuffering: boolean) => void;
  onError?: (error: { code: number; message: string; isEmbedError?: boolean }) => void;
  onTimeUpdate?: (positionMs: number) => void;
  onDurationChange?: (durationMs: number) => void;
  onEnded?: () => void;
}

export interface PlaybackEngine {
  readonly id: 'audio-file';
  init(containerId: string, events: PlaybackEngineEvents): Promise<void>;
  cue(trackId: string, positionMs: number, trackUrl?: string): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  seekTo(positionMs: number): void;
  setPlaybackRate(rate: number): void;
  setVolume(volumePercent: number): void;
  mute(): void;
  unMute(): void;
  getCurrentPositionMs(): number;
  getDurationMs(): number;
  isBuffering(): boolean;
  isPlaying(): boolean;
  isReady(): boolean;
  destroy(): void;
}

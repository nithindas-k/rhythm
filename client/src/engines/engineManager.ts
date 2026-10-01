import type { PlaybackEngine } from './types';
import { AudioFilePlaybackEngine } from './AudioFilePlaybackEngine';
import type { Song } from '../types/song.types';

/**
 * EngineManager — since all audio comes from JioSaavn as direct AAC URLs,
 * we only need the AudioFilePlaybackEngine (HTML <audio>).
 * The YouTube engine has been removed.
 */
class EngineManager {
  private audioFileEngine: AudioFilePlaybackEngine;

  constructor() {
    this.audioFileEngine = new AudioFilePlaybackEngine();
  }

  getAudioFileEngine(): AudioFilePlaybackEngine {
    return this.audioFileEngine;
  }

  /** Always returns the audio file engine — JioSaavn tracks are all direct audio URLs. */
  getEngineForSong(_song: Song | null): PlaybackEngine {
    return this.audioFileEngine;
  }

  /** JioSaavn songs are never YouTube; always returns false. */
  isYouTubeSong(_song: Song | null): boolean {
    return false;
  }
}

export const engineManager = new EngineManager();

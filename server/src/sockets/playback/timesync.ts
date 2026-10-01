export class TimeSyncHelper {
  /**
   * Default audio start buffer (in ms) to allow network propagation before play starts.
   */
  static readonly PLAY_LEAD_BUFFER_MS = 250;

  /**
   * Calculate scheduled start timestamp so all participants trigger playback concurrently.
   */
  static calculateScheduledStart(): number {
    return Date.now() + this.PLAY_LEAD_BUFFER_MS;
  }

  /**
   * Calculate client clock offset given clientTs and network roundtrip estimation.
   */
  static handlePing(clientTs: number): { clientTs: number; serverTs: number } {
    return {
      clientTs,
      serverTs: Date.now(),
    };
  }
}

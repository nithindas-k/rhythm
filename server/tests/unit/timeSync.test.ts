import { describe, it, expect } from 'vitest';
import { TimeSyncHelper } from '../../src/sockets/playback/timesync';

describe('TimeSyncHelper', () => {
  it('should calculate scheduled start with default 250ms lead buffer', () => {
    const before = Date.now();
    const scheduled = TimeSyncHelper.calculateScheduledStart();
    const after = Date.now();

    expect(scheduled).toBeGreaterThanOrEqual(before + TimeSyncHelper.PLAY_LEAD_BUFFER_MS);
    expect(scheduled).toBeLessThanOrEqual(after + TimeSyncHelper.PLAY_LEAD_BUFFER_MS);
  });

  it('should respond to ping preserving clientTs and attaching serverTs', () => {
    const clientTs = 1680000000000;
    const result = TimeSyncHelper.handlePing(clientTs);

    expect(result.clientTs).toBe(clientTs);
    expect(typeof result.serverTs).toBe('number');
    expect(result.serverTs).toBeGreaterThan(0);
  });
});

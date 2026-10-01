import { socketService } from '../services/socket.service';
import { SOCKET_EVENTS } from '../constants/socketEvents';
import { SYNC_CONSTANTS } from '../constants/sync.constants';

interface PingSample {
  roundTrip: number;
  offset: number;
}

export class ClockSync {
  private samples: PingSample[] = [];
  private onCalibrated: (offsetMs: number, latencyMs: number) => void;
  private isCollecting = false;
  private intervalTimer: ReturnType<typeof setInterval> | null = null;

  constructor(onCalibrated: (offsetMs: number, latencyMs: number) => void) {
    this.onCalibrated = onCalibrated;
  }

  start(): void {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handlePong = (data: { clientTs: number; serverTs: number }) => {
      const now = Date.now();
      const roundTrip = Math.max(0, now - data.clientTs);
      const estimatedServerNow = data.serverTs + roundTrip / 2;
      const offset = Math.round(estimatedServerNow - now);

      this.samples.push({ roundTrip, offset });

      if (this.samples.length >= SYNC_CONSTANTS.PING_SAMPLE_COUNT) {
        this.computeMedianOffset();
        this.samples = [];
        this.isCollecting = false;
      }
    };

    socket.on(SOCKET_EVENTS.SYNC_PONG, handlePong);

    // Initial multi-ping burst
    this.collectBurst();

    // Periodic recalibration every 15s
    this.intervalTimer = setInterval(() => {
      this.collectBurst();
    }, SYNC_CONSTANTS.PING_INTERVAL_MS);

    this.cleanup = () => {
      socket.off(SOCKET_EVENTS.SYNC_PONG, handlePong);
      if (this.intervalTimer) clearInterval(this.intervalTimer);
    };
  }

  private collectBurst(): void {
    if (this.isCollecting) return;
    this.isCollecting = true;
    this.samples = [];

    // Send 8 rapid pings spaced 60ms apart to sample network jitter
    for (let i = 0; i < SYNC_CONSTANTS.PING_SAMPLE_COUNT; i++) {
      setTimeout(() => {
        socketService.pingSync();
      }, i * 60);
    }
  }

  private computeMedianOffset(): void {
    if (this.samples.length === 0) return;

    // 1. Sort samples by lowest RTT (lowest network latency)
    const sortedByRtt = [...this.samples].sort((a, b) => a.roundTrip - b.roundTrip);

    // 2. Select top 50% lowest-RTT samples
    const bestCount = Math.max(1, Math.ceil(sortedByRtt.length / 2));
    const bestSamples = sortedByRtt.slice(0, bestCount);

    // 3. Sort their offsets to find the median
    const sortedOffsets = bestSamples.map((s) => s.offset).sort((a, b) => a - b);
    const midIndex = Math.floor(sortedOffsets.length / 2);
    const medianOffset =
      sortedOffsets.length % 2 !== 0
        ? sortedOffsets[midIndex]
        : Math.round((sortedOffsets[midIndex - 1] + sortedOffsets[midIndex]) / 2);

    const lowestRtt = bestSamples[0].roundTrip;
    this.onCalibrated(medianOffset, Math.round(lowestRtt / 2));
  }

  private cleanup: () => void = () => {};

  stop(): void {
    this.cleanup();
  }
}

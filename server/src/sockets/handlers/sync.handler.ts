import { Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../../constants/socketEvents';
import { socketSyncPingSchema } from '../../validators/room.validator';
import { TimeSyncHelper } from '../playback/timesync';

export function registerSyncHandlers(socket: Socket): void {
  socket.on(SOCKET_EVENTS.SYNC_PING, (data: unknown) => {
    const parsed = socketSyncPingSchema.safeParse(data);
    if (!parsed.success) return;

    const response = TimeSyncHelper.handlePing(parsed.data.clientTs);
    socket.emit(SOCKET_EVENTS.SYNC_PONG, response);
  });
}

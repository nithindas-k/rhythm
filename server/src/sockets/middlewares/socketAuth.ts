import { Socket } from 'socket.io';
import { verifyAccessToken } from '../../utils/tokenHelper';
import { logger } from '../../utils/logger';

export interface AuthenticatedSocket extends Socket {
  data: {
    user: {
      id: string;
      role: string;
    };
  };
}

export function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void
): void {
  try {
    const rawToken: string | undefined =
      socket.handshake.auth?.token || socket.handshake.headers.authorization;

    if (!rawToken) {
      return next(new Error('Authentication required'));
    }

    const token = rawToken.startsWith('Bearer ') ? rawToken.slice(7).trim() : rawToken.trim();

    const payload = verifyAccessToken(token);
    socket.data.user = {
      id: payload.sub,
      role: payload.role,
    };

    next();
  } catch (err) {
    logger.debug({ err }, 'Socket handshake authentication failed');
    next(new Error('Invalid or expired authentication token'));
  }
}

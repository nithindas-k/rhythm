import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokenHelper';
import { getRedisClient } from '../config/redis';
import { CACHE_KEYS } from '../constants/cacheKeys';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import { MESSAGES } from '../constants/messages';
import { UserRole } from '../constants/roles';

/**
 * Extracts the Bearer token from the Authorization header, verifies it,
 * checks it hasn't been revoked (Redis blocklist), and populates req.user.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError(MESSAGES.UNAUTHORIZED));
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);

    // Check blocklist (token revoked on logout before expiry)
    const redis = getRedisClient();
    const isRevoked = await redis.exists(CACHE_KEYS.TOKEN_BLOCKLIST(payload.jti));
    if (isRevoked) {
      return next(new UnauthorizedError(MESSAGES.AUTH.INVALID_TOKEN));
    }

    req.user = {
      id: payload.sub,
      role: payload.role as UserRole,
      jti: payload.jti,
    };

    next();
  } catch (err) {
    next(err);
  }
}

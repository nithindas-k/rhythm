import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../errors/UnauthorizedError';
import { MESSAGES } from '../constants/messages';

export interface AccessTokenPayload {
  sub: string;        // userId
  role: string;
  jti: string;        // unique token ID (for blocklist)
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  iat?: number;
  exp?: number;
}

/**
 * Signs a short-lived JWT access token.
 */
export function signAccessToken(userId: string, role: string): string {
  const payload: Omit<AccessTokenPayload, 'iat' | 'exp'> = {
    sub: userId,
    role,
    jti: crypto.randomUUID(),
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Signs a long-lived JWT refresh token.
 */
export function signRefreshToken(userId: string): string {
  const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
    sub: userId,
    jti: crypto.randomUUID(),
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Verifies an access token and returns its payload.
 * Throws UnauthorizedError if invalid or expired.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch {
    throw new UnauthorizedError(MESSAGES.AUTH.INVALID_TOKEN);
  }
}

/**
 * Verifies a refresh token and returns its payload.
 * Throws UnauthorizedError if invalid or expired.
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch {
    throw new UnauthorizedError(MESSAGES.AUTH.INVALID_TOKEN);
  }
}

/**
 * Returns a SHA-256 hash of the given token (for safe Redis storage).
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

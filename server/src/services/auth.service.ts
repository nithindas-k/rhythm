import { injectable, inject } from 'tsyringe';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';

import { IAuthService } from './interfaces/IAuthService';
import { IUserRepository } from '../repositories/interfaces/IUserRepository';
import { TOKENS } from '../container/tokens';
import { AuthResponseDto } from '../dtos/auth/auth.dto';
import { toUserDto } from '../mappers/user.mapper';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../utils/tokenHelper';
import { getRedisClient } from '../config/redis';
import { CACHE_KEYS } from '../constants/cacheKeys';
import { TTL, REFRESH_TOKEN } from '../constants/limits';
import { MESSAGES } from '../constants/messages';
import { env } from '../config/env';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from '../errors/index';
import { RegisterDto, LoginDto, GoogleAuthDto } from '../validators/auth.validator';

const BCRYPT_SALT_ROUNDS = 12;

@injectable()
export class AuthService implements IAuthService {
  private googleClient: OAuth2Client;

  constructor(
    @inject(TOKENS.UserRepository) private userRepository: IUserRepository
  ) {
    this.googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  }

  // ── Register ──────────────────────────────────────────────────────────────

  async register(
    dto: RegisterDto
  ): Promise<AuthResponseDto & { refreshToken: string }> {
    const [existingEmail, existingUsername] = await Promise.all([
      this.userRepository.findByEmail(dto.email),
      this.userRepository.findByUsername(dto.username),
    ]);

    if (existingEmail) throw new ConflictError(MESSAGES.AUTH.EMAIL_TAKEN);
    if (existingUsername) throw new ConflictError(MESSAGES.AUTH.USERNAME_TAKEN);

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = await this.userRepository.create({
      username: dto.username,
      email: dto.email.toLowerCase(),
      passwordHash,
    });

    return this.buildAuthResponse(user._id.toString(), user.role, user as Parameters<typeof toUserDto>[0]);
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  async login(
    dto: LoginDto
  ): Promise<AuthResponseDto & { refreshToken: string }> {
    const user = await this.userRepository.findByIdentifierWithPassword(dto.identifier);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError(MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    return this.buildAuthResponse(user._id.toString(), user.role, user as Parameters<typeof toUserDto>[0]);
  }

  // ── Google OAuth ──────────────────────────────────────────────────────────

  async googleAuth(
    dto: GoogleAuthDto
  ): Promise<AuthResponseDto & { refreshToken: string }> {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new UnauthorizedError(MESSAGES.AUTH.GOOGLE_AUTH_FAILED);
    }

    let googlePayload: { sub?: string; email?: string; name?: string; picture?: string };
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.idToken,
        audience: env.GOOGLE_CLIENT_ID,
      });
      googlePayload = ticket.getPayload() ?? {};
    } catch {
      throw new UnauthorizedError(MESSAGES.AUTH.GOOGLE_AUTH_FAILED);
    }

    const { sub: googleId, email, name, picture } = googlePayload;
    if (!googleId || !email) {
      throw new UnauthorizedError(MESSAGES.AUTH.GOOGLE_AUTH_FAILED);
    }

    // Find existing user by Google ID or email
    let user = await this.userRepository.findByGoogleId(googleId);

    if (!user) {
      user = await this.userRepository.findByEmail(email);
      if (user) {
        // Link Google ID to existing account
        user = (await this.userRepository.updateById(user._id.toString(), {
          googleId,
          avatarUrl: user.avatarUrl ?? picture,
        }))!;
      } else {
        // Create brand-new account from Google profile
        const baseUsername = (name ?? email.split('@')[0])
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9_]/g, '')
          .slice(0, 25);

        const username = await this.uniqueUsername(baseUsername);

        user = await this.userRepository.create({
          username,
          email: email.toLowerCase(),
          googleId,
          avatarUrl: picture,
        });
      }
    }

    return this.buildAuthResponse(user._id.toString(), user.role, user as Parameters<typeof toUserDto>[0]);
  }

  // ── Refresh ───────────────────────────────────────────────────────────────

  async refresh(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = verifyRefreshToken(refreshToken);
    const hash = hashToken(refreshToken);

    const hasToken = await this.userRepository.hasRefreshTokenHash(payload.sub, hash);
    if (!hasToken) {
      throw new UnauthorizedError(MESSAGES.AUTH.INVALID_TOKEN);
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) throw new NotFoundError(MESSAGES.USER.NOT_FOUND);

    // Rotate: revoke old token, issue new ones
    await this.userRepository.removeRefreshTokenHash(payload.sub, hash);

    const newAccessToken = signAccessToken(user._id.toString(), user.role);
    const newRefreshToken = signRefreshToken(user._id.toString());
    const newHash = hashToken(newRefreshToken);

    await this.userRepository.addRefreshTokenHash(
      user._id.toString(),
      newHash,
      REFRESH_TOKEN.MAX_PER_USER
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  async logout(userId: string, refreshToken: string, jti: string): Promise<void> {
    const hash = hashToken(refreshToken);
    const redis = getRedisClient();

    await Promise.all([
      // Revoke refresh token
      this.userRepository.removeRefreshTokenHash(userId, hash),
      // Blocklist access token JTI for its remaining TTL
      redis.setex(
        CACHE_KEYS.TOKEN_BLOCKLIST(jti),
        TTL.ACCESS_TOKEN_BLOCKLIST,
        '1'
      ),
    ]);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async buildAuthResponse(
    userId: string,
    role: string,
    user: Parameters<typeof toUserDto>[0]
  ): Promise<AuthResponseDto & { refreshToken: string }> {
    const accessToken = signAccessToken(userId, role);
    const refreshToken = signRefreshToken(userId);
    const hash = hashToken(refreshToken);

    await this.userRepository.addRefreshTokenHash(
      userId,
      hash,
      REFRESH_TOKEN.MAX_PER_USER
    );

    return {
      user: toUserDto(user),
      accessToken,
      refreshToken,
    };
  }

  private async uniqueUsername(base: string): Promise<string> {
    let candidate = base;
    let suffix = 1;
    while (await this.userRepository.findByUsername(candidate)) {
      candidate = `${base}_${suffix++}`;
    }
    return candidate;
  }
}

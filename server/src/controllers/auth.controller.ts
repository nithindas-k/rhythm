import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { IAuthController } from './interfaces/IAuthController';
import { IAuthService } from '../services/interfaces/IAuthService';
import { TOKENS } from '../container/tokens';
import { sendSuccess, sendCreated } from '../utils/responseHelper';
import { MESSAGES } from '../constants/messages';
import { UnauthorizedError } from '../errors/index';
import { RegisterDto, LoginDto, GoogleAuthDto } from '../validators/auth.validator';
import { env } from '../config/env';

const REFRESH_COOKIE = 'refreshToken';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/api/v1/auth',
};

@injectable()
export class AuthController implements IAuthController {
  constructor(
    @inject(TOKENS.AuthService) private authService: IAuthService
  ) {}

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as RegisterDto;
      const result = await this.authService.register(dto);

      res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);

      sendCreated(
        res,
        { user: result.user, accessToken: result.accessToken },
        MESSAGES.AUTH.REGISTERED
      );
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as LoginDto;
      const result = await this.authService.login(dto);

      res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);

      sendSuccess(
        res,
        { user: result.user, accessToken: result.accessToken },
        MESSAGES.AUTH.LOGGED_IN
      );
    } catch (err) {
      next(err);
    }
  }

  async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as GoogleAuthDto;
      const result = await this.authService.googleAuth(dto);

      res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);

      sendSuccess(
        res,
        { user: result.user, accessToken: result.accessToken },
        MESSAGES.AUTH.LOGGED_IN
      );
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;

      if (!refreshToken) {
        return next(new UnauthorizedError(MESSAGES.AUTH.INVALID_TOKEN));
      }

      const result = await this.authService.refresh(refreshToken);

      // Rotate cookie with new refresh token
      res.cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTIONS);

      sendSuccess(
        res,
        { accessToken: result.accessToken },
        MESSAGES.AUTH.REFRESHED
      );
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;
      const userId = req.user!.id;
      const jti = req.user!.jti;

      if (refreshToken) {
        await this.authService.logout(userId, refreshToken, jti);
      }

      // Clear the cookie
      res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });

      sendSuccess(res, null, MESSAGES.AUTH.LOGGED_OUT);
    } catch (err) {
      next(err);
    }
  }
}

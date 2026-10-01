import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { IUserService } from '../services/interfaces/IUserService';
import { TOKENS } from '../container/tokens';
import { sendSuccess, sendNoContent } from '../utils/responseHelper';
import { MESSAGES } from '../constants/messages';
import { UpdateProfileDto, UpdateThemeDto } from '../validators/user.validator';

import { IUserController } from './interfaces/IUserController';

@injectable()
export class UserController implements IUserController {
  constructor(
    @inject(TOKENS.UserService) private userService: IUserService
  ) {}

  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.userService.getProfile(req.user!.id);
      sendSuccess(res, user);
    } catch (err) { next(err); }
  }

  async updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as UpdateProfileDto;
      const user = await this.userService.updateProfile(req.user!.id, dto);
      sendSuccess(res, user, MESSAGES.USER.PROFILE_UPDATED);
    } catch (err) { next(err); }
  }

  async updateTheme(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as UpdateThemeDto;
      const user = await this.userService.updateTheme(req.user!.id, dto);
      sendSuccess(res, user, MESSAGES.USER.THEME_UPDATED);
    } catch (err) { next(err); }
  }

  async deleteMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.userService.deleteAccount(req.user!.id);
      sendNoContent(res);
    } catch (err) { next(err); }
  }
}

import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { IFavoriteController } from './interfaces/IFavoriteController';
import { IFavoriteService } from '../services/interfaces/IFavoriteService';
import { TOKENS } from '../container/tokens';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/responseHelper';
import { MESSAGES } from '../constants/messages';

@injectable()
export class FavoriteController implements IFavoriteController {
  constructor(
    @inject(TOKENS.FavoriteService) private favoriteService: IFavoriteService
  ) {}

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cursor = req.query['cursor'] ? String(req.query['cursor']) : undefined;
      const limit = req.query['limit'] ? Number(req.query['limit']) : 20;
      const result = await this.favoriteService.list(req.user!.id, cursor, limit);
      sendSuccess(res, result.favorites, MESSAGES.SUCCESS, undefined, {
        nextCursor: result.nextCursor,
        hasNextPage: result.hasNextPage,
        limit,
      });
    } catch (err) {
      next(err);
    }
  }

  async add(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const favorite = await this.favoriteService.add(
        req.user!.id,
        String(req.params['songId'])
      );
      sendCreated(res, favorite, MESSAGES.FAVORITE.ADDED);
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.favoriteService.remove(
        req.user!.id,
        String(req.params['songId'])
      );
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  async isFavorited(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const favorited = await this.favoriteService.isFavorited(
        req.user!.id,
        String(req.params['songId'])
      );
      sendSuccess(res, { isFavorited: favorited });
    } catch (err) {
      next(err);
    }
  }
}

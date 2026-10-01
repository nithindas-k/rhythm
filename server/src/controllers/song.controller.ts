import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { ISongController } from './interfaces/ISongController';
import { ISongService } from '../services/interfaces/ISongService';
import { TOKENS } from '../container/tokens';
import { sendSuccess } from '../utils/responseHelper';
import { MESSAGES } from '../constants/messages';
import { SongSearchDto } from '../validators/song.validator';

@injectable()
export class SongController implements ISongController {
  constructor(
    @inject(TOKENS.SongService) private songService: ISongService
  ) {}

  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.query as unknown as SongSearchDto;
      const result = await this.songService.search(dto);
      sendSuccess(res, result.songs, MESSAGES.SUCCESS, undefined, {
        nextCursor: result.nextCursor,
        hasNextPage: result.hasNextPage,
        limit: dto.limit ?? 20,
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const song = await this.songService.getById(String(req.params['id']));
      sendSuccess(res, song);
    } catch (err) {
      next(err);
    }
  }

  async getTrending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Number(req.query['limit'] ?? 20);
      const songs = await this.songService.getTrending(limit);
      sendSuccess(res, songs);
    } catch (err) {
      next(err);
    }
  }

  async recordPlay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.songService.recordPlay(String(req.params['id']));
      sendSuccess(res, null, MESSAGES.SONG.PLAY_COUNTED);
    } catch (err) {
      next(err);
    }
  }
}

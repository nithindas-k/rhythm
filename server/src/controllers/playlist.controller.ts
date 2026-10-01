import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { IPlaylistController } from './interfaces/IPlaylistController';
import { IPlaylistService } from '../services/interfaces/IPlaylistService';
import { TOKENS } from '../container/tokens';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/responseHelper';
import { MESSAGES } from '../constants/messages';
import {
  CreatePlaylistDto,
  UpdatePlaylistDto,
  AddTrackDto,
  ReorderTracksDto,
} from '../validators/playlist.validator';

@injectable()
export class PlaylistController implements IPlaylistController {
  constructor(
    @inject(TOKENS.PlaylistService) private playlistService: IPlaylistService
  ) {}

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cursor = req.query['cursor'] ? String(req.query['cursor']) : undefined;
      const limit = req.query['limit'] ? Number(req.query['limit']) : 20;
      const result = await this.playlistService.list(req.user!.id, cursor, limit);
      sendSuccess(res, result.playlists, MESSAGES.SUCCESS, undefined, {
        nextCursor: result.nextCursor,
        hasNextPage: result.hasNextPage,
        limit,
      });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as CreatePlaylistDto;
      const playlist = await this.playlistService.create(req.user!.id, dto);
      sendCreated(res, playlist, MESSAGES.PLAYLIST.CREATED);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const playlist = await this.playlistService.getById(
        String(req.params['id']),
        req.user!.id
      );
      sendSuccess(res, playlist);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as UpdatePlaylistDto;
      const playlist = await this.playlistService.update(
        String(req.params['id']),
        req.user!.id,
        dto
      );
      sendSuccess(res, playlist, MESSAGES.PLAYLIST.UPDATED);
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.playlistService.delete(String(req.params['id']), req.user!.id);
      sendNoContent(res);
    } catch (err) {
      next(err);
    }
  }

  async addTrack(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as AddTrackDto;
      const playlist = await this.playlistService.addTrack(
        String(req.params['id']),
        req.user!.id,
        dto
      );
      sendSuccess(res, playlist, MESSAGES.PLAYLIST.TRACK_ADDED);
    } catch (err) {
      next(err);
    }
  }

  async removeTrack(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const playlist = await this.playlistService.removeTrack(
        String(req.params['id']),
        String(req.params['songId']),
        req.user!.id
      );
      sendSuccess(res, playlist, MESSAGES.PLAYLIST.TRACK_REMOVED);
    } catch (err) {
      next(err);
    }
  }

  async reorderTracks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as ReorderTracksDto;
      const playlist = await this.playlistService.reorderTracks(
        String(req.params['id']),
        req.user!.id,
        dto
      );
      sendSuccess(res, playlist, MESSAGES.PLAYLIST.TRACKS_REORDERED);
    } catch (err) {
      next(err);
    }
  }
}

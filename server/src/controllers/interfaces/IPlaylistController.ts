import { Request, Response, NextFunction } from 'express';

export interface IPlaylistController {
  list(req: Request, res: Response, next: NextFunction): Promise<void>;
  create(req: Request, res: Response, next: NextFunction): Promise<void>;
  getById(req: Request, res: Response, next: NextFunction): Promise<void>;
  update(req: Request, res: Response, next: NextFunction): Promise<void>;
  delete(req: Request, res: Response, next: NextFunction): Promise<void>;
  addTrack(req: Request, res: Response, next: NextFunction): Promise<void>;
  removeTrack(req: Request, res: Response, next: NextFunction): Promise<void>;
  reorderTracks(req: Request, res: Response, next: NextFunction): Promise<void>;
}

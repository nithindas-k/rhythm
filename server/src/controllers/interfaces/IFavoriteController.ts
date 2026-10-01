import { Request, Response, NextFunction } from 'express';

export interface IFavoriteController {
  list(req: Request, res: Response, next: NextFunction): Promise<void>;
  add(req: Request, res: Response, next: NextFunction): Promise<void>;
  remove(req: Request, res: Response, next: NextFunction): Promise<void>;
  isFavorited(req: Request, res: Response, next: NextFunction): Promise<void>;
}

import { Request, Response, NextFunction } from 'express';

export interface ISongController {
  search(req: Request, res: Response, next: NextFunction): Promise<void>;
  getById(req: Request, res: Response, next: NextFunction): Promise<void>;
  getTrending(req: Request, res: Response, next: NextFunction): Promise<void>;
  recordPlay(req: Request, res: Response, next: NextFunction): Promise<void>;
}

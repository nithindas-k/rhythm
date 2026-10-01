import { Request, Response, NextFunction } from 'express';

export interface IUserController {
  getMe(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateMe(req: Request, res: Response, next: NextFunction): Promise<void>;
  updateTheme(req: Request, res: Response, next: NextFunction): Promise<void>;
  deleteMe(req: Request, res: Response, next: NextFunction): Promise<void>;
}

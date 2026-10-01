import { UserRole } from '../constants/roles';

declare global {
  namespace Express {
    interface Request {
      /** Populated by the authenticate middleware after JWT verification */
      user?: {
        id: string;
        role: UserRole;
        jti: string;
      };
    }
  }
}

export {};

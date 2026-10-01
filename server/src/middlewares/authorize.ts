import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors/ForbiddenError';
import { UserRole } from '../constants/roles';

/**
 * Role-based access control middleware factory.
 * Usage: router.delete('/admin/..', authenticate, authorize('admin'), handler)
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new ForbiddenError());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError());
    }

    next();
  };
}

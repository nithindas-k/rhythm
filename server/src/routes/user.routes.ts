import { Router } from 'express';
import { container, TOKENS } from '../container/index';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { asyncWrapper } from '../utils/asyncWrapper';
import { updateProfileSchema, updateThemeSchema } from '../validators/user.validator';

const router = Router();

// All user routes require authentication
router.use(authenticate);

const ctrl = () => container.resolve<UserController>(TOKENS.UserController as symbol);

// GET  /users/me
router.get('/me', asyncWrapper((req, res, next) => ctrl().getMe(req, res, next)));

// PATCH /users/me
router.patch(
  '/me',
  validate(updateProfileSchema),
  asyncWrapper((req, res, next) => ctrl().updateMe(req, res, next))
);

// PATCH /users/me/theme
router.patch(
  '/me/theme',
  validate(updateThemeSchema),
  asyncWrapper((req, res, next) => ctrl().updateTheme(req, res, next))
);

// DELETE /users/me
router.delete('/me', asyncWrapper((req, res, next) => ctrl().deleteMe(req, res, next)));

export default router;

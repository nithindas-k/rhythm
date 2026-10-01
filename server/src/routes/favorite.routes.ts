import { Router } from 'express';
import { container, TOKENS } from '../container/index';
import { FavoriteController } from '../controllers/favorite.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { asyncWrapper } from '../utils/asyncWrapper';
import {
  favoriteParamsSchema,
  favoriteQuerySchema,
} from '../validators/favorite.validator';

const router = Router();

router.use(authenticate);

const ctrl = () => container.resolve<FavoriteController>(TOKENS.FavoriteController as symbol);

// GET    /favorites          — list user favorites
router.get(
  '/',
  validate(favoriteQuerySchema, 'query'),
  asyncWrapper((req, res, next) => ctrl().list(req, res, next))
);

// POST   /favorites/:songId  — add to favorites
router.post(
  '/:songId',
  validate(favoriteParamsSchema, 'params'),
  asyncWrapper((req, res, next) => ctrl().add(req, res, next))
);

// DELETE /favorites/:songId  — remove from favorites
router.delete(
  '/:songId',
  validate(favoriteParamsSchema, 'params'),
  asyncWrapper((req, res, next) => ctrl().remove(req, res, next))
);

// GET    /favorites/:songId  — check if favorited
router.get(
  '/:songId',
  validate(favoriteParamsSchema, 'params'),
  asyncWrapper((req, res, next) => ctrl().isFavorited(req, res, next))
);

export default router;

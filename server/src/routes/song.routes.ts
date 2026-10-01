import { Router } from 'express';
import { container, TOKENS } from '../container/index';
import { SongController } from '../controllers/song.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { asyncWrapper } from '../utils/asyncWrapper';
import { songSearchSchema } from '../validators/song.validator';

const router = Router();

router.use(authenticate);

const ctrl = () => container.resolve<SongController>(TOKENS.SongController as symbol);


router.get(
  '/',
  validate(songSearchSchema, 'query'),
  asyncWrapper((req, res, next) => ctrl().search(req, res, next))
);


router.get(
  '/trending',
  asyncWrapper((req, res, next) => ctrl().getTrending(req, res, next))
);

router.get(
  '/:id',
  asyncWrapper((req, res, next) => ctrl().getById(req, res, next))
);

router.post(
  '/:id/play',
  asyncWrapper((req, res, next) => ctrl().recordPlay(req, res, next))
);

export default router;

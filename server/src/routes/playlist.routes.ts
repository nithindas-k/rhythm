import { Router } from 'express';
import { container, TOKENS } from '../container/index';
import { PlaylistController } from '../controllers/playlist.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { asyncWrapper } from '../utils/asyncWrapper';
import {
  createPlaylistSchema,
  updatePlaylistSchema,
  addTrackSchema,
  reorderTracksSchema,
} from '../validators/playlist.validator';

const router = Router();

router.use(authenticate);

const ctrl = () => container.resolve<PlaylistController>(TOKENS.PlaylistController as symbol);

// GET    /playlists                      — list user playlists
router.get('/', asyncWrapper((req, res, next) => ctrl().list(req, res, next)));

// POST   /playlists                      — create playlist
router.post(
  '/',
  validate(createPlaylistSchema),
  asyncWrapper((req, res, next) => ctrl().create(req, res, next))
);

// GET    /playlists/:id                  — get playlist detail
router.get('/:id', asyncWrapper((req, res, next) => ctrl().getById(req, res, next)));

// PATCH  /playlists/:id                  — update playlist info
router.patch(
  '/:id',
  validate(updatePlaylistSchema),
  asyncWrapper((req, res, next) => ctrl().update(req, res, next))
);

// DELETE /playlists/:id                  — delete playlist
router.delete('/:id', asyncWrapper((req, res, next) => ctrl().delete(req, res, next)));

// POST   /playlists/:id/tracks           — add song to playlist
router.post(
  '/:id/tracks',
  validate(addTrackSchema),
  asyncWrapper((req, res, next) => ctrl().addTrack(req, res, next))
);

// DELETE /playlists/:id/tracks/:songId   — remove song from playlist
router.delete(
  '/:id/tracks/:songId',
  asyncWrapper((req, res, next) => ctrl().removeTrack(req, res, next))
);

// PATCH  /playlists/:id/tracks/reorder   — reorder playlist tracks
router.patch(
  '/:id/tracks/reorder',
  validate(reorderTracksSchema),
  asyncWrapper((req, res, next) => ctrl().reorderTracks(req, res, next))
);

export default router;

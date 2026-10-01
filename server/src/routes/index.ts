import { Router } from 'express';
import healthRouter from './health.routes';
import authRouter from './auth.routes';
import userRouter from './user.routes';
import friendRouter from './friend.routes';

import songRouter from './song.routes';
import playlistRouter from './playlist.routes';
import favoriteRouter from './favorite.routes';
import roomRouter from './room.routes';

const router = Router();

// ── Health ─────────────────────────────────────────────────────────────────────
router.use('/health', healthRouter);

// ── Phase 3: Auth ─────────────────────────────────────────────────────────────
router.use('/auth', authRouter);

// ── Phase 4: Users + Friends ──────────────────────────────────────────────────
router.use('/users', userRouter);
router.use('/friends', friendRouter);

// ── Phase 5: Songs, Playlists, Favorites ──────────────────────────────────────
router.use('/songs', songRouter);
router.use('/playlists', playlistRouter);
router.use('/favorites', favoriteRouter);

// ── Phase 6: Rooms ────────────────────────────────────────────────────────────
router.use('/rooms', roomRouter);

export default router;

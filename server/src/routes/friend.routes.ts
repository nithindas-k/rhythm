import { Router } from 'express';
import { container, TOKENS } from '../container/index';
import { FriendController } from '../controllers/friend.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { asyncWrapper } from '../utils/asyncWrapper';
import {
  sendFriendRequestSchema,
  friendSearchSchema,
} from '../validators/friend.validator';

const router = Router();

router.use(authenticate);

const ctrl = () => container.resolve<FriendController>(TOKENS.FriendController as symbol);

// GET  /friends              — accepted friends list (cached)
router.get('/', asyncWrapper((req, res, next) => ctrl().getFriends(req, res, next)));

// GET  /friends/requests     — incoming pending requests
router.get('/requests', asyncWrapper((req, res, next) => ctrl().getIncomingRequests(req, res, next)));

// GET  /friends/sent         — outgoing pending requests
router.get('/sent', asyncWrapper((req, res, next) => ctrl().getOutgoingRequests(req, res, next)));

// GET  /friends/search?q=&limit=  — search users by username or email
router.get(
  '/search',
  validate(friendSearchSchema, 'query'),
  asyncWrapper((req, res, next) => ctrl().searchUsers(req, res, next))
);

// POST /friends/request      — send a friend request
router.post(
  '/request',
  validate(sendFriendRequestSchema),
  asyncWrapper((req, res, next) => ctrl().sendRequest(req, res, next))
);

// PATCH /friends/request/:id/accept
router.patch(
  '/request/:id/accept',
  asyncWrapper((req, res, next) => ctrl().acceptRequest(req, res, next))
);

// PATCH /friends/request/:id/reject
router.patch(
  '/request/:id/reject',
  asyncWrapper((req, res, next) => ctrl().rejectRequest(req, res, next))
);

// DELETE /friends/request/:id  — cancel sent request
router.delete(
  '/request/:id',
  asyncWrapper((req, res, next) => ctrl().cancelRequest(req, res, next))
);

// DELETE /friends/:id  — remove accepted friend
router.delete(
  '/:id',
  asyncWrapper((req, res, next) => ctrl().removeFriend(req, res, next))
);

export default router;

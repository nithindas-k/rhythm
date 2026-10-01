import { Router } from 'express';
import { container, TOKENS } from '../container/index';
import { RoomController } from '../controllers/room.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { asyncWrapper } from '../utils/asyncWrapper';
import {
  createRoomSchema,
  roomCodeParamsSchema,
  transferHostSchema,
  inviteMemberSchema,
  memberControlParamsSchema,
  memberControlSchema,
  addToQueueSchema,
  queueSongParamsSchema,
} from '../validators/room.validator';

const router = Router();

router.use(authenticate);

const ctrl = () => container.resolve<RoomController>(TOKENS.RoomController as symbol);

// POST   /rooms                                 — create room (couples | party)
router.post(
  '/',
  validate(createRoomSchema),
  asyncWrapper((req, res, next) => ctrl().create(req, res, next))
);

// GET    /rooms/:code                           — get room info
router.get(
  '/:code',
  validate(roomCodeParamsSchema, 'params'),
  asyncWrapper((req, res, next) => ctrl().getByCode(req, res, next))
);

// PATCH  /rooms/:code/host                      — transfer host
router.patch(
  '/:code/host',
  validate(roomCodeParamsSchema, 'params'),
  validate(transferHostSchema),
  asyncWrapper((req, res, next) => ctrl().transferHost(req, res, next))
);

// DELETE /rooms/:code                           — end room
router.delete(
  '/:code',
  validate(roomCodeParamsSchema, 'params'),
  asyncWrapper((req, res, next) => ctrl().endRoom(req, res, next))
);

// POST   /rooms/:code/invite                    — invite friend to room
router.post(
  '/:code/invite',
  validate(roomCodeParamsSchema, 'params'),
  validate(inviteMemberSchema),
  asyncWrapper((req, res, next) => ctrl().invite(req, res, next))
);

// PATCH  /rooms/:code/members/:userId/control   — grant/revoke playback control
router.patch(
  '/:code/members/:userId/control',
  validate(memberControlParamsSchema, 'params'),
  validate(memberControlSchema),
  asyncWrapper((req, res, next) => ctrl().updateControl(req, res, next))
);

// POST   /rooms/:code/queue                     — add song to shared room queue
router.post(
  '/:code/queue',
  validate(roomCodeParamsSchema, 'params'),
  validate(addToQueueSchema),
  asyncWrapper((req, res, next) => ctrl().addToQueue(req, res, next))
);

// DELETE /rooms/:code/queue/:songId             — remove song from shared room queue
router.delete(
  '/:code/queue/:songId',
  validate(queueSongParamsSchema, 'params'),
  asyncWrapper((req, res, next) => ctrl().removeFromQueue(req, res, next))
);

export default router;

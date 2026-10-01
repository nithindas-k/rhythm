import { Router } from 'express';
import { container } from '../container/index';
import { TOKENS } from '../container/index';
import { IAuthController } from '../controllers/interfaces/IAuthController';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/authenticate';
import { authRateLimiter } from '../middlewares/rateLimiter';
import { asyncWrapper } from '../utils/asyncWrapper';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
} from '../validators/auth.validator';

const router = Router();

// Apply stricter rate limiter to all auth routes
router.use(authRateLimiter);

const ctrl = () => container.resolve<IAuthController>(TOKENS.AuthController as symbol);

// POST /auth/register
router.post(
  '/register',
  validate(registerSchema),
  asyncWrapper((req, res, next) => ctrl().register(req, res, next))
);

// POST /auth/login
router.post(
  '/login',
  validate(loginSchema),
  asyncWrapper((req, res, next) => ctrl().login(req, res, next))
);

// POST /auth/google
router.post(
  '/google',
  validate(googleAuthSchema),
  asyncWrapper((req, res, next) => ctrl().googleAuth(req, res, next))
);

// POST /auth/refresh  (reads httpOnly cookie — no body validation needed)
router.post(
  '/refresh',
  asyncWrapper((req, res, next) => ctrl().refresh(req, res, next))
);

// POST /auth/logout  (requires valid access token)
router.post(
  '/logout',
  authenticate,
  asyncWrapper((req, res, next) => ctrl().logout(req, res, next))
);

export default router;

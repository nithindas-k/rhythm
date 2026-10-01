import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { getRedisClient } from '../config/redis';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { HTTP_STATUS } from '../constants/statusCodes';
import { MESSAGES } from '../constants/messages';
import { asyncWrapper } from '../utils/asyncWrapper';

const router = Router();

router.get(
  '/',
  asyncWrapper(async (_req: Request, res: Response) => {
    const checks: Record<string, string> = {};
    let allHealthy = true;

    // MongoDB
    const mongoState = mongoose.connection.readyState;
    // 1 = connected, 2 = connecting
    checks.mongodb = mongoState === 1 ? 'ok' : 'degraded';
    if (mongoState !== 1) allHealthy = false;

    // Redis
    try {
      const redis = getRedisClient();
      const pong = await redis.ping();
      checks.redis = pong === 'PONG' ? 'ok' : 'degraded';
      if (pong !== 'PONG') allHealthy = false;
    } catch {
      checks.redis = 'degraded';
      allHealthy = false;
    }

    checks.server = 'ok';

    const responseData = {
      status: allHealthy ? 'healthy' : 'degraded',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      checks,
    };

    if (allHealthy) {
      sendSuccess(res, responseData, MESSAGES.HEALTH.OK);
    } else {
      sendError(
        res,
        MESSAGES.HEALTH.DEGRADED,
        HTTP_STATUS.SERVICE_UNAVAILABLE,
        Object.entries(checks)
          .filter(([, v]) => v !== 'ok')
          .map(([field]) => ({ field, message: `${field} is not healthy` }))
      );
    }
  })
);

export default router;

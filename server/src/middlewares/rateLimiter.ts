import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { sendError } from '../utils/responseHelper';
import { HTTP_STATUS } from '../constants/statusCodes';
import { MESSAGES } from '../constants/messages';


export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,  
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    
    return (req.user?.id ?? req.ip) as string;
  },
  handler(_req, res) {
    sendError(res, MESSAGES.TOO_MANY_REQUESTS, HTTP_STATUS.TOO_MANY_REQUESTS);
  },
  skip: (req) => env.NODE_ENV === 'development' || req.path === '/health',
});


export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'development' ? 5000 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req) => req.ip as string,
  skip: (req) => env.NODE_ENV === 'development' || req.path === '/refresh',
  handler(_req, res) {
    sendError(res, MESSAGES.TOO_MANY_REQUESTS, HTTP_STATUS.TOO_MANY_REQUESTS);
  },
});


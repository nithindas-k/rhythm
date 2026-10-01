import pinoHttp from 'pino-http';
import { logger } from '../utils/logger';

/**
 * pino-http request logger middleware.
 * Logs every request/response pair with duration, status code, and method.
 * Sensitive headers are automatically redacted by the base logger config.
 */
export const requestLogger = pinoHttp({
  logger,
  // Custom log level per response status
  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  // Serialise only what we need
  serializers: {
    req(req) {
      return {
        method: req.method,
        url: req.url,
        remoteAddress: req.remoteAddress,
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
  // Don't log health checks (too noisy)
  autoLogging: {
    ignore: (req) => req.url === '/api/v1/health',
  },
});

import { env } from './env';

export const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin) return true; // allow non-browser requests or same-origin
  if (origin === env.CLIENT_URL) return true;
  // Allow all Vercel deployments and preview URLs
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return true;
  // Allow local development
  if (origin.startsWith('http://localhost:')) return true;
  return false;
};

export const corsOriginDelegate = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void
): void => {
  if (isAllowedOrigin(origin)) {
    callback(null, true);
  } else {
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  }
};

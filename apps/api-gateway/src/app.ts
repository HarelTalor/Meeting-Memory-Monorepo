import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { problemDetailsHandler } from '@mm/problem-details';
import { requireAuth } from './middleware/auth.middleware';

const AUTH_SERVICE_URL = process.env['AUTH_SERVICE_URL'] ?? 'http://localhost:3001';
const MEETING_SERVICE_URL = process.env['MEETING_SERVICE_URL'] ?? 'http://localhost:3002';
const TASK_SERVICE_URL = process.env['TASK_SERVICE_URL'] ?? 'http://localhost:3003';
const NOTIFICATION_SERVICE_URL = process.env['NOTIFICATION_SERVICE_URL'] ?? 'http://localhost:3004';

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { type: 'https://problems.meeting-memory.app/rate-limit', title: 'Too Many Requests', status: 429 },
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Stricter for auth routes
  standardHeaders: true,
  legacyHeaders: false,
  message: { type: 'https://problems.meeting-memory.app/rate-limit', title: 'Too Many Requests', status: 429 },
});

const proxyOptions = (target: string) => ({
  target,
  changeOrigin: true,
  pathRewrite: (path: string, req: express.Request) => req.originalUrl,
  on: {
    error: (err: Error, _req: express.Request, res: express.Response) => {
      console.error(`[api-gateway] Proxy error → ${target}:`, err.message);
      res.status(502).json({
        type: 'https://problems.meeting-memory.app/bad-gateway',
        title: 'Bad Gateway',
        status: 502,
        detail: `Upstream service unavailable`,
      });
    },
  },
});

export const createApp = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:4200', credentials: true }));
  app.use(globalRateLimiter);

  app.get('/health', (_req, res) =>
    res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() })
  );

  // ── Auth routes (public + strict rate limit) ────────────────────────────────
  app.use(
    ['/api/auth/register', '/api/auth/login', '/api/auth/refresh'],
    authRateLimiter,
    createProxyMiddleware(proxyOptions(AUTH_SERVICE_URL))
  );

  // ── Protected auth routes ───────────────────────────────────────────────────
  app.use('/api/auth', requireAuth, createProxyMiddleware(proxyOptions(AUTH_SERVICE_URL)));
  app.use('/api/users', requireAuth, createProxyMiddleware(proxyOptions(AUTH_SERVICE_URL)));

  // ── Meeting routes ──────────────────────────────────────────────────────────
  app.use('/api/meetings', requireAuth, createProxyMiddleware(proxyOptions(MEETING_SERVICE_URL)));

  // ── Task routes ─────────────────────────────────────────────────────────────
  app.use('/api/tasks', requireAuth, createProxyMiddleware(proxyOptions(TASK_SERVICE_URL)));

  // ── Notification routes (SSE — no body parsing needed) ─────────────────────
  app.use('/api/notifications', requireAuth, createProxyMiddleware({
    ...proxyOptions(NOTIFICATION_SERVICE_URL),
    // Keep SSE connections open — disable proxy timeout
    timeout: 0,
    proxyTimeout: 0,
  }));

  app.use(problemDetailsHandler);

  return app;
};

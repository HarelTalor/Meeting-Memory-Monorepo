import 'dotenv/config';
import { Redis } from 'ioredis';
import { createApp, connectDb, startBackgroundServices } from './app';

const PORT = parseInt(process.env['PORT'] ?? '3004', 10);
const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

async function bootstrap() {
  await connectDb();
  const redis = new Redis(REDIS_URL);
  redis.on('error', (err) => console.error('[notification-service] Redis error:', err));
  startBackgroundServices(redis);
  const app = createApp(redis);
  app.listen(PORT, () => console.log(`[notification-service] Running on http://localhost:${PORT}`));
}

bootstrap().catch((err) => { console.error('[notification-service] Fatal:', err); process.exit(1); });

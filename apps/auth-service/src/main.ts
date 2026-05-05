import 'dotenv/config';
import { Redis } from 'ioredis';
import { createApp, connectDb } from './app';

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const REDIS_URL = process.env['REDIS_URL'] ?? 'redis://localhost:6379';

async function bootstrap() {
  await connectDb();

  const redis = new Redis(REDIS_URL);
  redis.on('error', (err) => console.error('[auth-service] Redis error:', err));

  const app = createApp(redis);

  app.listen(PORT, () => {
    console.log(`[auth-service] Running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('[auth-service] Fatal startup error:', err);
  process.exit(1);
});

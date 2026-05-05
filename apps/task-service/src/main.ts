import 'dotenv/config';
import { createApp, connectDb } from './app';

const PORT = parseInt(process.env['PORT'] ?? '3003', 10);

async function bootstrap() {
  await connectDb();
  const app = createApp();
  app.listen(PORT, () => console.log(`[task-service] Running on http://localhost:${PORT}`));
}

bootstrap().catch((err) => { console.error('[task-service] Fatal:', err); process.exit(1); });

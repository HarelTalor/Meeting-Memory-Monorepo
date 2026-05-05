import 'dotenv/config';
import { createApp, connectDb } from './app';

const PORT = parseInt(process.env['PORT'] ?? '3002', 10);

async function bootstrap() {
  await connectDb();
  const app = createApp();
  app.listen(PORT, () => console.log(`[meeting-service] Running on http://localhost:${PORT}`));
}

bootstrap().catch((err) => { console.error('[meeting-service] Fatal:', err); process.exit(1); });

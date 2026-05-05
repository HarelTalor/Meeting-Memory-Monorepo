import 'dotenv/config';
import { createApp } from './app';

const PORT = parseInt(process.env['PORT'] ?? '3000', 10);

const app = createApp();
app.listen(PORT, () => console.log(`[api-gateway] Running on http://localhost:${PORT}`));

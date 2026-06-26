import { createApp } from './app.js';
import { env } from './config/env.js';

const REQUIRED = ['databaseUrl', 'jwtSecret'];
const missing = REQUIRED.filter((k) => !env[k]);
if (missing.length) {
  console.error(`[startup] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const app = createApp();

app.listen(env.port, () => {
  console.log(`KodeAura7 API listening on port ${env.port}`);
});

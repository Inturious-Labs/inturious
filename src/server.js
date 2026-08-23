import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { open, migrate } from './lib/db.js';
import tipsRoutes from './routes/tips/index.js';
import { start as startRates } from './lib/tips/rates.js';

const PORT = Number(process.env.PORT ?? 3001);
const HOST = process.env.HOST ?? '127.0.0.1';
const DB_PATH = process.env.DB_PATH ?? './inturious.db';
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? '')
  .split(',').map(s => s.trim()).filter(Boolean);

const fastify = Fastify({
  logger: { level: process.env.LOG_LEVEL ?? 'info' },
  // Reject unknown fields instead of silently stripping them, so a malformed client
  // fails loudly rather than writing a half-understood row.
  ajv: { customOptions: { removeAdditional: false } },
  // nginx terminates TLS and sets X-Forwarded-For; without this every client
  // looks like 127.0.0.1 and the rate limiter buckets them together.
  trustProxy: true,
});

open(DB_PATH);
const applied = migrate();
if (applied.length) fastify.log.info({ applied }, 'migrations applied');

await fastify.register(cors, {
  origin: CORS_ORIGINS.length ? CORS_ORIGINS : false,
  methods: ['GET', 'POST'],
});

await fastify.register(rateLimit, {
  max: 120,
  timeWindow: '1 minute',
});

fastify.get('/health', async () => ({ ok: true, ts: Math.floor(Date.now() / 1000) }));

// Begin polling exchange rates so the first reader does not wait on a cold fetch.
startRates(fastify.log);

await fastify.register(tipsRoutes, { prefix: '/api/tips' });

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    fastify.log.info({ signal }, 'shutting down');
    await fastify.close();
    process.exit(0);
  });
}

try {
  await fastify.listen({ port: PORT, host: HOST });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}

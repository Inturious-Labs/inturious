import { logVisit, stats, SOURCES, METHODS } from '../../lib/tips/store.js';
import { current as currentRates } from '../../lib/tips/rates.js';

export default async function tipsRoutes(fastify) {
  // Telemetry from the tip page. Fire-and-forget from the client's perspective —
  // a failure here must never block someone from tipping.
  fastify.post('/visit', {
    schema: {
      body: {
        type: 'object',
        required: ['src'],
        additionalProperties: false,
        properties: {
          src:     { type: 'string', enum: SOURCES },
          // `nullable` is OpenAPI, not JSON Schema — AJV ignores it. Use a type union
          // so an explicit null from the client is accepted.
          article: { type: ['string', 'null'], maxLength: 200 },
          method:  { type: ['string', 'null'], enum: [...METHODS, null] },
        },
      },
    },
  }, async (request, reply) => {
    try {
      logVisit(request.body);
    } catch (err) {
      request.log.error({ err }, 'failed to log tip visit');
    }
    return reply.code(204).send();
  });

  // Public. The tip page prices its dollar buttons from this, so readers never have
  // to talk to the rate provider themselves.
  fastify.get('/rates', async (request, reply) => {
    const r = currentRates();
    if (!r.rates) {
      // Nothing cached yet. The page falls back to address-only, which still works.
      return reply.code(503).send({ error: 'rates unavailable' });
    }
    // Cache briefly at the edge and in the browser; the data changes every 5 minutes.
    reply.header('Cache-Control', 'public, max-age=60');
    return r;
  });

  // Private. Read by the `tips` CLI and, later, a dashboard.
  fastify.get('/stats', {
    schema: {
      querystring: {
        type: 'object',
        additionalProperties: false,
        properties: { days: { type: 'integer', minimum: 1, maximum: 3650 } },
      },
    },
  }, async (request, reply) => {
    const expected = process.env.STATS_TOKEN;
    if (!expected) return reply.code(503).send({ error: 'stats not configured' });

    const auth = request.headers.authorization ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!timingSafeEqual(token, expected)) {
      return reply.code(401).send({ error: 'unauthorized' });
    }

    const { days } = request.query;
    const since = days ? Math.floor(Date.now() / 1000) - days * 86400 : null;
    return stats({ since });
  });
}

// Constant-time compare so a wrong token cannot be recovered by timing the response.
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

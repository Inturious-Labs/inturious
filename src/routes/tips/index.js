import { logVisit, recordTip, stats, SOURCES, METHODS } from '../../lib/tips/store.js';
import { current as currentRates } from '../../lib/tips/rates.js';
import { createCheckoutSession, verifyWebhook, isConfigured as stripeReady }
  from '../../lib/tips/stripe.js';

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

  // Start a card tip. Returns the Stripe-hosted checkout URL for the browser to
  // follow. Amounts are constrained server-side so the price cannot be set by the
  // client.
  fastify.post('/checkout', {
    schema: {
      body: {
        type: 'object',
        required: ['amount_usd'],
        additionalProperties: false,
        properties: {
          amount_usd: { type: 'integer', minimum: 1, maximum: 100 },
          src:        { type: ['string', 'null'], enum: [...SOURCES, null] },
          article:    { type: ['string', 'null'], maxLength: 200 },
        },
      },
    },
  }, async (request, reply) => {
    if (!stripeReady()) return reply.code(503).send({ error: 'card tipping unavailable' });

    const { amount_usd, src, article } = request.body;
    try {
      const session = await createCheckoutSession({
        amountCents: amount_usd * 100,
        src,
        article,
        origin: request.headers.origin,
      });
      // Record the intent to pay by card; the tip itself lands via webhook.
      try { if (src) logVisit({ src, article: article || null, method: 'card' }); } catch { /* non-fatal */ }
      return { url: session.url };
    } catch (err) {
      request.log.error({ err: err.message }, 'checkout session failed');
      return reply.code(502).send({ error: 'could not start checkout' });
    }
  });

  // Stripe calls this. Fulfilment lives here rather than on the return page, because
  // a reader can pay and never load that page.
  fastify.post('/webhook', {
    config: { rawBody: true },
  }, async (request, reply) => {
    if (!stripeReady()) return reply.code(503).send({ error: 'not configured' });

    const sig = request.headers['stripe-signature'];
    let event;
    try {
      event = verifyWebhook(request.rawBody, sig);
    } catch (err) {
      request.log.warn({ err: err.message }, 'webhook signature rejected');
      return reply.code(400).send({ error: 'invalid signature' });
    }

    // completed fires immediately; async_payment_succeeded covers delayed methods
    // that settle hours later. Both are gated on payment_status so an unpaid
    // session is never recorded as a tip.
    if (event.type === 'checkout.session.completed'
     || event.type === 'checkout.session.async_payment_succeeded') {
      const s = event.data.object;
      if (s.payment_status !== 'unpaid') {
        try {
          recordTip({
            stripeSession: s.id,
            amountCents: s.amount_total,
            currency: s.currency,
            src: s.metadata?.src || null,
            article: s.metadata?.article || null,
          });
          request.log.info({ session: s.id, amount: s.amount_total }, 'tip recorded');
        } catch (err) {
          request.log.error({ err: err.message, session: s.id }, 'failed to record tip');
          // 500 so Stripe retries rather than dropping the tip.
          return reply.code(500).send({ error: 'record failed' });
        }
      }
    }

    return reply.code(200).send({ received: true });
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

import { get } from '../db.js';

const now = () => Math.floor(Date.now() / 1000);

export const SOURCES = ['dsc', 'tsb', 'rog', 'hyx'];
export const METHODS = ['btc', 'sol', 'usdc', 'icp', 'card'];

export function logVisit({ src, article = null, method = null }) {
  get()
    .prepare('INSERT INTO tip_visits (src, article, method, ts) VALUES (?, ?, ?, ?)')
    .run(src, article, method, now());
}

export function recordTip({ stripeSession, amountCents, currency, src = null, article = null }) {
  // Stripe retries webhooks; the unique index on stripe_session makes replay a no-op.
  get()
    .prepare(`INSERT OR IGNORE INTO tips
              (stripe_session, amount_cents, currency, src, article, ts)
              VALUES (?, ?, ?, ?, ?, ?)`)
    .run(stripeSession, amountCents, currency, src, article, now());
}

// since: unix seconds, or null for all time.
export function stats({ since = null } = {}) {
  const d = get();
  const w = since ? 'WHERE ts >= ?' : '';
  const a = since ? [since] : [];

  return {
    since,
    generated_at: now(),
    visits_total: d.prepare(`SELECT COUNT(*) n FROM tip_visits ${w}`).get(...a).n,

    top_articles: d.prepare(
      `SELECT src, article, COUNT(*) visits
         FROM tip_visits ${w ? w + ' AND' : 'WHERE'} article IS NOT NULL
        GROUP BY src, article ORDER BY visits DESC LIMIT 20`).all(...a),

    by_source: d.prepare(
      `SELECT src, COUNT(*) visits FROM tip_visits ${w}
        GROUP BY src ORDER BY visits DESC`).all(...a),

    by_method: d.prepare(
      `SELECT method, COUNT(*) clicks FROM tip_visits
        ${w ? w + ' AND' : 'WHERE'} method IS NOT NULL
        GROUP BY method ORDER BY clicks DESC`).all(...a),

    revenue: d.prepare(
      `SELECT currency, COUNT(*) tips, SUM(amount_cents) total_cents
         FROM tips ${w} GROUP BY currency`).all(...a),

    revenue_by_article: d.prepare(
      `SELECT src, article, COUNT(*) tips, SUM(amount_cents) total_cents
         FROM tips ${w ? w + ' AND' : 'WHERE'} article IS NOT NULL
        GROUP BY src, article ORDER BY total_cents DESC LIMIT 20`).all(...a),
  };
}

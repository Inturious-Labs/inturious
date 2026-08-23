/**
 * USD exchange rates for the tip page.
 *
 * Readers never talk to the rate provider — this server fetches on an interval and
 * serves from memory, so CoinGecko sees one client rather than every visitor.
 *
 * Degrading is deliberate: if a refresh fails we keep serving the last good rates
 * however old they are, and report their age. A stale rate is far better than no
 * amount buttons. The page falls back to address-only if we have nothing at all.
 */

const SOURCE = 'https://api.coingecko.com/api/v3/simple/price'
  + '?ids=bitcoin,solana,usd-coin,internet-computer&vs_currencies=usd';

// method id on the tip page -> CoinGecko id
const IDS = {
  btc: 'bitcoin',
  sol: 'solana',
  usdc: 'usd-coin',
  icp: 'internet-computer',
};

const REFRESH_MS = 5 * 60 * 1000;   // CoinGecko's free tier is generous; this is polite
const TIMEOUT_MS = 8000;

let rates = null;         // { btc: 77233, ... }
let fetchedAt = null;     // unix seconds
let lastError = null;
let timer = null;

export async function refresh(log) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(SOURCE, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();

    const next = {};
    for (const [id, cgId] of Object.entries(IDS)) {
      const v = body?.[cgId]?.usd;
      if (typeof v !== 'number' || !(v > 0)) throw new Error(`missing rate for ${cgId}`);
      next[id] = v;
    }

    rates = next;
    fetchedAt = Math.floor(Date.now() / 1000);
    lastError = null;
    log?.info({ rates: next }, 'rates refreshed');
  } catch (err) {
    lastError = err.message;
    // Keep whatever we had. Old rates still price a tip within cents.
    log?.warn({ err: err.message, stale: !!rates }, 'rate refresh failed');
  } finally {
    clearTimeout(t);
  }
}

export function start(log) {
  if (timer) return;
  refresh(log);
  timer = setInterval(() => refresh(log), REFRESH_MS);
  timer.unref?.();   // never hold the process open
}

export function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

export function current() {
  return {
    rates,                                     // null until the first successful fetch
    fetched_at: fetchedAt,
    age_seconds: fetchedAt ? Math.floor(Date.now() / 1000) - fetchedAt : null,
    stale: lastError !== null,
  };
}

-- Tipping: visit/click telemetry and settled card tips.
--
-- Deliberately coarse. No IP, no user agent, no fingerprint — enough to learn which
-- articles move readers to tip, not enough to profile anyone.

CREATE TABLE IF NOT EXISTS tip_visits (
  id      INTEGER PRIMARY KEY,
  src     TEXT    NOT NULL,          -- dsc | tsb | rog | hyx
  article TEXT,                      -- slug; null when the link carried no article
  method  TEXT,                      -- null on page view; btc|sol|usdc|icp|card on click
  ts      INTEGER NOT NULL           -- unix seconds
);

CREATE INDEX IF NOT EXISTS idx_tip_visits_src_article ON tip_visits(src, article);
CREATE INDEX IF NOT EXISTS idx_tip_visits_ts          ON tip_visits(ts);

-- Card tips only. Crypto tips cannot be attributed on-chain (no memo field in BIP-21
-- or EIP-681), so on-chain receipts are not recorded here — tip_visits carries the
-- intent signal for those instead.
CREATE TABLE IF NOT EXISTS tips (
  id             INTEGER PRIMARY KEY,
  stripe_session TEXT    NOT NULL UNIQUE,
  amount_cents   INTEGER NOT NULL,
  currency       TEXT    NOT NULL,
  src            TEXT,
  article        TEXT,
  ts             INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tips_src_article ON tips(src, article);
CREATE INDEX IF NOT EXISTS idx_tips_ts          ON tips(ts);

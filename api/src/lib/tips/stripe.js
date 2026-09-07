/**
 * Card tipping via Stripe Checkout.
 *
 * Fulfilment (recording the tip) happens in the webhook handler, never on the return
 * page — a reader can pay and then close the tab or lose connection before the page
 * loads, and that tip must still be recorded.
 */

import Stripe from 'stripe';

let client = null;

export function getClient() {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client = new Stripe(key);
  return client;
}

export function isConfigured() {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET;
}

// A stable label so these sessions are identifiable in the Dashboard.
const INTEGRATION_ID = 'inturious-tips-qkzvhrmt';

// At or above this amount the tip page offers "Annual Supporter" — a reader backing a
// full year. Same flow, but named so it stands out in the Dashboard.
const SUPPORTER_CENTS = 5000;

export async function createCheckoutSession({ amountCents, src, article, origin }) {
  const stripe = getClient();
  if (!stripe) throw new Error('stripe not configured');

  const base = process.env.TIP_PAGE_URL || origin || 'https://tip.inturious.com';
  const supporter = amountCents >= SUPPORTER_CENTS;

  return stripe.checkout.sessions.create({
    mode: 'payment',
    // payment_method_types is deliberately omitted so Stripe picks the methods most
    // likely to convert for each reader.
    line_items: [{
      price_data: {
        currency: 'usd',
        unit_amount: amountCents,
        product_data: {
          name: supporter ? 'Annual Supporter' : 'Tip',
          description: supporter
            ? 'One full year of the newsletter'
            : article
              ? `For "${article.replace(/-/g, ' ')}"`
              : 'Thanks for reading',
        },
      },
      quantity: 1,
    }],
    // Metadata rides with the payment, so a card tip can be attributed exactly —
    // unlike crypto, where no chain here carries a memo.
    metadata: {
      src: src || '',
      article: article || '',
      kind: supporter ? 'supporter' : 'tip',
    },
    integration_identifier: INTEGRATION_ID,
    success_url: `${base}/?tipped=1`,
    cancel_url: `${base}/?src=${encodeURIComponent(src || '')}&a=${encodeURIComponent(article || '')}`,
    submit_type: 'donate',
  });
}

export function verifyWebhook(rawBody, signature) {
  const stripe = getClient();
  if (!stripe) throw new Error('stripe not configured');
  return stripe.webhooks.constructEvent(
    rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET
  );
}

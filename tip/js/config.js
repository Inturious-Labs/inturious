/**
 * Tip page configuration.
 *
 * WHERE THE KEYS LIVE
 *
 *   BTC, SOL, USDC   deGate wallet
 *   ICP              nns.ic0.app, under the "Herbert Yang" Internet Identity anchor
 *
 * Losing access to either of those means losing anything tipped to these addresses.
 * Keep recovery methods current — for the anchor in particular, more than one
 * registered device.
 *
 * All four are receive-only and fresh: verified on-chain as valid, correctly
 * checksummed, and with no prior transaction history. They become permanently public
 * the moment an article links here, so never reuse them for anything else.
 *
 * If any address is replaced, the page shows a red warning while a value still reads
 * PLACEHOLDER, so an unfinished edit cannot ship silently.
 */

window.TIP_CONFIG = {
  api: 'https://api.inturious.com',

  // Newsletters that may send readers here. `src` values must match the API's enum.
  sources: {
    dsc: { name: 'Digital Sovereignty Chronicle', accent: '#22d3ee' },
    tsb: { name: 'The Sunday Blender',            accent: '#f472b6' },
    rog: { name: 'Remnants of Globalization',     accent: '#fbbf24' },
    hyx: { name: 'herbertyang.xyz',               accent: '#a78bfa' },
  },

  // Suggested amounts, in US dollars. Readers cannot judge what a fraction of a coin
  // is worth, so every button is priced in dollars and converted at display time from
  // rates the API serves. `default` is preselected so tipping is one tap.
  amountsUsd: [1, 2, 3, 5, 10],
  defaultUsd: 3,
  methods: [
    {
      id: 'usdc',
      label: 'USDC',
      symbol: 'USDC',
      address: '0x69E8B468506D61d8d596692507E7196637bc4c67',
      chain: 'Base',
      // EIP-681 ERC-20 transfer. 6 decimals for USDC.
      uri: (addr, amt) =>
        `ethereum:${TIP_CONFIG.usdcContract}@8453/transfer?address=${addr}` +
        (amt ? `&uint256=${Math.round(amt * 1e6)}` : ''),
      decimals: 2,
      rateUrl: 'https://www.coingecko.com/en/coins/usdc',
      note: 'On Base. A dollar stablecoin.',
    },

    {
      id: 'btc',
      label: 'Bitcoin',
      symbol: 'BTC',
      address: 'bc1p7y3hn66u0gd496yq4ke5qyngwapsrn0f5a8ek7nnlm9kepc2289qwe40f5',
      // BIP-21. `label` and `message` are wallet display text and never reach the chain.
      uri: (addr, amt) => `bitcoin:${addr}` + (amt ? `?amount=${amt}` : ''),
      decimals: 8,
      rateUrl: 'https://www.coingecko.com/en/coins/bitcoin',
      note: 'On-chain. Confirmations take a few minutes.',
    },
    {
      id: 'sol',
      label: 'Solana',
      symbol: 'SOL',
      address: '8inijPMHEgKCDzsM6531RyAEGo1vL5VE7VifVuJen5fM',
      // Solana Pay. `reference` is a public key attached to the transaction so a
      // payment can later be correlated to the article that prompted it — the only
      // chain here that solved attribution properly.
      uri: (addr, amt, ref) =>
        `solana:${addr}` +
        (amt ? `?amount=${amt}` : '') +
        (ref ? `${amt ? '&' : '?'}reference=${ref}` : ''),
      decimals: 4,
      rateUrl: 'https://www.coingecko.com/en/coins/solana',
      note: 'Fast and nearly free.',
    },
    {
      id: 'icp',
      label: 'Internet Computer',
      symbol: 'ICP',
      address: '5fc238c21d624bd146cc169ea2000388164c1dac5ff42e2ba733cbbcaa5f134a',
      // No widely supported URI scheme; wallets take a bare account identifier.
      uri: (addr) => addr,
      decimals: 4,
      rateUrl: 'https://www.coingecko.com/en/coins/internet-computer',
      note: 'Account identifier, not a principal ID.',
    },
  ],

  // USDC on Base.
  usdcContract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',

  // Card tipping. Shown as a fifth method so every option reads the same way.
  card: {
    enabled: true,
    label: 'Card',
    symbol: 'Visa · Mastercard · Amex',
    note: 'Handled by Stripe. Apple Pay, Google Pay and others appear where supported.',
  },
};

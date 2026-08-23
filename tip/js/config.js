/**
 * Tip page configuration.
 *
 * REPLACE THE PLACEHOLDER ADDRESSES BELOW before this page goes live.
 * Each is marked PLACEHOLDER; the page shows a visible warning while any remain.
 *
 * These addresses become permanently public once articles link here, and anyone can
 * then watch every transaction on them. Use fresh wallets kept separate from other
 * on-chain activity.
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
      id: 'btc',
      label: 'Bitcoin',
      symbol: 'BTC',
      address: 'PLACEHOLDER_BTC_ADDRESS',
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
      address: 'PLACEHOLDER_SOL_ADDRESS',
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
      id: 'usdc',
      label: 'USDC',
      symbol: 'USDC',
      address: 'PLACEHOLDER_USDC_ADDRESS',
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
      id: 'icp',
      label: 'Internet Computer',
      symbol: 'ICP',
      address: 'PLACEHOLDER_ICP_ACCOUNT_IDENTIFIER',
      // No widely supported URI scheme; wallets take a bare account identifier.
      uri: (addr) => addr,
      decimals: 4,
      rateUrl: 'https://www.coingecko.com/en/coins/internet-computer',
      note: 'Account identifier, not a principal ID.',
    },
  ],

  // USDC on Base.
  usdcContract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',

  // Card tipping arrives with the Stripe work; the section stays hidden until then.
  card: { enabled: false },
};

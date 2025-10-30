# Inturious Labs

Portfolio website for Inturious Labs showcasing digital products and services.

## Deployment

### IC Canister Information

**Canister ID:** `mhlja-5qaaa-aaaao-qkv2q-cai`

**Creation Details:**
- Created: 2025-10-30
- Initial cycles: 500B (0.5 TC)
- Total ICP converted: 0.5 ICP → ~1.12 TC
- Identity: `inturious`
- Principal: `v6g3i-2xwvh-ufwgr-tqjrh-46mu5-33qqy-qielq-fomlh-m2uab-yks7v-iae`

**Live URLs:**
- IC URL: https://mhlja-5qaaa-aaaao-qkv2q-cai.icp0.io
- Custom Domain: https://inturious.com (pending DNS configuration)

### Deployment Process

The site is automatically deployed to IC mainnet via GitHub Actions on push to `main` branch.

**Requirements:**
- GitHub Secret: `DFX_IDENTITY_INTURIOUS` (PEM file)
- GitHub Variable: `PRODUCTION_CANISTER_ID` (mhlja-5qaaa-aaaao-qkv2q-cai)

### Local Development

```bash
# Open index.html in browser
open index.html

# Or use a local server
python3 -m http.server 8000
```

### Manual Deployment

```bash
# Use inturious identity
dfx identity use inturious

# Deploy to IC mainnet
dfx deploy --network ic
```

## Project Structure

```
inturious/
├── index.html              # Main landing page
├── readly/
│   └── index.html         # Readly product page
├── css/
│   ├── pico.min.css       # CSS framework
│   └── style.css          # Custom styles
├── .github/
│   └── workflows/
│       └── deploy.yml     # CI/CD deployment
├── dfx.json               # IC canister configuration
└── .ic-assets.json5       # Content-type headers
```

## Contact

hello@inturious.com

## License

Copyright 2025 Inturious Labs

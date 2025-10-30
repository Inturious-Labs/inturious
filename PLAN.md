# Inturious Labs IC Deployment Plan

## Project Overview
Deploy the Inturious Labs portfolio website to Internet Computer (IC) canister using GitHub Actions CI/CD.

**Website:** inturious.com
**Type:** Static HTML/CSS portfolio site
**Current Status:** Local files ready, no IC deployment configured

---

## Current State

### What We Have
- ✅ Static website files (index.html, readly/index.html)
- ✅ CSS styling (Pico framework + custom styles)
- ✅ Git repository initialized
- ✅ `.gitignore` with IC patterns (`.dfx/`, `canister_ids.json`)

### What's Missing
- ❌ `dfx.json` configuration
- ❌ GitHub Actions workflow
- ❌ GitHub secrets/variables for deployment
- ❌ `.ic-assets.json5` for content-type headers
- ❌ IC canister created and registered

---

## Deployment Steps

### Phase 1: Local IC Configuration

#### 1.1 Create `dfx.json`
Create assets-only canister configuration:
```json
{
  "version": 1,
  "canisters": {
    "inturious_frontend": {
      "type": "assets",
      "source": [
        "."
      ]
    }
  },
  "defaults": {
    "build": {
      "packtool": ""
    }
  },
  "networks": {
    "local": {
      "bind": "127.0.0.1:4943",
      "type": "ephemeral"
    },
    "ic": {
      "providers": ["https://ic0.app"],
      "type": "persistent"
    }
  }
}
```

**Pattern Used:** Assets-only (similar to y3labs, sundayblender)
**Source Directory:** Current directory (`.`) contains all web assets

#### 1.2 Create `.ic-assets.json5`
Configure content-type headers and caching (pattern from herbertyang.xyz):
```json5
[
  {
    "match": "**/*",
    "headers": {
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline';"
    }
  },
  {
    "match": "*.html",
    "headers": {
      "Content-Type": "text/html"
    }
  },
  {
    "match": "*.css",
    "headers": {
      "Content-Type": "text/css",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  },
  {
    "match": "*.js",
    "headers": {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  }
]
```

#### 1.3 Update `.gitignore`
Ensure IC-related files are ignored:
```gitignore
# Internet Computer
.dfx/
canister_ids.json
```

---

### Phase 2: GitHub Actions Setup

#### 2.1 Create `.github/workflows/deploy.yml`
Modern deployment pattern (DFX 0.24.3):

```yaml
name: Deploy to IC Mainnet

on:
  push:
    branches:
      - main
    paths-ignore:
      - 'README.md'
      - 'PLAN.md'
      - 'docs/**'
      - '**/*.md'
  pull_request:
    branches:
      - main
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install DFX via dfxvm
        run: |
          DFXVM_VERSION="1.0.1"
          DFXVM_DIR="$HOME/.local/share/dfx"
          mkdir -p "$DFXVM_DIR/bin"

          curl -L "https://github.com/dfinity/dfxvm/releases/download/v${DFXVM_VERSION}/dfxvm-x86_64-unknown-linux-gnu.tar.gz" -o dfxvm.tar.gz
          tar -xzf dfxvm.tar.gz
          mv dfxvm-x86_64-unknown-linux-gnu/dfxvm "$DFXVM_DIR/bin/"
          chmod +x "$DFXVM_DIR/bin/dfxvm"

          echo "$DFXVM_DIR/bin" >> $GITHUB_PATH
          export PATH="$DFXVM_DIR/bin:$PATH"

          dfxvm default 0.24.3
          export PATH="$HOME/.local/share/dfx/versions/0.24.3:$PATH"
          $HOME/.local/share/dfx/versions/0.24.3/dfx --version

      - name: Create canister_ids.json
        run: |
          mkdir -p .
          echo '{
            "inturious_frontend": {
              "ic": "${{ vars.PRODUCTION_CANISTER_ID }}"
            }
          }' > canister_ids.json

      - name: Import DFX Identity
        run: |
          export PATH="$HOME/.local/share/dfx/versions/0.24.3:$PATH"
          echo "${{ secrets.DFX_IDENTITY_INTURIOUS }}" > identity.pem
          dfx identity import inturious identity.pem --disable-encryption || true
          dfx identity use inturious

      - name: Deploy to IC
        env:
          DFX_NETWORK: ic
        run: |
          export PATH="$HOME/.local/share/dfx/versions/0.24.3:$PATH"
          dfx identity use inturious
          dfx deploy --network ic --yes

      - name: Deployment Summary
        run: |
          echo "✅ Deployment Complete!"
          echo "Canister ID: ${{ vars.PRODUCTION_CANISTER_ID }}"
          echo "URL: https://${{ vars.PRODUCTION_CANISTER_ID }}.ic0.app"
```

**Pattern Used:** Modern direct-to-IC deployment (rapport/sundayblender style)
**DFX Version:** 0.24.3 (latest stable)

---

### Phase 3: GitHub Configuration

#### 3.1 Create DFX Identity
On local machine:
```bash
# Create new identity for Inturious
dfx identity new inturious

# Get the identity PEM file
cat ~/.config/dfx/identity/inturious/identity.pem
```

#### 3.2 Create Canister on IC
```bash
# Use the new identity
dfx identity use inturious

# Get principal
dfx identity get-principal

# Create canister on IC mainnet
dfx canister create inturious_frontend --network ic

# Note the canister ID (format: xxxxx-xxxxx-xxxxx-xxxxx-cai)
```

#### 3.3 Configure GitHub Secrets
Navigate to: `Settings > Secrets and variables > Actions`

**Secrets (encrypted):**
- `DFX_IDENTITY_INTURIOUS`: Full PEM file content from identity.pem

**Variables (plain text):**
- `PRODUCTION_CANISTER_ID`: The canister ID from step 3.2

---

### Phase 4: Domain Configuration

#### 4.1 IC Custom Domain Setup
Once deployed, configure custom domain inturious.com:
```bash
# Add custom domain to canister
dfx canister call <canister-id> http_request '(record {
  url = "/.well-known/ic-domains";
  method = "GET";
  headers = vec {};
  body = vec {};
})'
```

#### 4.2 DNS Configuration
Add DNS records:
```
CNAME   inturious.com       ic0.app
TXT     _canister-id        <canister-id>
```

---

## Verification Checklist

### Pre-Deployment
- [ ] dfx.json created with correct canister name
- [ ] .ic-assets.json5 created with content-type headers
- [ ] .github/workflows/deploy.yml created
- [ ] DFX identity created locally
- [ ] Canister created on IC mainnet
- [ ] GitHub secrets configured (`DFX_IDENTITY_INTURIOUS`)
- [ ] GitHub variables configured (`PRODUCTION_CANISTER_ID`)

### Post-Deployment
- [ ] GitHub Actions workflow runs successfully
- [ ] Site accessible at https://<canister-id>.ic0.app
- [ ] All pages load correctly (index.html, readly/index.html)
- [ ] CSS styling works (Pico + custom styles)
- [ ] Links function properly
- [ ] Custom domain (inturious.com) resolves correctly

---

## Rollback Plan

If deployment fails:
1. Check GitHub Actions logs for errors
2. Verify canister ID matches in canister_ids.json
3. Verify DFX identity secret is valid
4. Test local deployment: `dfx deploy --network ic`
5. If critical: revert to previous commit and redeploy

---

## Reference Projects

**Similar Deployments:**
- `y3labs`: Assets-only canister (simple pattern)
- `sundayblender`: Hugo static site with similar workflow
- `herbertyang.xyz`: Advanced with caching and .ic-assets.json5

**Workflow Pattern:** Modern DFX 0.24.3 (rapport/sundayblender)
**File Paths:**
- `/Users/zire/matrix/github_zire/y3labs/.github/workflows/deploy.yml`
- `/Users/zire/matrix/github_zire/sundayblender/.github/workflows/deploy.yml`
- `/Users/zire/matrix/github_zire/herbertyang.xyz/.ic-assets.json5`

---

## Estimated Timeline

- **Phase 1 (Config Files):** 10 minutes
- **Phase 2 (GitHub Actions):** 5 minutes
- **Phase 3 (Secrets/Canister):** 15 minutes
- **Phase 4 (Domain):** 20 minutes
- **Total:** ~50 minutes

---

## Next Steps

1. ✅ Create PLAN.md (this file)
2. ⏳ Create dfx.json
3. ⏳ Create .ic-assets.json5
4. ⏳ Create .github/workflows/deploy.yml
5. ⏳ Create DFX identity locally
6. ⏳ Create canister on IC
7. ⏳ Configure GitHub secrets/variables
8. ⏳ Push to main branch (trigger deployment)
9. ⏳ Verify deployment
10. ⏳ Configure custom domain

---

**Status:** Ready to begin implementation
**Created:** 2025-10-30
**Owner:** Herbert Yang <hello@herbertyang.xyz>

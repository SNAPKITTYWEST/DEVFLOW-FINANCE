# SnapKitty Collective | Environment Variables Manifest
## Sprint: v2.2.1 - MVP Production Deployment

---

## 📋 Environment Variables Table

| Variable | Where to Get | Service | Required | Secrets Location |
|----------|-------------|---------|----------|-------------|---------------|
| `ENTRA_TENANT_ID` | Azure Portal → Entra ID → Overview | Auth | **REQUIRED** | Netlify + GitHub |
| `ENTRA_CLIENT_ID` | Azure Portal → App Registrations | Auth | **REQUIRED** | Netlify + GitHub |
| `ENTRA_CLIENT_SECRET` | Azure Portal → App Registrations → Secrets | Auth | **REQUIRED** | Netlify + GitHub |
| `ENTRA_REDIRECT_URI` | Your app URL + /auth/callback | Auth | **REQUIRED** | Netlify |
| `DATABASE_URL` | G-2A (or PostgreSQL provider) | Node.js/Prisma | **REQUIRED** | Netlify |
| `DATABASE_PRISMA_URL` | Same as DATABASE_URL (rotate token) | Prisma | Optional | Netlify |
| `LINKEDIN_API_KEY` | LinkedIn Developer Portal | Bifrost Data | **REQUIRED** | Netlify + GitHub |
| `LINKEDIN_API_SECRET` | LinkedIn Developer Portal | Bifrost Data | **REQUIRED** | Netlify + GitHub |
| `LINKEDIN_OAUTH_TOKEN` | LinkedIn Developer Portal | Bifrost Data | Optional | Netlify |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API Keys | ERP Invoicing | **REQUIRED** | Netlify + GitHub |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks | ERP Invoicing | **REQUIRED** | Netlify |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → API Keys | ERP Invoicing | **REQUIRED** | Netlify + Frontend |
| `RESEND_API_KEY` | Resend Dashboard → API Keys | Email | **REQUIRED** | Netlify + GitHub |
| `RESEND_FROM_EMAIL` | Verified sender in Resend | Email | **REQUIRED** | Netlify |
| `ANTHROPIC_API_KEY` | Anthropic Console → API Keys | Bifrost AI | **REQUIRED** | Netlify + GitHub |
| `ANTHROPIC_MODEL` | Anthropic supported models | Bifrost AI | Optional | Netlify |
| `JWT_SECRET` | Generate: `openssl rand -base64 32` | Auth | **REQUIRED** | Netlify |
| `NETLIFY_SITE_ID` | Netlify Site Settings | Hosting/CI | NO_CI_DEPLOY | GitHub only |
| `NETLIFY_AUTH_TOKEN` | Netlify User Settings | CI/CD | NO_CI_DEPLOY | GitHub only |
| `GITHUB_TOKEN` | GitHub Settings → Tokens | CI/CD | NO_CI_DEPLOY | GitHub only |

---

## 🧪 .env.example (MVP)

```bash
# ============================================================
# SNAPKITTY COLLECTIVE | ENVIRONMENT MANIFEST
# Version: 2.2.1
# ============================================================

# ============================================================
# AUTH / ENTRA ID (AZURE)
# Get from: Azure Portal → Microsoft Entra ID → App registrations
# ============================================================
ENTRA_TENANT_ID=your-azure-tenant-id
ENTRA_CLIENT_ID=your-azure-app-client-id
ENTRA_CLIENT_SECRET=your-azure-app-client-secret
ENTRA_REDIRECT_URI=https://your-domain.com/auth/callback

# ============================================================
# DATABASE (G-2A / POSTGRESQL)
# Get from: G-2A dashboard or your PostgreSQL provider
# ============================================================
DATABASE_URL=postgresql://username:password@host:5432/snapkitty
DATABASE_PRISMA_URL=postgresql://username:password@host:5432/snapkitty?statement_cache_size=500

# ============================================================
# LINKEDIN API (BIFROST DATA LAYER)
# Get from: https://www.linkedin.com/developers/apps
# ============================================================
LINKEDIN_API_KEY=your-linkedin-api-key
LINKEDIN_API_SECRET=your-linkedin-api-secret
LINKEDIN_OAUTH_TOKEN=your-oauth-access-token

# ============================================================
# STRIPE (ERP INVOICING)
# Get from: https://dashboard.stripe.com/apikeys
# ============================================================
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# ============================================================
# RESEND (TRANSACTIONAL EMAIL)
# Get from: https://resend.com/api-keys
# ============================================================
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=treasury@snapkitty.org

# ============================================================
# ANTHROPIC API (BIFROST INTELLIGENCE)
# Get from: https://console.anthropic.com/
# ============================================================
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_MODEL=claude-3-opus-20240229

# ============================================================
# AUTH SECURITY
# Generate with: openssl rand -base64 32
# ============================================================
JWT_SECRET=your-generated-jwt-secret-min-32-chars

# ============================================================
# NETLIFY (CI/CD) - DO NOT COMMIT
# Get from: Netlify dashboard
# ============================================================
NETLIFY_SITE_ID=your-netlify-site-id
NETLIFY_AUTH_TOKEN=your-netlify-auth-token

# ============================================================
# GITHUB CI/CD - DO NOT COMMIT
# Get from: GitHub → Settings → Tokens
# ============================================================
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx

# ============================================================
# ENVIRONMENT
# ============================================================
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://collectivekitty.com
```

---

## 🚀 Netlify CLI Commands (Production)

```bash
# ============================================================
# AUTH / ENTRA ID
# ============================================================
netlify env:set ENTRA_TENANT_ID "your-azure-tenant-id" --context production
netlify env:set ENTRA_CLIENT_ID "your-azure-app-client-id" --context production
netlify env:set ENTRA_CLIENT_SECRET "your-azure-app-client-secret" --context production
netlify env:set ENTRA_REDIRECT_URI "https://collectivekitty.com/auth/callback" --context production

# ============================================================
# DATABASE
# ============================================================
netlify env:set DATABASE_URL "postgresql://username:password@host:5432/snapkitty" --context production

# ============================================================
# LINKEDIN API
# ============================================================
netlify env:set LINKEDIN_API_KEY "your-linkedin-api-key" --context production
netlify env:set LINKEDIN_API_SECRET "your-linkedin-api-secret" --context production
netlify env:set LINKEDIN_OAUTH_TOKEN "your-oauth-token" --context production

# ============================================================
# STRIPE
# ============================================================
netlify env:set STRIPE_SECRET_KEY "sk_live_xxxxxxxxxxxxxxxxxxxxx" --context production
netlify env:set STRIPE_PUBLISHABLE_KEY "pk_live_xxxxxxxxxxxxxxxxxxxxx" --context production
netlify env:set STRIPE_WEBHOOK_SECRET "whsec_xxxxxxxxxxxxxxxxxxxxx" --context production

# ============================================================
# RESEND
# ============================================================
netlify env:set RESEND_API_KEY "re_xxxxxxxxxxxxxxxxxxxxx" --context production
netlify env:set RESEND_FROM_EMAIL "treasury@collectivekitty.com" --context production

# ============================================================
# ANTHROPIC
# ============================================================
netlify env:set ANTHROPIC_API_KEY "sk-ant-api03-xxxxxxxxxxxxxxxxxxxxx" --context production
netlify env:set ANTHROPIC_MODEL "claude-3-opus-20240229" --context production

# ============================================================
# SECURITY
# ============================================================
netlify env:set JWT_SECRET "your-generated-jwt-secret-here" --context production

# ============================================================
# APP CONFIG
# ============================================================
netlify env:set NODE_ENV "production" --context production
netlify env:set NEXT_PUBLIC_APP_URL "https://collectivekitty.com" --context production
```

---

## 🔐 GitHub Secrets (CI/CD Only)

Add these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Value |
|--------|-------|
| `ENTRA_TENANT_ID` | (from Azure) |
| `ENTRA_CLIENT_ID` | (from Azure) |
| `ENTRA_CLIENT_SECRET` | (from Azure) |
| `DATABASE_URL` | (from G-2A) |
| `LINKEDIN_API_KEY` | (from LinkedIn) |
| `LINKEDIN_API_SECRET` | (from LinkedIn) |
| `STRIPE_SECRET_KEY` | (from Stripe) |
| `RESEND_API_KEY` | (from Resend) |
| `ANTHROPIC_API_KEY` | (from Anthropic) |
| `NETLIFY_SITE_ID` | (from Netlify) |
| `NETLIFY_AUTH_TOKEN` | (from Netlify) |
| `GITHUB_TOKEN` | (auto-generated by GitHub) |

---

## ✅ MVP Checklist

- [ ] ENTRA_TENANT_ID
- [ ] ENTRA_CLIENT_ID  
- [ ] ENTRA_CLIENT_SECRET
- [ ] DATABASE_URL
- [ ] LINKEDIN_API_KEY
- [ ] STRIPE_SECRET_KEY
- [ ] RESEND_API_KEY
- [ ] ANTHROPIC_API_KEY
- [ ] JWT_SECRET (generate with `openssl rand -base64 32`)

**DO NOT** commit `.env` files. Only `.env.example`.
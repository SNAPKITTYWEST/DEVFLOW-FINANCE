# SnapKitty Collective | Sovereign OS (v2.2.1)

<p align="center">
  <img src="app/logo.svg" width="200" alt="SnapKitty Collective Logo">
</p>

**BUILD VERSION: v2.2.1-DEPLOYED** *(Force Deploy)*

**Sovereign OS** is a federated financial execution engine built for the SnapKitty Collective. It replaces fragmented ERP systems with a deterministic, "Bifrost" powered core that unifies capital flow, materials management (MM), and real-time intelligence.

## 🚀 LIVE URL
**https://collectivekitty.com**

## 🌌 The Bifrost Architecture
The system operates on a decoupled "Bifrost" bridge philosophy:
- **Frontend**: S/4HANA "Horizon" style Vanilla JS Shell (Enterprise High-Density).
- **Backend**: Node.js "Bifrost" API with Prisma/PostgreSQL.
- **Identity**: Microsoft Entra ID (via GoDaddy M365) OIDC Mesh.
- **Ledger**: BigInt-based cents-precision canonical truth (SSOT).

## 🛠 Project Build Status & Telemetry
| Component | Status | Infrastructure |
| :--- | :--- | :--- |
| **Landing Page** | [ACTIVE] | https://collectivekitty.com |
| **SAP Terminal** | [STABLE] | /index.html |
| **CRM** | [STABLE] | /app.html |
| **Bifrost API** | [ACTIVE] | snapkitty-crm-api |
| **Entra Auth** | [ACTIVE] | GoDaddy M365 OIDC |

## 🔧 Fix 404 Errors
If experiencing 404 at `collectivekitty.com`:

1. **GitHub Pages Settings → Source**: Select `Branch: main` and `Folder: /(root)`
2. **CNAME**: Verified (`collectivekitty.com`)
3. **Hard Refresh**: CTRL+SHIFT+R or clear browser cache
4. **Required A Records** (GoDaddy):
   - `@` → 185.199.108.153
   - `@` → 185.199.109.153
   - `@` → 185.199.110.153
   - `@` → 185.199.111.153
5. **CNAME www**: → SNAPKITTYWEST.github.io

## 📂 System Files
- `/index.html` — Main landing/terminal page
- `/app.html` — CRM application
- `/app.js` — Sovereign OS JavaScript
- `/styles.css` — Enterprise theme
- `/snapkitty-crm-api/` — Node.js Bifrost API
- `/collectivekitty/` — Next.js frontend

---

**"Software is the most important tool we have. We're building it to be beautiful, deterministic, and sovereign."** — *SnapKitty Collective*
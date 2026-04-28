# Collective SpendOS | Federated Financial Control Tower

## Ecosystem Overview
Collective SpendOS is a high-security, AI-native corporate spend management and procurement system. It fuses an ERP backbone (SAP-style) with modern spend controls (Ramp/Brex-style) into a single, agent-driven "War Room" for financial orchestration.

### The "Bifrost" Architecture (v5.0)
The system operates on an immutable, event-driven architecture where the **Ledger is God**.
1. **Canonical Ledger**: BigInt-based deterministic financial truth (Neon Serverless Postgres).
2. **Bifrost Bridge**: Real-time synchronization with Stripe (Payments) and Plaid (Banking).
3. **Spend Control Layer**: Budget enforcement and virtual card provisioning (Unit.co integration).
4. **Command UI**: High-density "Control Tower" for real-time spend visibility.

## Agent Instructions & Roles

### 🟣 GEMINI — CORE BUILDER (Architect)
**Objective**: Design and implement the financial control layer above the CRM and ledger.
- **Rules**: Every transaction must write to the ledger first. No UI-only state.
- **Deliverables**: API design, database extensions, event lifecycle models.

### 🔵 OPENCODE — IMPLEMENTATION ENGINE (Backend)
**Objective**: Implement SpendOS backend APIs.
- **Endpoints**: 
  - `POST /api/spend/cards/create`
  - `POST /api/spend/transaction/authorize`
  - `POST /api/spend/approval/request`
  - `GET /api/spend/dashboard`
- **Rules**: Enforce budget checks before authorization. Return structured JSON.

### 🟡 KIWI — UI/UX SYSTEM (Frontend)
**Objective**: Design the "Control Tower" UI.
- **Features**: Spend dashboard, Virtual Cards UI, Approval Inbox, Procurement Form.
- **Aesthetic**: "Bloomberg Terminal × Modern Fintech". Dark mode, high-density, zero-lag.

### 🔴 ANALYST — FINANCIAL LOGIC (Governance)
**Objective**: Define financial governance and audit rules.
- **Logic**: Budget enforcement (Hard stop/Soft warning), Anomaly detection, Approval thresholds.
- **Mantra**: "Every dollar in. Every dollar out. Every dollar explained."

### ⚫ GROK — REAL-TIME ENGINE (SSE/Events)
**Objective**: Build the real-time financial event bus.
- **Functions**: Stream transaction updates, push ledger changes to UI, trigger budget breach alerts.

## Core Patterns

### Financial Precision
- **Truth Source**: The Neon DB is the Single Source of Truth (SSOT).
- **Integers Only**: All financial calculations performed in cents/BigInt.
- **Auditability**: Every `LedgerEntry` generated with a SHA-256 hash chain for SOX compliance.

### System Flow
1. **Request**: User requests spend via Procurement UI.
2. **Approval**: Workflow triggers based on budget and role-based thresholds.
3. **Provisioning**: Virtual card authorized and issued (Unit.co).
4. **Transaction**: Spend occurs -> Stripe/Unit webhook fires.
5. **Persistence**: Ledger write -> Budget update -> Audit trail link.
6. **Streaming**: Grok pushes real-time update to the Control Tower.

## Key Directories
- `src/app/api/spend/`: SpendOS API handlers.
- `src/lib/ledger/`: Canonical ledger logic and hash chaining.
- `src/components/dashboard/`: Control Tower UI components.
- `prisma/`: SpendOS data models.

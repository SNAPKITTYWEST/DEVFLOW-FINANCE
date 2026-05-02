# SnapKitty Sovereign OS

A type-safe enterprise platform featuring the **Bifrost** standardized 7-stage event pipeline and ML-driven orchestration.

## 🏗 Core Architecture: The Bifrost Pipeline

All events within the Sovereign OS follow the standardized 7-stage Bifrost pipeline to ensure consistency, auditability, and intelligent routing.

1.  **Validate**: Schema validation using `EventTypes` from `@/lib/contracts/event.schema`.
2.  **Ingest**: Secure entry point for internal and external telemetry.
3.  **Score**: ML-driven priority and risk assessment.
    *   *Primary*: Python ML service (`:8001`)
    *   *Fallback*: TypeScript scoring logic in `lib/bifrost/score.ts`.
4.  **Route**: Intelligent event distribution (e.g., Procurement Requisitions, System Alerts).
5.  **Persist**: Hardened storage in PostgreSQL via Prisma (see `BifrostEvent` model).
6.  **Notify**: (In Progress) Stakeholder alerting via Slack/Email.
7.  **Audit**: Immutable logging of pipeline transitions for compliance.

## 🛠 Tech Stack

- **Framework**: Next.js 16.2.4 (App Router)
- **Language**: TypeScript (Strict Mode Enabled)
- **UI**: React 19.2.4 & Tailwind CSS
- **Database**: Prisma + PostgreSQL
- **Orchestration**: Hybrid TS/Python ML Pipeline

## 🚀 Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
3.  **Type Check**:
    ```bash
    npx tsc --noEmit
    ```

## 🛡 Security & Type Safety

- **Strict Mode**: Re-enabled in `tsconfig.json` to prevent enterprise regression.
- **Contract Driven**: All events must implement the flattened `EventTypes` contract to pass the **Validate** stage.

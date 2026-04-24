# DevFlow Sovereign OS | Federated Financial Core

## Ecosystem Overview
SnapKitty is a "Systems over Software" implementation of a **Federated Multi-Entity Wealth OS**. It is designed to manage high-velocity capital flows across non-profit (DIF), B-Corp, and Trust-Vault structures using deterministic financial principles.

### The "Bifrost" Architecture
The system operates on a decoupled micro-service philosophy:
1. **Canonical Ledger**: BigInt-based deterministic financial truth (SSOT)
2. **Bifrost Bridge**: Oracle-style synchronization with Open Collective & Plaid
3. **Intelligence Hub**: Lexus Nexus analytics and Sovereign Credit Scoring (SCS)
4. **Command UI**: High-density vanilla JS cockpit for real-time orchestration

### Compliance Architecture
- **ASC 606**: Revenue recognition with performance obligation mapping
- **SOX Ready**: Single canonical ledger with reconciliation audit trail
- **Event-Driven**: Kafka-style immutable event bus with schema versioning

## Architecture
- **No frameworks**: Pure JavaScript, HTML, CSS (Vanilla JS philosophy)
- **State management**: Single `state` object persisted to localStorage as JSON
- **Rendering**: Direct DOM manipulation via `render()` functions
- **Key files**: `app/app.js` (logic), `app/index.html` (structure), `app/styles.css` (styling)

## Core Patterns

### State Structure (Sovereign Multi-Entity)
```javascript
state = {
  // CANONICAL LEDGER (SSOT - Single Source of Truth)
  funds: {
    canonicalLedger: { id, type: "PRIMARY", lastReconciled, reconciledBy },
    segmentLedgers: [{ id, name, type, balance, vault, parentLedger }],
    syncBridge: { sourceSystem, destinationSystem, reconciliationRules, lastReconciliation },
    asc606: { contracts: [], performanceObligations: [], schemaVersion }
  },
  
  // ANALYTICS (Non-Financial Oracle Layer)
  analytics: { scsScore, lcr, trustVaultValue },
  
  contacts: [{ id, name, company, email, status }],
  deals: [{ id, title, owner, value, stage }],
  tasks: [{ id, title, owner, dueDate, priority, completed }],
  activity: [{ id, schemaVersion, eventType, immutable, timestamp, text, time }]
}
```

### Financial Precision
- Always use cents (integers) for financial calculations
- Use `toCents(dollars)` and `toDollars(cents)` helpers
- Frontend only displays - never calculates financial truth
- Backend determines financial truth, event system records it

### Form Handling
Use `FormData` for form submissions:
```javascript
function handleContactSubmit(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const contact = { id: crypto.randomUUID(), ...Object.fromEntries(formData) };
  state.contacts.unshift(contact);
  persistState();
  render();
}
```

### Rendering
Each section has a dedicated render function (`renderContacts`, `renderDeals`, etc.) that generates HTML strings and sets `innerHTML`. Use `escapeHtml()` for user input to prevent XSS.

### Styling Conventions
- CSS custom properties for colors (e.g., `--accent: #0d6b50`)
- Monospace fonts for financial numbers (Courier New for precision)
- Serif fonts (Georgia) for headers (authority)
- High-density grid layouts for data-rich display

### Event Bus (Immutable Audit Trail)
Log all state changes with `pushActivity(text, eventType)`:
```javascript
pushActivity("Bifrost Bridge: Multi-Entity Ledgers Verified.", "LEDGER_SYNC");
```

## Development Workflow
- Open `app/index.html` in browser to run
- No build tools required
- Edit files directly, refresh browser
- Demo data seeded via "Reset Demo Data" button

## Key Directories
- `app/`: Complete application (HTML, JS, CSS)
- `orchestrator/`: Python bridge services (Bifrost API)
- `contracts/`: ASC 606 revenue recognition logic
- `intelligence/`: SCS risk scoring models
- `vault/`: Ledger reconciliation rules
- Root: Project documentation and licensing

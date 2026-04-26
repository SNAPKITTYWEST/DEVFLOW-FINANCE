// SOVEREIGN OS - BIFROST BRIDGE ENGINE (Phase 2)
// ============================================================================
// Phase 2: Orchestration & Data Modeling with SCS Integration
// ============================================================================

const SovereignOS = {
    // STATE: Canonical Ledger + CRM Pipeline + Intelligence
    state: {
        view: 'dashboard',
        contacts: [
            { id: '1', name: 'SnapKitty DIF', email: 'treasury@snapkitty.org', status: 'Active' },
            { id: '2', name: 'Open Collective Oracle', email: 'sync@opencollective.com', status: 'Synchronized' }
        ],
        ledger: {
            canonicalBalance: 124500000,
            currency: 'USD',
            history: [
                { id: 'TX-9901', type: 'REVENUE_REC', delta: 500000, status: 'Finalized' }
            ]
        },
        // Intelligence Hub: SCS Metrics
        intelligence: {
            scsScore: 780,
            lcr: 2.5,
            vaultValue: 250000000,
            pipelineValue: 100000000,
            dealVelocity: 5
        }
    },

    init() {
        this.loadState();
        this.render();
        console.log("Bifrost Bridge: Active");
    },

    // ============================================================================
    // PERSISTENCE: Bifrost Bridge LocalStorage
    // ============================================================================
    loadState() {
        const saved = localStorage.getItem('sovereign_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            this.state = { ...this.state, ...parsed };
        }
    },

    saveState() {
        localStorage.setItem('sovereign_state', JSON.stringify(this.state));
        this.pushActivity('STATE_PERSIST', 'State synchronized to Bifrost Bridge');
    },

    pushActivity(eventType, text) {
        const activity = {
            id: crypto.randomUUID(),
            schemaVersion: '2.1.0',
            eventType: eventType,
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleTimeString(),
            text: text,
            immutable: true
        };
        if (!this.state.activity) this.state.activity = [];
        this.state.activity.unshift(activity);
    },

    // ============================================================================
    // SCS CALCULATION: Intelligence Hub Integration
    // ============================================================================
    calculateSCS() {
        const { intelligence } = this.state;
        const lcr = intelligence.vaultValue / intelligence.pipelineValue;
        
        const liquidityScore = Math.min(200, Math.floor(intelligence.canonicalBalance / 1000));
        const vaultScore = Math.min(200, Math.floor(intelligence.vaultValue / 5000));
        const velocityScore = Math.min(100, Math.floor(intelligence.dealVelocity * 10));
        const lcrScore = Math.floor((lcr - 0.5) * 100) || 0);
        
        const baseScore = 400;
        const scs = Math.min(850, Math.max(500, 
            baseScore + liquidityScore + vaultScore + velocityScore + lcrScore
        ));
        
        return { scs, lcr };
    },

    getRiskTier(scs) {
        if (scs >= 700) return { label: 'MINIMAL RISK', class: 'low' };
        if (scs >= 600) return { label: 'STABLE', class: 'medium' };
        return { label: 'EXPANDING', class: 'high' };
    },

    // ============================================================================
    // NAVIGATION: View Controller
    // ============================================================================
    setView(view) {
        this.state.view = view;
        document.getElementById('view-title').innerText = view.toUpperCase() + ' CONSOLE';
        this.render();
    },

    // ============================================================================
    // CRM: Entity Registration (High-Density SAP Style)
    // ============================================================================
    addContact(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const newContact = {
            id: crypto.randomUUID(),
            name: formData.get('name'),
            email: formData.get('email'),
            status: 'Verified',
            createdAt: new Date().toISOString()
        };
        this.state.contacts.unshift(newContact);
        this.saveState();
        this.setView('crm');
    },

    // ============================================================================
    // LEDGER: Transaction Entry
    // ============================================================================
    addTransaction(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const delta = parseInt(formData.get('delta') || '0') * 100;
        
        const tx = {
            id: 'TX-' + Math.floor(Math.random() * 9000 + 1000),
            type: formData.get('type'),
            delta: delta,
            status: 'Finalized',
            timestamp: new Date().toISOString()
        };
        
        this.state.ledger.history.unshift(tx);
        this.state.ledger.canonicalBalance += delta;
        this.saveState();
        this.setView('ledger');
    },

    // ============================================================================
    // RENDERING: Modular View Engine
    // ============================================================================
    render() {
        const container = document.getElementById('view-container');
        const v = this.state.view;

        if (v === 'crm') {
            this.renderCRM(container);
        } else if (v === 'ledger') {
            this.renderLedger(container);
        } else {
            this.renderDashboard(container);
        }
    },

    renderDashboard(container) {
        const { scs, lcr } = this.calculateSCS();
        const tier = this.getRiskTier(scs);
        
        container.innerHTML = `
            <section class="fade-in">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                    <div style="background: white; padding: 20px; border: 1px solid var(--border);">
                        <h3>System Health</h3>
                        <p style="font-family: 'Courier New', monospace; color: green;">● NOMINAL</p>
                    </div>
                    <div style="background: white; padding: 20px; border: 1px solid var(--border);">
                        <h3>Bifrost Status</h3>
                        <p style="font-family: 'Courier New', monospace;">SYNCHRONIZED WITH OPEN COLLECTIVE</p>
                    </div>
                    <div style="background: white; padding: 20px; border: 1px solid var(--border);">
                        <h3>Sovereign Credit Score</h3>
                        <p class="balance-val" style="font-size: 1.5rem;">${scs}</p>
                        <span class="badge badge-${tier.class}">${tier.label}</span>
                    </div>
                    <div style="background: white; padding: 20px; border: 1px solid var(--border);">
                        <h3>Liquidity Coverage Ratio</h3>
                        <p class="balance-val" style="font-size: 1.5rem;">${lcr.toFixed(2)}x</p>
                    </div>
                </div>
            </section>
        `;
    },

    renderCRM(container) {
        container.innerHTML = `
            <section class="fade-in">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2>Sovereign CRM Pipeline</h2>
                    <button onclick="document.getElementById('crm-modal').style.display='block'" 
                        class="btn-primary" 
                        style="padding: 10px 20px; background: var(--accent); color: white; border: none; cursor: pointer; font-family: 'Courier New', monospace;">
                        + REGISTER ENTITY
                    </button>
                </div>

                <table class="data-grid">
                    <thead>
                        <tr>
                            <th>ENTITY NAME</th>
                            <th>BIFROST ENDPOINT</th>
                            <th>STATUS</th>
                            <th>CREATED</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.state.contacts.map(c => `
                            <tr>
                                <td style="font-family: 'Georgia', serif;">${this.escapeHtml(c.name)}</td>
                                <td style="font-family: 'Courier New', monospace;">${this.escapeHtml(c.email)}</td>
                                <td><span class="badge badge-${c.status === 'Active' ? 'low' : 'medium'}">${c.status}</span></td>
                                <td style="font-family: 'Courier New', monospace;">${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <!-- High-Density Entity Registration Modal -->
                <div id="crm-modal" style="display:none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 500px; background:white; border: 1px solid var(--border); padding: 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.15); z-index: 1000;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid var(--accent); padding-bottom: 10px;">
                        <h3 style="margin: 0; font-family: 'Georgia', serif;">ENTITY REGISTRATION</h3>
                        <button onclick="document.getElementById('crm-modal').style.display='none'" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                    </div>
                    <form onsubmit="SovereignOS.addContact(event)">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-size: 0.75rem; font-family: 'Courier New', monospace; color: #666;">ENTITY NAME</label>
                            <input name="name" required 
                                style="display: block; width: 100%; padding: 12px; border: 1px solid var(--border); font-family: 'Courier New', monospace; font-size: 0.9rem;">
                        </div>
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; font-size: 0.75rem; font-family: 'Courier New', monospace; color: #666;">BIFROST ENDPOINT (EMAIL)</label>
                            <input name="email" type="email" required 
                                style="display: block; width: 100%; padding: 12px; border: 1px solid var(--border); font-family: 'Courier New', monospace; font-size: 0.9rem;">
                        </div>
                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                            <button type="button" onclick="document.getElementById('crm-modal').style.display='none'" 
                                style="padding: 12px 24px; background: #e0e0e0; border: none; cursor: pointer; font-family: 'Courier New', monospace;">CANCEL</button>
                            <button type="submit" 
                                style="padding: 12px 24px; background: var(--accent); color: white; border: none; cursor: pointer; font-family: 'Courier New', monospace;">PROVISION ACCESS</button>
                        </div>
                    </form>
                </div>
            </section>
        `;
    },

    renderLedger(container) {
        container.innerHTML = `
            <section class="fade-in">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2>Canonical Ledger (SSOT)</h2>
                    <button onclick="document.getElementById('ledger-modal').style.display='block'" 
                        class="btn-primary" 
                        style="padding: 10px 20px; background: var(--accent); color: white; border: none; cursor: pointer; font-family: 'Courier New', monospace;">
                        + NEW TRANSACTION
                    </button>
                </div>

                <div class="balance-card">
                    <div style="font-size: 0.8rem; color: #909399; font-family: 'Courier New', monospace;">PRIMARY SETTLEMENT ASSET</div>
                    <div class="balance-val">${(this.state.ledger.canonicalBalance / 100).toLocaleString('en-US', {style:'currency', currency:'USD'})}</div>
                </div>

                <table class="data-grid" style="margin-top: 20px;">
                    <thead>
                        <tr>
                            <th>EVENT ID</th>
                            <th>TYPE</th>
                            <th>DELTA</th>
                            <th>STATE</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.state.ledger.history.map(h => `
                            <tr>
                                <td style="font-family: 'Courier New', monospace;">${h.id}</td>
                                <td style="font-family: 'Courier New', monospace;">${h.type}</td>
                                <td style="font-family: 'Courier New', monospace; color: ${h.delta >= 0 ? 'green' : 'red'};">
                                    ${h.delta >= 0 ? '+' : ''}${(h.delta / 100).toLocaleString('en-US', {style:'currency', currency:'USD'})}
                                </td>
                                <td><span class="badge badge-low">${h.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <!-- Transaction Entry Modal -->
                <div id="ledger-modal" style="display:none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 500px; background:white; border: 1px solid var(--border); padding: 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.15); z-index: 1000;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid var(--accent); padding-bottom: 10px;">
                        <h3 style="margin: 0; font-family: 'Georgia', serif;">TRANSACTION ENTRY</h3>
                        <button onclick="document.getElementById('ledger-modal').style.display='none'" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                    </div>
                    <form onsubmit="SovereignOS.addTransaction(event)">
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-size: 0.75rem; font-family: 'Courier New', monospace; color: #666;">TRANSACTION TYPE</label>
                            <select name="type" required 
                                style="display: block; width: 100%; padding: 12px; border: 1px solid var(--border); font-family: 'Courier New', monospace; font-size: 0.9rem;">
                                <option value="REVENUE_REC">REVENUE RECOGNITION</option>
                                <option value="EXPENSE_REC">EXPENSE RECORD</option>
                                <option value="TRANSFER">INTER_LEDGER TRANSFER</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 5px; font-size: 0.75rem; font-family: 'Courier New', monospace; color: #666;">AMOUNT (USD)</label>
                            <input name="delta" type="number" step="0.01" required 
                                style="display: block; width: 100%; padding: 12px; border: 1px solid var(--border); font-family: 'Courier New', monospace; font-size: 0.9rem;">
                        </div>
                        <div style="display: flex; gap: 10px; justify-content: flex-end;">
                            <button type="button" onclick="document.getElementById('ledger-modal').style.display='none'" 
                                style="padding: 12px 24px; background: #e0e0e0; border: none; cursor: pointer; font-family: 'Courier New', monospace;">CANCEL</button>
                            <button type="submit" 
                                style="padding: 12px 24px; background: var(--accent); color: white; border: none; cursor: pointer; font-family: 'Courier New', monospace;">RECORD TRANSACTION</button>
                        </div>
                    </form>
                </div>
            </section>
        `;
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

// Global Exposure for HTML Event Handlers
window.setView = (v) => SovereignOS.setView(v);
window.SovereignOS = SovereignOS;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    SovereignOS.init();
});
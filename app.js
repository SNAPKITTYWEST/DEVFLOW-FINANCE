// SOVEREIGN OS - PHASE 4: BIFROST INTEGRATION
// ============================================================================

const SovereignOS = {
    // CONFIG: External API Endpoints
    CONFIG: {
        BIFROST_ENDPOINT: 'http://localhost:5000/api',
        SYNC_INTERVAL: 30000,
        OFFLINE_MODE: false
    },

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
        intelligence: {
            scsScore: 780,
            lcr: 2.5,
            vaultValue: 250000000,
            pipelineValue: 100000000,
            dealVelocity: 5,
            sentiment: 'STABLE',
            riskLevel: 'low'
        }
    },

    async init() {
        this.loadState();
        this.render();
        await this.syncWithBifrost();
        
        if (this.CONFIG.SYNC_INTERVAL > 0) {
            setInterval(() => this.syncWithBifrost(), this.CONFIG.SYNC_INTERVAL);
        }
        
        console.log("Bifrost Bridge: Active");
    },

    // ============================================================================
    // BIFROST SYNC: External API Integration (Offline-First)
    // ============================================================================
    async syncWithBifrost() {
        const indicator = document.getElementById('sync-status');
        if (indicator) {
            indicator.innerHTML = '<span class="pulse" style="display:inline-block;width:8px;height:8px;background:var(--accent);border-radius:50%;margin-right:5px;"></span>SYNCING...';
        }

        try {
            // 1. Sync Ledger & SCS
            const syncResponse = await fetch(`${this.CONFIG.BIFROST_ENDPOINT}/finance/bifrost/sync`, { method: 'POST' });
            if (syncResponse.ok) {
                const data = await syncResponse.json();
                this.state.intelligence.scsScore = data.sovereignCreditScore;
                this.state.ledger.canonicalBalance = data.totalLiquid * 100;
            }

            // 2. Sync Risk Pulse
            const riskResponse = await fetch(`${this.CONFIG.BIFROST_ENDPOINT}/oracle/risk-pulse`);
            if (riskResponse.ok) {
                const risk = await riskResponse.json();
                this.state.intelligence.sentiment = risk.sentiment;
                this.state.intelligence.riskLevel = risk.riskLevel;
            }

            // 3. Sync Activity Log
            const eventResponse = await fetch(`${this.CONFIG.BIFROST_ENDPOINT}/ledger/events`);
            if (eventResponse.ok) {
                const eventData = await eventResponse.json();
                if (eventData.events) {
                    this.state.activity = eventData.events;
                }
            }

            this.saveState();
            if (indicator) indicator.innerHTML = 'ORACLE: SYNCED';
            this.render();
            
        } catch (error) {
            console.warn("Bifrost: Operating in Offline Mode", error.message);
            if (indicator) indicator.innerHTML = 'ORACLE: OFFLINE';
        }
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
        const { intelligence, ledger } = this.state;
        const lcr = intelligence.vaultValue / (intelligence.pipelineValue || 1);
        
        const liquidityScore = Math.min(200, Math.floor(ledger.canonicalBalance / 1000));
        const vaultScore = Math.min(200, Math.floor(intelligence.vaultValue / 5000));
        const velocityScore = Math.min(100, Math.floor(intelligence.dealVelocity * 10));
        const lcrScore = Math.floor((lcr - 0.5) * 100) || 0;
        
        const baseScore = 400;
        const localScs = Math.min(850, Math.max(500,
            baseScore + liquidityScore + vaultScore + velocityScore + lcrScore
        ));
        
        return {
            scs: intelligence.scsScore || localScs,
            lcr: lcr
        };
    },

    getRiskTier(scs) {
        const level = this.state.intelligence.riskLevel;
        if (level === 'minimal' || scs >= 700) return { label: 'MINIMAL RISK', class: 'low' };
        if (level === 'medium' || scs >= 600) return { label: 'STABLE', class: 'medium' };
        return { label: 'EXPANDING', class: 'high' };
    },

    // ============================================================================
    // NAVIGATION: View Controller
    // ============================================================================
    setView(view) {
        this.state.view = view;
        const titleEl = document.getElementById('view-title');
        if (titleEl) titleEl.innerText = view.toUpperCase() + ' CONSOLE';
        this.render();
    },

    // ============================================================================
    // CRM: Entity Registration
    // ============================================================================
    async addContact(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const contactData = {
            name: formData.get('name'),
            email: formData.get('email'),
            type: 'entity',
            status: 'Verified'
        };

        // UI Optimistic Update
        const tempId = crypto.randomUUID();
        this.state.contacts.unshift({ id: tempId, ...contactData });
        this.render();

        try {
            const response = await fetch(`${this.CONFIG.BIFROST_ENDPOINT}/entities`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(contactData)
            });
            if (response.ok) {
                const saved = await response.json();
                this.state.contacts = this.state.contacts.map(c => c.id === tempId ? saved.entity : c);
            }
        } catch (err) {
            console.error("API Persistence failed", err);
        }

        this.saveState();
        document.getElementById('crm-modal').style.display = 'none';
        this.setView('crm');
    },

    // ============================================================================
    // LEDGER: Transaction Entry
    // ============================================================================
    async addTransaction(event) {
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

        // Emit Tradeline
        if (Math.abs(delta) > 100000) {
            try {
                await fetch(`${this.CONFIG.BIFROST_ENDPOINT}/oracle/report-tradeline`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ value: Math.abs(delta) / 100, entityName: "Primary Ledger" })
                });
            } catch (e) {}
        }

        this.saveState();
        document.getElementById('ledger-modal').style.display = 'none';
        this.setView('ledger');
        this.syncWithBifrost();
    },

    // ============================================================================
    // RENDERING: Modular View Engine
    // ============================================================================
    render() {
        const container = document.getElementById('view-container');
        if (!container) return;

        const v = this.state.view;
        const { scs } = this.calculateSCS();
        const scsValEl = document.getElementById('scs-val');
        if (scsValEl) scsValEl.innerText = scs;

        if (v === 'intelligence') {
            this.renderIntelligence(container);
        } else if (v === 'vault') {
            this.renderVault(container);
        } else if (v === 'crm') {
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
                    <div class="metric-card">
                        <h3>System Health</h3>
                        <p style="font-family: 'Courier New', monospace; color: ${this.state.intelligence.sentiment === 'STABLE' ? 'green' : 'orange'};">
                            ● ${this.state.intelligence.sentiment || 'NOMINAL'}
                        </p>
                    </div>
                    <div class="metric-card">
                        <h3>Bifrost Status</h3>
                        <p style="font-family: 'Courier New', monospace;">CONNECTED TO CANONICAL CORE</p>
                    </div>
                    <div class="metric-card">
                        <h3>Sovereign Credit Score</h3>
                        <p class="balance-val" style="font-size: 1.5rem;">${scs}</p>
                        <span class="badge badge-${tier.class}">${tier.label}</span>
                    </div>
                    <div class="metric-card">
                        <h3>Liquidity Coverage Ratio</h3>
                        <p class="balance-val" style="font-size: 1.5rem;">${lcr.toFixed(2)}x</p>
                    </div>
                </div>
            </section>
        `;
    },

    renderIntelligence(container) {
        const { scs, lcr } = this.calculateSCS();
        const tier = this.getRiskTier(scs);
        const { intelligence } = this.state;
        
        container.innerHTML = `
            <section class="fade-in">
                <h2 style="margin-bottom: 20px;">Intelligence Hub</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <div class="metric-card">
                        <div class="metric-label">SOVEREIGN CREDIT SCORE</div>
                        <div class="metric-value">${scs}</div>
                        <span class="badge badge-${tier.class}">${tier.label}</span>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">LIQUIDITY COVERAGE RATIO</div>
                        <div class="metric-value">${lcr.toFixed(2)}x</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">RISK SENTIMENT</div>
                        <div class="metric-value" style="font-size: 1.2rem;">${intelligence.sentiment}</div>
                    </div>
                </div>
                <h3 style="margin-bottom: 15px; font-family: 'Courier New', monospace;">SCS BREAKDOWN</h3>
                <table class="data-grid">
                    <thead><tr><th>COMPONENT</th><th>VALUE</th><th>WEIGHT</th><th>CONTRIBUTION</th></tr></thead>
                    <tbody>
                        <tr><td>LIQUIDITY</td><td>$${(this.state.ledger.canonicalBalance / 100).toLocaleString()}</td><td>MAX 200</td><td>+${Math.min(200, Math.floor(this.state.ledger.canonicalBalance / 1000))}</td></tr>
                        <tr><td>VAULT VALUE</td><td>$${(intelligence.vaultValue / 100).toLocaleString()}</td><td>MAX 200</td><td>+${Math.min(200, Math.floor(intelligence.vaultValue / 5000))}</td></tr>
                        <tr><td>VELOCITY</td><td>${intelligence.dealVelocity} deals/mo</td><td>MAX 100</td><td>+${Math.min(100, Math.floor(intelligence.dealVelocity * 10))}</td></tr>
                        <tr style="background: #f0f4f0;"><td>BASE SCORE</td><td></td><td></td><td>+400</td></tr>
                    </tbody>
                </table>
            </section>
        `;
    },

    renderVault(container) {
        const { intelligence } = this.state;
        container.innerHTML = `
            <section class="fade-in">
                <h2 style="margin-bottom: 20px;">Trust Vault</h2>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
                    <div class="metric-card">
                        <div class="metric-label">TOTAL VAULT VALUE</div>
                        <div class="metric-value">$${(intelligence.vaultValue / 100).toLocaleString()}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">PIPELINE VALUE</div>
                        <div class="metric-value">$${(intelligence.pipelineValue / 100).toLocaleString()}</div>
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
                    <button onclick="document.getElementById('crm-modal').style.display='block'" class="btn-primary">+ REGISTER ENTITY</button>
                </div>
                <table class="data-grid">
                    <thead><tr><th>ENTITY NAME</th><th>BIFROST ENDPOINT</th><th>STATUS</th></tr></thead>
                    <tbody>
                        ${this.state.contacts.map(c => `
                            <tr>
                                <td style="font-family: 'Georgia', serif;">${this.escapeHtml(c.name)}</td>
                                <td style="font-family: 'Courier New', monospace;">${this.escapeHtml(c.email)}</td>
                                <td><span class="badge badge-${c.status === 'Active' || c.status === 'Verified' ? 'low' : 'medium'}">${c.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div id="crm-modal" style="display:none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; background:white; border: 1px solid var(--border); padding: 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.15); z-index: 1000;">
                    <form onsubmit="SovereignOS.addContact(event)">
                        <h3>ENTITY REGISTRATION</h3>
                        <input name="name" placeholder="Entity Name" required style="width:100%; margin-bottom:10px; padding:10px;">
                        <input name="email" type="email" placeholder="Email" required style="width:100%; margin-bottom:10px; padding:10px;">
                        <button type="submit" class="btn-primary">PROVISION</button>
                        <button type="button" onclick="document.getElementById('crm-modal').style.display='none'">CANCEL</button>
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
                    <button onclick="document.getElementById('ledger-modal').style.display='block'" class="btn-primary">+ NEW TRANSACTION</button>
                </div>
                <div class="balance-card">
                    <div class="balance-val">${(this.state.ledger.canonicalBalance / 100).toLocaleString('en-US', {style:'currency', currency:'USD'})}</div>
                </div>
                <table class="data-grid" style="margin-top: 20px;">
                    <thead><tr><th>EVENT ID</th><th>TYPE</th><th>DELTA</th></tr></thead>
                    <tbody>
                        ${this.state.ledger.history.map(h => `
                            <tr>
                                <td>${h.id}</td>
                                <td>${h.type}</td>
                                <td style="color: ${h.delta >= 0 ? 'green' : 'red'};">${(h.delta / 100).toLocaleString('en-US', {style:'currency', currency:'USD'})}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div id="ledger-modal" style="display:none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 400px; background:white; border: 1px solid var(--border); padding: 30px; box-shadow: 0 20px 50px rgba(0,0,0,0.15); z-index: 1000;">
                    <form onsubmit="SovereignOS.addTransaction(event)">
                        <h3>TRANSACTION ENTRY</h3>
                        <select name="type" style="width:100%; margin-bottom:10px; padding:10px;">
                            <option value="REVENUE_REC">REVENUE</option>
                            <option value="EXPENSE_REC">EXPENSE</option>
                        </select>
                        <input name="delta" type="number" step="0.01" placeholder="Amount" required style="width:100%; margin-bottom:10px; padding:10px;">
                        <button type="submit" class="btn-primary">RECORD</button>
                        <button type="button" onclick="document.getElementById('ledger-modal').style.display='none'">CANCEL</button>
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

// Global Exposure
window.setView = (v) => SovereignOS.setView(v);
window.SovereignOS = SovereignOS;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    SovereignOS.init();
});

// Global Exposure for HTML Event Handlers
window.setView = (v) => SovereignOS.setView(v);
window.SovereignOS = SovereignOS;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    SovereignOS.init();
});
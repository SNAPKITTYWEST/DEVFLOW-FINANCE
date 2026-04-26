/**
 * SNAPKITTY SOVEREIGN OS - ENTERPRISE CORE v2.3.0
 * Fully Functioning S/4HANA Style CRM for Developers
 */

const SovereignOS = {
    config: {
        apiUrl: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000'
            : 'https://api.collectivekitty.com',
        syncInterval: 15000,
        currency: 'USD'
    },

    state: {
        view: 'dashboard',
        isOffline: false,
        user: { name: 'Lead Architect', role: 'Sovereign', isAuthenticated: true },

        // FI - Financial Accounting (Cents)
        fi: {
            balance: 124500000,
            documents: [
                { id: 'FB-001', type: 'REV', amount: 5000000, desc: 'Oracle Grant Alpha', date: '2024-05-20', status: 'Posted' },
                { id: 'FB-002', type: 'EXP', amount: 120000, desc: 'AWS Infrastructure', date: '2024-05-21', status: 'Posted' }
            ]
        },
        
        // MM - Materials / Procurement
        mm: {
            pos: [
                { id: 'PO-990', vendor: 'GitHub', value: 450000, status: 'Released' },
                { id: 'PO-991', vendor: 'Vercel', value: 120000, status: 'Pending' }
            ]
        },

        // SD - Sales & Distribution
        sd: {
            deals: [
                { id: 'SO-101', customer: 'Global Trust', value: 25000000, stage: 'Negotiation' },
                { id: 'SO-102', customer: 'Nexus DIF', value: 10000000, stage: 'Closed' }
            ]
        },

        // Intelligence Hub
        intelligence: {
            scsScore: 780,
            lcr: 2.5,
            sentiment: 'STABLE',
            vaultValue: 250000000
        }
    },

    init() {
        console.log(">>> [SOVEREIGN OS] System Booting...");
        this.loadLocalState();
        this.initEventListeners();
        this.render();
        this.sync();
        setInterval(() => this.sync(), this.config.syncInterval);
    },

    initEventListeners() {
        // T-Code Search Implementation
        const search = document.querySelector('.sap-shell-search');
        if (search) {
            search.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.handleTCode(search.value.toUpperCase());
            });
        }
    },

    handleTCode(code) {
        const routes = {
            'FB01': 'fi',
            'ME21': 'mm',
            'VA01': 'sd',
            'SCS': 'intelligence',
            'DASH': 'dashboard'
        };
        if (routes[code]) {
            this.setView(routes[code]);
            document.querySelector('.sap-shell-search').value = '';
        } else {
            console.warn("Unknown T-Code:", code);
        }
    },

    setView(view) {
        this.state.view = view;
        this.render();
        this.saveLocalState();
    },

    async sync() {
        try {
            const resp = await fetch(`${this.config.apiUrl}/health`);
            this.state.isOffline = !resp.ok;
            // Simulated SCS fetch
            if (resp.ok) {
                const scsResp = await fetch(`${this.config.apiUrl}/api/intelligence/scs`);
                if (scsResp.ok) {
                    const data = await scsResp.json();
                    this.state.intelligence.scsScore = data.score;
                }
            }
        } catch (e) { this.state.isOffline = true; }
        this.render();
    },

    render() {
        const launchpad = document.getElementById('launchpad');
        const container = document.getElementById('view-container');
        const syncStatus = document.getElementById('sync-status');

        if (syncStatus) {
            syncStatus.innerHTML = this.state.isOffline
                ? '<span class="pulse" style="background:var(--fiori-error)"></span> BIFROST: OFFLINE'
                : '<span class="pulse"></span> BIFROST: STABLE';
        }

        if (this.state.view === 'dashboard') {
            launchpad.style.display = 'grid';
            container.style.display = 'none';
            this.updateTiles();
        } else {
            launchpad.style.display = 'none';
            container.style.display = 'block';
            this.renderModule(container);
        }
    },

    updateTiles() {
        document.getElementById('tile-balance').innerText = `$${(this.state.fi.balance / 1000000).toFixed(1)}M`;
        document.getElementById('tile-pos').innerText = this.state.mm.pos.length;
        document.getElementById('tile-deals').innerText = this.state.sd.deals.length;
        document.getElementById('tile-scs').innerText = this.state.intelligence.scsScore;
    },

    renderModule(container) {
        const v = this.state.view;
        let html = `<div class="object-page fade-in">
            <div class="object-header">
                <button class="btn-glass" onclick="app.setView('dashboard')">← Launchpad</button>
                <h1 class="object-title">${this.getModuleTitle(v)}</h1>
                <p class="object-subtitle">Sovereign OS Execution Module</p>
            </div>`;

        if (v === 'fi') {
            html += `
                <div class="sap-toolbar"><button class="btn-primary" onclick="alert('FB01 Posting...')">+ Post Document</button></div>
                <table class="sap-table">
                    <thead><tr><th>Doc ID</th><th>Description</th><th>Amount</th><th>Status</th></tr></thead>
                    <tbody>
                        ${this.state.fi.documents.map(d => `<tr><td>${d.id}</td><td>${d.desc}</td><td>$${(d.amount/100).toLocaleString()}</td><td><span class="status-badge status-positive">${d.status}</span></td></tr>`).join('')}
                    </tbody>
                </table>`;
        } else if (v === 'mm') {
            html += `
                <div class="sap-toolbar"><button class="btn-primary">Create Purchase Order</button></div>
                <table class="sap-table">
                    <thead><tr><th>PO ID</th><th>Vendor</th><th>Value</th><th>Status</th></tr></thead>
                    <tbody>
                        ${this.state.mm.pos.map(p => `<tr><td>${p.id}</td><td>${p.vendor}</td><td>$${(p.value/100).toLocaleString()}</td><td><span class="status-badge status-critical">${p.status}</span></td></tr>`).join('')}
                    </tbody>
                </table>`;
        } else if (v === 'intelligence') {
            html += `
                <div class="metric-grid">
                    <div class="metric-card"><h3>Sovereign Credit Score</h3><div class="val" style="color:var(--fiori-success)">${this.state.intelligence.scsScore}</div></div>
                    <div class="metric-card"><h3>Liquidity Ratio</h3><div class="val">${this.state.intelligence.lcr}x</div></div>
                    <div class="metric-card"><h3>Market Sentiment</h3><div class="val">${this.state.intelligence.sentiment}</div></div>
                </div>`;
        }

        html += `</div>`;
        container.innerHTML = html;
    },

    getModuleTitle(v) {
        const titles = { fi: 'General Ledger', mm: 'Procurement', sd: 'Sales Hub', intelligence: 'Intelligence Hub', vault: 'Trust Vault' };
        return titles[v] || 'Module';
    },

    loadLocalState() {
        const saved = localStorage.getItem('sovereign_state');
        if (saved) this.state = { ...this.state, ...JSON.parse(saved) };
    },

    saveLocalState() {
        localStorage.setItem('sovereign_state', JSON.stringify(this.state));
    }
};

window.app = SovereignOS;
window.setView = (v) => SovereignOS.setView(v);
document.addEventListener('DOMContentLoaded', () => SovereignOS.init());

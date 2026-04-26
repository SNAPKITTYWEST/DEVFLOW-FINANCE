// SOVEREIGN OS - SAP STANDARD ERP + AI COPILOT
// ============================================================================
// Steve Jobs UX: Fully integrated SAP ERP with AI Copilot
// ============================================================================

const SovereignOS = {
    // CONFIG: External API Endpoints
    CONFIG: {
        BIFROST_ENDPOINT: 'http://localhost:5000/api',
        SYNC_INTERVAL: 30000,
        OFFLINE_MODE: false,
        AI_ENABLED: true
    },

    // STATE: SAP ERP Modules + AI Copilot
    state: {
        view: 'dashboard',
        
        // FI - Financial Accounting
        fi: {
            ledger: {
                canonicalBalance: 124500000,
                currency: 'USD',
                history: []
            },
            documents: [],
            parkedDocuments: []
        },
        
        // CO - Controlling
        co: {
            costCenters: [
                { id: 'CC-001', name: 'Operations', budget: 50000000, actual: 32500000 },
                { id: 'CC-002', name: 'Marketing', budget: 15000000, actual: 8750000 },
                { id: 'CC-003', name: 'R&D', budget: 25000000, actual: 18200000 }
            ],
            internalOrders: []
        },
        
        // MM - Materials Management
        mm: {
            vendors: [
                { id: 'V-001', name: 'AWS Services', paymentTerms: 'NET30', creditLimit: 100000000 },
                { id: 'V-002', name: 'Google Cloud', paymentTerms: 'NET45', creditLimit: 75000000 }
            ],
            purchaseOrders: [],
            goodsReceipts: []
        },
        
        // SD - Sales Distribution
        sd: {
            customers: [],
            salesOrders: [],
            invoices: []
        },
        
        // AI Copilot State
        ai: {
            enabled: true,
            context: [],
            lastQuery: null
        },
        
        // CRM - Legacy Entity Management
        contacts: [
            { id: '1', name: 'SnapKitty DIF', email: 'treasury@snapkitty.org', status: 'Active' },
            { id: '2', name: 'Open Collective Oracle', email: 'sync@opencollective.com', status: 'Synchronized' }
        ],
        
        // Intelligence
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

    // SAP Transaction Code Registry
    TX_CODES: {
        // FI Transaction Codes
        FB01: 'Post Document',
        FB02: 'Change Document',
        FB03: 'Display Document',
        FB50: 'Park Document',
        FBV1: 'Parked Document',
        F-04: 'Post with clearing',
        F-51: 'Recurring entry',
        
        // CO Transaction Codes
        KB11: 'Actual Cost',
        KB31: 'Revenue',
        KOB1: 'CO Line Item',
        
        // MM Transaction Codes
        ME21: 'Create PO',
        ME22: 'Change PO',
        ME23: 'Display PO',
        MIGO: 'Goods Movement',
        MB1A: 'Goods Issue',
        MB1B: 'Goods Receipt',
        
        // SD Transaction Codes
        VA01: 'Create Sales Order',
        VA02: 'Change Sales Order',
        VA03: 'Display Sales Order',
        VF01: 'Create Invoice',
        VL01: 'Create Delivery'
    },

    async init() {
        this.loadState();
        this.render();
        
        // Initialize AI Copilot
        if (this.CONFIG.AI_ENABLED) {
            this.initCopilot();
        }
        
        await this.syncWithBifrost();
        
        if (this.CONFIG.SYNC_INTERVAL > 0) {
            setInterval(() => this.syncWithBifrost(), this.CONFIG.SYNC_INTERVAL);
        }
        
        console.log("Sovereign OS SAP: Active");
    },

    // ============================================================================
    // AI COPILOT: Natural Language Processing
    // ============================================================================
    initCopilot() {
        const input = document.getElementById('ai-input');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && input.value) {
                    this.processAIQuery(input.value);
                    input.value = '';
                }
            });
        }
    },

    async processAIQuery(query) {
        const normalized = query.toLowerCase().trim();
        
        // Add to context
        this.state.ai.context.push({ role: 'user', text: query, timestamp: new Date().toISOString() });
        
        let response = '';
        
        // FI Commands
        if (normalized.includes('balance') || normalized.includes('ledger')) {
            const bal = (this.state.fi.ledger.canonicalBalance / 100).toLocaleString('en-US', {style:'currency', currency:'USD'});
            response = `Current Canonical Ledger Balance: ${bal}`;
        }
        else if (normalized.includes('post fb01') || normalized.includes('post document')) {
            response = 'Opening FB01 - Post Document. Use the Ledger modal.';
        }
        else if (normalized.includes('park') || normalized.includes('fb50')) {
            response = 'Opening FB50 - Park Document for approval workflow.';
        }
        
        // CO Commands
        else if (normalized.includes('budget') || normalized.includes('cost center')) {
            const cc = this.state.co.costCenters[0];
            response = `Cost Center ${cc.id}: ${cc.name} - Budget: $${(cc.budget/100).toLocaleString()} | Actual: $${(cc.actual/100).toLocaleString()}`;
        }
        else if (normalized.includes('actual') || normalized.includes('kb11')) {
            response = 'Opening KB11 - Actual Cost Entry.';
        }
        
        // MM Commands
        else if (normalized.includes('po') || normalized.includes('purchase order')) {
            response = `Vendors: ${this.state.mm.vendors.map(v => v.name).join(', ')}. Use ME21 to create PO.`;
        }
        else if (normalized.includes('goods') || normalized.includes('migo')) {
            response = 'Opening MIGO - Goods Movement.';
        }
        
        // SD Commands
        else if (normalized.includes('sales order') || normalized.includes('va01')) {
            response = 'Opening VA01 - Create Sales Order.';
        }
        else if (normalized.includes('invoice') || normalized.includes('vf01')) {
            response = 'Opening VF01 - Create Invoice.';
        }
        
        // Intelligence Queries
        else if (normalized.includes('scs') || normalized.includes('credit score')) {
            const { scs } = this.calculateSCS();
            const tier = this.getRiskTier(scs);
            response = `Sovereign Credit Score: ${scs} (${tier.label})`;
        }
        else if (normalized.includes('lcr')) {
            const { lcr } = this.calculateSCS();
            response = `Liquidity Coverage Ratio: ${lcr.toFixed(2)}x`;
        }
        
        // Help
        else if (normalized.includes('help') || normalized.includes('what can')) {
            response = 'AI Copilot: Ask about [balance, post FB01, park FB50, budget, cost center, PO, goods MIGO, sales order VA01, invoice VF01, SCS, LCR]';
        }
        
        // Default
        else {
            response = `Processing: "${query}". Try "AI help" for available commands.`;
        }
        
        this.state.ai.context.push({ role: 'assistant', text: response, timestamp: new Date().toISOString() });
        this.state.ai.lastQuery = query;
        
        this.showAINotification(response);
        this.render();
    },

    showAINotification(message) {
        const existing = document.getElementById('ai-response');
        if (existing) existing.remove();
        
        const notif = document.createElement('div');
        notif.id = 'ai-response';
        notif.style.cssText = `
            position: fixed; bottom: 80px; right: 20px; 
            background: #0d6b50; color: white; padding: 15px 20px; 
            border-radius: 8px; max-width: 350px;
            font-family: 'Courier New', monospace; font-size: 0.85rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notif.textContent = '🤖 ' + message;
        document.body.appendChild(notif);
        
        setTimeout(() => notif.remove(), 8000);
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
    // BIFROST SYNC: Unified Enterprise Execution Mesh
    // ============================================================================
    async syncWithBifrost() {
        const indicator = document.getElementById('sync-status');
        if (indicator) {
            indicator.innerHTML = '<span class="pulse sync-indicator"></span>SYNCING...';
        }

        try {
            const correlationId = crypto.randomUUID();

            // 1. Intelligence Hub - Business Pulse Analytics
            const pulseResponse = await fetch(`${this.CONFIG.BIFROST_ENDPOINT}/intelligence/pulse`, {
                headers: { 'X-Correlation-ID': correlationId }
            });
            if (pulseResponse.ok) {
                const pulse = await pulseResponse.json();
                this.state.intelligence.scsScore = pulse.metrics.scsScore;
                this.state.intelligence.vaultValue = parseInt(pulse.metrics.liquidityCents);
                this.state.intelligence.pipelineValue = parseInt(pulse.metrics.pipelineValueCents);
            }

            // 2. MM Module - Procurement & Vendor Sync
            const vendorResponse = await fetch(`${this.CONFIG.BIFROST_ENDPOINT}/procurement/vendors`, {
                headers: { 'X-Correlation-ID': correlationId }
            });
            if (vendorResponse.ok) {
                this.state.mm.vendors = await vendorResponse.json();
            }

            // 3. FI Module - Ledger Handshake
            const syncResponse = await fetch(`${this.CONFIG.BIFROST_ENDPOINT}/finance/bifrost/sync`, {
                method: 'POST',
                headers: { 'X-Correlation-ID': correlationId }
            });
            if (syncResponse.ok) {
                const data = await syncResponse.json();
                this.state.fi.ledger.canonicalBalance = (data.vaultValue || 0);
            }

            // 4. Activity Stream (Global Event Bus)
            const eventResponse = await fetch(`${this.CONFIG.BIFROST_ENDPOINT}/activity`, {
                headers: { 'X-Correlation-ID': correlationId }
            });
            if (eventResponse.ok) {
                const eventData = await eventResponse.json();
                if (eventData.events) {
                    this.state.fi.ledger.history = eventData.events;
                }
            }

            this.saveState();
            if (indicator) indicator.innerHTML = '<span class="sync-indicator"></span>BIFROST: STABLE';
            this.render();
            
        } catch (error) {
            console.warn(">>> [BIFROST] Enterprise Sync Interrupted.", error.message);
            if (indicator) indicator.innerHTML = '<span class="sync-indicator" style="background:#f87171;"></span>BIFROST: OFFLINE';
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

    // ============================================================================
    // SCS CALCULATION
    // ============================================================================
    calculateSCS() {
        const { intelligence, fi } = this.state;
        const lcr = intelligence.vaultValue / (intelligence.pipelineValue || 1);
        
        const liquidityScore = Math.min(200, Math.floor(fi.ledger.canonicalBalance / 1000));
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
    // AUTHENTICATION: Microsoft Entra ID
    // ============================================================================
    initLogin() {
        console.log(">>> [AUTH] Initiating Microsoft Entra Login...");
        // Redirect to the backend auth route
        window.location.href = "http://localhost:3000/auth/login";
    },

    checkAuth() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const user = urlParams.get('user');
        const status = urlParams.get('auth_status');

        if (status === 'success' && token) {
            console.log(`>>> [AUTH] Welcome, ${user}. Session Authenticated.`);
            this.state.user = { name: user, token: token, isAuthenticated: true };
            this.pushActivity(`User ${user} authenticated via Entra ID.`, 'IDENTITY_AUTH');
            this.saveState();

            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    },

    // ============================================================================
    // NAVIGATION: S/4HANA Shell Controller
    // ============================================================================
    setView(view) {
        console.log(`>>> [SHELL] Navigating to: ${view.toUpperCase()}`);
        this.state.view = view;

        const launchpad = document.getElementById('launchpad');
        const viewContainer = document.getElementById('view-container');

        if (view === 'dashboard' || view === 'terminal') {
            if (launchpad) launchpad.style.display = 'grid';
            if (viewContainer) viewContainer.style.display = 'none';
        } else {
            if (launchpad) launchpad.style.display = 'none';
            if (viewContainer) {
                viewContainer.style.display = 'block';
                this.renderView(view);
            }
        }

        this.saveState();
    },

    renderView(viewName) {
        const container = document.getElementById('view-container');
        const title = viewName.toUpperCase();

        container.innerHTML = `
            <div class="object-page fade-in">
                <div class="object-header">
                    <div style="margin-bottom:20px;">
                        <button class="btn-primary" onclick="app.setView('dashboard')" style="background:var(--fiori-text-muted)">← Back to Launchpad</button>
                    </div>
                    <h1 class="object-title">${title} Module</h1>
                    <p class="object-subtitle">Sovereign OS | S/4HANA Extension</p>
                </div>
                <div id="module-content">
                    ${this.getModuleContent(viewName)}
                </div>
            </div>
        `;
    },

    getModuleContent(viewName) {
        // High-Density Data Grids for SAP Modules
        if (viewName === 'fi') {
            return `
                <h3>General Ledger (FB01)</h3>
                <table class="sap-table">
                    <thead>
                        <tr><th>Doc ID</th><th>Type</th><th>Amount</th><th>Posting Date</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        ${this.state.fi.documents.map(doc => `
                            <tr>
                                <td>${doc.id}</td>
                                <td>${doc.type}</td>
                                <td>$${(doc.amount/100).toLocaleString()}</td>
                                <td>${doc.postingDate}</td>
                                <td><span class="status-badge status-positive">${doc.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        if (viewName === 'intelligence') {
            return `
                <div class="metric-card">
                    <div class="metric-label">Sovereign Credit Score (SCS)</div>
                    <div class="metric-value" style="color:var(--fiori-success)">${this.state.intelligence.scsScore}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Liquidity Coverage Ratio (LCR)</div>
                    <div class="metric-value">${this.state.intelligence.lcr}x</div>
                </div>
            `;
        }

        return `<p>Module ${viewName.toUpperCase()} is initializing...</p>`;
    },

    // ============================================================================
    // SAP FI: Document Posting (FB01)
    // ============================================================================
    postDocument(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const doc = {
            id: 'DOC-' + Date.now(),
            txCode: 'FB01',
            type: formData.get('docType'),
            amount: parseInt(formData.get('amount') || '0') * 100,
            text: formData.get('text'),
            postingDate: new Date().toISOString().split('T')[0],
            status: 'Posted'
        };
        
        this.state.fi.documents.unshift(doc);
        this.state.fi.ledger.canonicalBalance += doc.amount;
        
        // Add to ledger history
        this.state.fi.ledger.history.unshift({
            id: doc.id,
            type: doc.type,
            delta: doc.amount,
            status: 'Finalized'
        });
        
        this.saveState();
        document.getElementById('fi-modal').style.display = 'none';
        this.setView('fi');
    },

    // ============================================================================
    // SAP FI: Document Parking (FB50)
    // ============================================================================
    parkDocument(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const doc = {
            id: 'PARK-' + Date.now(),
            txCode: 'FB50',
            type: formData.get('docType'),
            amount: parseInt(formData.get('amount') || '0') * 100,
            text: formData.get('text'),
            postingDate: formData.get('postingDate') || new Date().toISOString().split('T')[0],
            status: 'Parked'
        };
        
        this.state.fi.parkedDocuments.unshift(doc);
        
        this.saveState();
        document.getElementById('fi-modal').style.display = 'none';
        this.showAINotification(`Document ${doc.id} parked for approval.`);
        this.setView('fi');
    },

    // ============================================================================
    // CO: Cost Center Entry
    // ============================================================================
    addCostCenter(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const cc = {
            id: 'CC-' + (this.state.co.costCenters.length + 1).toString().padStart(3, '0'),
            name: formData.get('name'),
            budget: parseInt(formData.get('budget') || '0') * 100,
            actual: 0
        };
        
        this.state.co.costCenters.unshift(cc);
        this.saveState();
        this.setView('co');
    },

    // ============================================================================
    // MM: PO Creation (ME21)
    // ============================================================================
    createPurchaseOrder(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const po = {
            id: 'PO-' + Date.now(),
            txCode: 'ME21',
            vendor: formData.get('vendor'),
            material: formData.get('material'),
            quantity: parseInt(formData.get('quantity') || '0'),
            netValue: parseInt(formData.get('value') || '0') * 100,
            status: 'Created'
        };
        
        this.state.mm.purchaseOrders.unshift(po);
        this.saveState();
        this.setView('mm');
    },

    // ============================================================================
    // SD: Sales Order (VA01)
    // ============================================================================
    createSalesOrder(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        const so = {
            id: 'SO-' + Date.now(),
            txCode: 'VA01',
            customer: formData.get('customer'),
            material: formData.get('material'),
            quantity: parseInt(formData.get('quantity') || '0'),
            netValue: parseInt(formData.get('value') || '0') * 100,
            status: 'Created'
        };
        
        this.state.sd.salesOrders.unshift(so);
        this.saveState();
        this.setView('sd');
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
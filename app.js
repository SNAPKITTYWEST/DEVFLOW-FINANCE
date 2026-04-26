// SOVEREIGN OS - CORE EXECUTION ENGINE
let state = {
    view: 'dashboard',
    contacts: [
        { id: '1', name: 'SnapKitty DIF', email: 'treasury@snapkitty.org', status: 'Active' },
        { id: '2', name: 'Open Collective Oracle', email: 'sync@opencollective.com', status: 'Synchronized' },
        { id: '3', name: 'Lexus Nexus Bridge', email: 'verify@lexus.io', status: 'Pending' }
    ],
    ledger: {
        canonicalBalance: 124500000, // Cents
        currency: 'USD',
        lastReconciled: '2023-10-27T10:00:00Z'
    }
};

function toDollars(cents) {
    return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function render() {
    const container = document.getElementById('view-container');

    if (state.view === 'crm') {
        container.innerHTML = `
            <h2>Sovereign CRM Pipeline</h2>
            <p>Managing high-velocity multi-entity contacts.</p>
            <table class="data-grid">
                <thead>
                    <tr>
                        <th>Entity Name</th>
                        <th>Bifrost Endpoint</th>
                        <th>Compliance Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.contacts.map(c => `
                        <tr>
                            <td>${c.name}</td>
                            <td>${c.email}</td>
                            <td><span style="color: ${c.status === 'Active' ? 'green' : 'orange'}">●</span> ${c.status}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (state.view === 'ledger') {
        container.innerHTML = `
            <h2>Canonical Ledger</h2>
            <div class="balance-card">
                <div style="font-size: 0.8rem; color: #909399;">SSOT PRIMARY BALANCE</div>
                <div class="balance-val">${toDollars(state.ledger.canonicalBalance)}</div>
                <div style="font-size: 0.7rem; color: #909399; margin-top: 10px;">Last Reconciled: ${state.ledger.lastReconciled}</div>
            </div>
            <table class="data-grid">
                <thead>
                    <tr><th>Event ID</th><th>Type</th><th>Delta</th><th>Status</th></tr>
                </thead>
                <tbody>
                    <tr><td>TX-9901</td><td>REVENUE_REC</td><td>+$5,000.00</td><td>Finalized</td></tr>
                    <tr><td>TX-9902</td><td>GRANT_DISBURSE</td><td>-$1,200.00</td><td>Finalized</td></tr>
                </tbody>
            </table>
        `;
    } else {
        container.innerHTML = `
            <div style="border-left: 4px solid var(--accent); padding-left: 20px;">
                <h2>System Overview</h2>
                <p>Welcome to the <strong>DevFlow Sovereign OS</strong> terminal. This instance is configured for <strong>collectivekitty.com</strong>.</p>
                <p>Status: <strong>Operational</strong></p>
                <p>Compliance Mode: <strong>ASC 606 / SOX Ready</strong></p>
            </div>
        `;
    }
}

function setView(view) {
    state.view = view;
    document.getElementById('view-title').innerText = view.charAt(0).toUpperCase() + view.slice(1) + " Console";
    render();
}

// Initial Boot Sequence
console.log("Sovereign OS Booting...");
render();
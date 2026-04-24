-- Ledger Reconciliation Rules
-- ============================
-- SOX-ready reconciliation engine for multi-entity ledger verification.

-- Canonical Ledger: Single Source of Truth
CREATE TABLE IF NOT EXISTS canonical_ledger (
    id TEXT PRIMARY KEY,
    entity_id TEXT NOT NULL,
    balance_cents INTEGER NOT NULL,
    vault_cents INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    last_synced TIMESTAMP,
    reconciled_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Segment Ledgers: Operational views
CREATE TABLE IF NOT EXISTS segment_ledgers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('nonprofit', 'bcorp', 'trust')),
    parent_ledger TEXT REFERENCES canonical_ledger(id),
    balance_cents INTEGER NOT NULL,
    vault_cents INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    last_sync TIMESTAMP
);

-- Reconciliation Audit Trail
CREATE TABLE IF NOT EXISTS reconciliation_log (
    id TEXT PRIMARY KEY,
    source_system TEXT NOT NULL,
    destination_system TEXT NOT NULL,
    local_balance_cents INTEGER NOT NULL,
    api_balance_cents INTEGER NOT NULL,
    delta_cents INTEGER GENERATED ALWAYS AS (api_balance_cents - local_balance_cents) STORED,
    status TEXT CHECK(status IN ('VERIFIED', 'DEGRADED', 'FAILED')),
    reconciliation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    policy TEXT DEFAULT 'PRIMARY_WINS'
);

-- Reconciliation Check Function
CREATE OR REPLACE FUNCTION check_reconciliation(
    p_entity_id TEXT,
    p_api_balance INTEGER
) RETURNS TABLE (
    status TEXT,
    delta_cents INTEGER,
    action TEXT
) AS $$
DECLARE
    v_local_balance INTEGER;
    v_delta INTEGER;
BEGIN
    SELECT balance_cents INTO v_local_balance 
    FROM segment_ledgers WHERE id = p_entity_id;
    
    v_delta := p_api_balance - v_local_balance;
    
    IF ABS(v_delta) > 1 THEN
        RETURN QUERY SELECT 'DEGRADED', v_delta, 'RETRY_SYNC';
    ELSE
        RETURN QUERY SELECT 'VERIFIED', v_delta, 'NO_ACTION';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- View: Consolidated Position
CREATE OR REPLACE VIEW v_consolidated_position AS
SELECT 
    'CONSOLIDATED' AS entity_type,
    SUM(balance_cents) AS total_balance_cents,
    SUM(vault_cents) AS total_vault_cents,
    COUNT(*) AS entity_count
FROM segment_ledgers;

-- Grant access
GRANT SELECT ON v_consolidated_position TO PUBLIC;
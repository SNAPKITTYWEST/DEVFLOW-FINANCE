"""
Sovereign Credit Scoring (SCS) Model
===================================
Internal operational risk model (non-credit, non-financial decisioning).
Version: 2.1

Features:
- Liquidity Coverage Ratio (primary)
- Trust Vault Value (collateral base)
- Pipeline Velocity (deal flow rate)
- Historical Drift (trend analysis)
"""

import math
from datetime import datetime

SCS_VERSION = "2.1.0"

def calculate_scs(liquid_balance, pipeline_value, vault_value, deal_velocity):
    """
    Composite SCS score (0-850 scale)
    Non-credit operational risk metric
    """
    lcr = vault_value / pipeline_value if pipeline_value > 0 else 2.0
    
    liquidity_score = min(200, int(liquid_balance / 1000))
    vault_score = min(200, int(vault_value / 5000))
    velocity_score = min(100, int(deal_velocity * 10))
    lcr_score = int((lcr - 0.5) * 100) if lcr >= 0.5 else 0
    
    base_score = 400
    scs = base_score + liquidity_score + vault_score + velocity_score + lcr_score
    
    return min(850, max(500, scs))

def get_risk_tier(scs):
    """Risk classification for UI badges"""
    if scs >= 700:
        return "MINIMAL RISK", "low"
    elif scs >= 600:
        return "STABLE", "medium"
    else:
        return "EXPANDING", "high"

def calculate_lcr(liquid_balance, pipeline_liability):
    """Liquidity Coverage Ratio"""
    if pipeline_liability <= 0:
        return 2.0 if liquid_balance > 0 else 0.0
    return liquid_balance / pipeline_liability

if __name__ == "__main__":
    # Demo calculation
    scs = calculate_scs(50000, 35000, 100000, 5)
    tier, css = get_risk_tier(scs)
    print(f"SCS {SCS_VERSION}: {scs} ({tier})")
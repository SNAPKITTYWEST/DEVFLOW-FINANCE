from models.event import BifrostEvent, ScoreResult
from datetime import datetime
from typing import List, Tuple
import uuid

def calculate_risk_score(
    event: BifrostEvent
) -> Tuple[float, str, List[str], float]:

    score = 0.0
    flags = []
    payload = event.payload

    # Amount scoring
    amount = float(payload.get("amount", 0))
    if amount > 50000:
        score += 50
        flags.append("VERY_HIGH_VALUE")
    elif amount > 10000:
        score += 30
        flags.append("HIGH_VALUE")
    elif amount > 1000:
        score += 10
        flags.append("MEDIUM_VALUE")

    # Vendor scoring
    if not payload.get("vendorId") and not payload.get("vendor"):
        score += 20
        flags.append("NO_VENDOR")

    # Priority scoring
    if payload.get("priority") == "urgent":
        score += 15
        flags.append("URGENT")

    # Project linkage
    if not payload.get("projectId"):
        score += 5
        flags.append("NO_PROJECT")

    # Source scoring
    source_risk = {
        "manual": 10,
        "api": 5,
        "automated": 2,
        "crm": 0
    }
    score += source_risk.get(event.source, 8)

    score = min(score, 100)

    # Determine level
    if score >= 70:
        level = "CRITICAL"
    elif score >= 50:
        level = "HIGH"
    elif score >= 30:
        level = "MEDIUM"
    else:
        level = "LOW"

    confidence = 0.95 if amount > 0 else 0.70

    return score, level, flags, confidence

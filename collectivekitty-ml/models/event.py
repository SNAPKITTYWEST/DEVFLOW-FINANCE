from pydantic import BaseModel
from typing import Any, Dict, Optional
from datetime import datetime

class BifrostEvent(BaseModel):
    event_type: str
    source: str
    payload: Dict[str, Any]
    timestamp: str
    trace_id: str
    version: str = "v1"

class ScoreResult(BaseModel):
    trace_id: str
    score: float
    level: str  # LOW | MEDIUM | HIGH | CRITICAL
    flags: list[str]
    confidence: float
    timestamp: str

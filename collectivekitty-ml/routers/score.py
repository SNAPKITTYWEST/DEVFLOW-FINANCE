from fastapi import APIRouter, HTTPException
from models.event import BifrostEvent, ScoreResult
from services.scoring_engine import calculate_risk_score
from datetime import datetime

router = APIRouter()

@router.post("/event", response_model=ScoreResult)
async def score_event(event: BifrostEvent):
    try:
        score, level, flags, confidence = \
            calculate_risk_score(event)

        return ScoreResult(
            trace_id=event.trace_id,
            score=score,
            level=level,
            flags=flags,
            confidence=confidence,
            timestamp=datetime.utcnow().isoformat()
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Scoring failed: {str(e)}"
        )

@router.post("/batch")
async def score_batch(events: list[BifrostEvent]):
    results = []
    for event in events:
        score, level, flags, confidence = \
            calculate_risk_score(event)
        results.append({
            "trace_id": event.trace_id,
            "score": score,
            "level": level,
            "flags": flags,
            "confidence": confidence
        })
    return { "results": results, "count": len(results) }

from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def predict_base():
    return {"message": "Bifrost Prediction Engine Active"}

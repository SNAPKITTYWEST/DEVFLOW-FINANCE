from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import score, predict

app = FastAPI(
    title="Bifrost ML Service",
    description="SnapKitty Intelligence Layer",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://collectivekitty.com"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(score.router, prefix="/score")
app.include_router(predict.router, prefix="/predict")

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "bifrost-ml",
        "version": "1.0.0"
    }

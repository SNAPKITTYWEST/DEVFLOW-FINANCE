# Bifrost ML Service
Python FastAPI microservice for SnapKitty intelligence layer.

## Purpose
Handles all ML scoring and risk classification
separate from the Next.js application layer.

## Endpoints
POST /score/event    - Score single event
POST /score/batch    - Score multiple events
POST /predict        - Predict pipeline outcome
GET  /health         - Service health check

## Run locally
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

## Deploy
Azure Container Apps (recommended)
Or: Railway, Render, Fly.io (free tiers available)

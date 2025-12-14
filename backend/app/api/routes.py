"""
API Routes
"""
from fastapi import APIRouter

from app.api.endpoints import agents, debate, ollama

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(debate.router, prefix="/debate", tags=["debate"])
api_router.include_router(ollama.router, prefix="/ollama", tags=["ollama"])

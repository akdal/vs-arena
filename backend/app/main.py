"""
VS Arena Backend - FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.routes import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    print("🚀 VS Arena Backend starting...")
    yield
    # Shutdown
    print("👋 VS Arena Backend shutting down...")


app = FastAPI(
    title="VS Arena API",
    description="""
## AI Debate Agent Platform Backend

VS Arena is an AI-powered debate platform where customizable LLM agents engage in structured debates.

### Features
- **Agent Management**: Create and customize debate agents with unique personas
- **Debate Execution**: Run structured debates with real-time SSE streaming
- **Judging System**: Automated scoring with detailed rubrics
- **Bias Detection**: Swap tests to analyze position bias

### SSE Event Types
When streaming debates, the following events are emitted:
- `phase_start` - Debate phase begins
- `token` - Streamed token from LLM
- `score` - Phase scoring result
- `phase_end` - Phase completion
- `verdict` - Final judgment
- `run_complete` - Debate finished
- `error` - Error occurred
    """,
    version="1.0.0",
    lifespan=lifespan,
    openapi_tags=[
        {
            "name": "agents",
            "description": "Agent CRUD operations and preview functionality. Create, read, update, delete, and test debate agents.",
        },
        {
            "name": "debate",
            "description": "Debate execution and management. Start debates, stream progress, retrieve results, and analyze bias.",
        },
        {
            "name": "ollama",
            "description": "Ollama LLM service integration. Check available models and server status.",
        },
    ],
    license_info={
        "name": "MIT",
    },
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "VS Arena API",
        "version": "0.1.0",
        "status": "running",
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}

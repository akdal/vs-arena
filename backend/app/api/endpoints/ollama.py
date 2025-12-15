"""
Ollama API Endpoints
"""
from fastapi import APIRouter, HTTPException
import httpx

from app.core.config import settings

router = APIRouter()


@router.get(
    "/models",
    summary="List available models",
    description="""
Retrieve all models available in the local Ollama installation.

**Response Format:**
```json
{
  "models": [
    {"name": "llama3.2", "size": "2.0 GB", "quantization": "Q4_0"},
    {"name": "qwen2.5:7b", "size": "4.7 GB", "quantization": "Q4_K_M"}
  ]
}
```

**Error Codes:**
- `503` - Ollama server is not running
- `500` - Failed to fetch models
    """,
)
async def list_models():
    """Get available Ollama models"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.OLLAMA_BASE_URL}/api/tags",
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
            
            # Transform to our format
            models = [
                {
                    "name": model["name"],
                    "size": model.get("size", "Unknown"),
                    "quantization": model.get("details", {}).get("quantization_level", "Unknown")
                }
                for model in data.get("models", [])
            ]
            
            return {"models": models}
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Ollama server is not available. Please ensure Ollama is running."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch models: {str(e)}"
        )


@router.get(
    "/status",
    summary="Check Ollama status",
    description="""
Check the status of the local Ollama server.

**Response Format:**
```json
{
  "status": "online",   // "online", "offline", or "error"
  "url": "http://localhost:11434"
}
```

**Status Values:**
- `online` - Ollama server is running and responsive
- `offline` - Cannot connect to Ollama server
- `error` - Connected but encountered an error (includes error message)
    """,
)
async def get_status():
    """Check Ollama server status"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.OLLAMA_BASE_URL}/api/tags",
                timeout=5.0
            )
            response.raise_for_status()
            return {
                "status": "online",
                "url": settings.OLLAMA_BASE_URL
            }
    except httpx.ConnectError:
        return {
            "status": "offline",
            "url": settings.OLLAMA_BASE_URL
        }
    except Exception as e:
        return {
            "status": "error",
            "url": settings.OLLAMA_BASE_URL,
            "error": str(e)
        }

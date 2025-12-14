"""
Ollama Client Service
Provides wrapper functions for interacting with Ollama API
"""
import httpx
import json
import logging
from typing import AsyncGenerator, Optional, Dict, Any

from app.core.config import settings

logger = logging.getLogger(__name__)


async def call_ollama(
    model: str,
    prompt: str,
    system: Optional[str] = None,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
) -> str:
    """
    Call Ollama API and return the complete response.

    Args:
        model: Model name (e.g., "llama3", "qwen2.5")
        prompt: User prompt
        system: System prompt (optional)
        temperature: Temperature parameter (default from settings)
        max_tokens: Max tokens to generate (default from settings)

    Returns:
        Generated text response

    Raises:
        httpx.HTTPError: If the request fails
    """
    temperature = settings.DEFAULT_TEMPERATURE if temperature is None else temperature
    max_tokens = settings.DEFAULT_MAX_TOKENS if max_tokens is None else max_tokens

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens,
        }
    }

    if system:
        payload["system"] = system

    try:
        async with httpx.AsyncClient(timeout=settings.OLLAMA_TIMEOUT) as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")

    except httpx.ConnectError as e:
        logger.error(f"Ollama connection error: {e}")
        raise
    except httpx.HTTPError as e:
        logger.error(f"Ollama HTTP error: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error calling Ollama: {e}")
        raise


async def stream_ollama(
    model: str,
    prompt: str,
    system: Optional[str] = None,
    temperature: Optional[float] = None,
    max_tokens: Optional[int] = None,
) -> AsyncGenerator[str, None]:
    """
    Call Ollama API with streaming and yield response chunks.

    Args:
        model: Model name (e.g., "llama3", "qwen2.5")
        prompt: User prompt
        system: System prompt (optional)
        temperature: Temperature parameter (default from settings)
        max_tokens: Max tokens to generate (default from settings)

    Yields:
        Text chunks as they are generated

    Raises:
        httpx.HTTPError: If the request fails
    """
    temperature = settings.DEFAULT_TEMPERATURE if temperature is None else temperature
    max_tokens = settings.DEFAULT_MAX_TOKENS if max_tokens is None else max_tokens

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": True,
        "options": {
            "temperature": temperature,
            "num_predict": max_tokens,
        }
    }

    if system:
        payload["system"] = system

    try:
        async with httpx.AsyncClient(timeout=settings.OLLAMA_TIMEOUT) as client:
            async with client.stream(
                "POST",
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json=payload
            ) as response:
                response.raise_for_status()

                async for line in response.aiter_lines():
                    if line.strip():
                        try:
                            data = json.loads(line)
                            if "response" in data:
                                yield data["response"]

                            # Check if generation is done
                            if data.get("done", False):
                                break
                        except json.JSONDecodeError:
                            logger.warning(f"Failed to decode JSON: {line}")
                            continue

    except httpx.ConnectError as e:
        logger.error(f"Ollama connection error: {e}")
        raise
    except httpx.HTTPError as e:
        logger.error(f"Ollama HTTP error: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error streaming from Ollama: {e}")
        raise


async def get_model_info(model: str) -> Optional[Dict[str, Any]]:
    """
    Get information about a specific model.

    Args:
        model: Model name

    Returns:
        Model information dictionary or None if not found
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/show",
                json={"name": model}
            )
            response.raise_for_status()
            return response.json()

    except httpx.HTTPError:
        logger.warning(f"Model {model} not found")
        return None
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        return None

"""
Utility functions for debate nodes
"""
import asyncio
import logging
from typing import AsyncGenerator, Dict, Any
import httpx

from app.services.ollama import stream_ollama, call_ollama

logger = logging.getLogger(__name__)


async def stream_ollama_with_retry(
    model: str,
    prompt: str,
    system: str = None,
    temperature: float = 0.7,
    max_tokens: int = 1024,
    max_retries: int = 3
) -> AsyncGenerator[str, None]:
    """
    Stream from Ollama with exponential backoff retry.

    Args:
        model: Ollama model name
        prompt: User prompt
        system: System prompt (optional)
        temperature: Temperature parameter
        max_tokens: Max tokens to generate
        max_retries: Maximum retry attempts

    Yields:
        Text chunks as they're generated

    Raises:
        httpx.HTTPError: If all retries fail
    """
    for attempt in range(max_retries):
        try:
            async for chunk in stream_ollama(
                model=model,
                prompt=prompt,
                system=system,
                temperature=temperature,
                max_tokens=max_tokens
            ):
                yield chunk
            return  # Success

        except httpx.ConnectError as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # 1s, 2s, 4s
                logger.warning(
                    f"Ollama connection failed, retry {attempt+1}/{max_retries} in {wait_time}s: {e}"
                )
                await asyncio.sleep(wait_time)
            else:
                logger.error(f"Ollama connection failed after {max_retries} attempts")
                raise

        except httpx.TimeoutException as e:
            if attempt < max_retries - 1:
                wait_time = (2 ** attempt) * 1.5  # 1.5s, 3s, 6s
                logger.warning(
                    f"Ollama timeout, retry {attempt+1}/{max_retries} in {wait_time}s: {e}"
                )
                await asyncio.sleep(wait_time)
            else:
                logger.error(f"Ollama timeout after {max_retries} attempts")
                raise

        except Exception as e:
            logger.error(f"Unexpected error streaming from Ollama: {e}")
            raise


async def call_ollama_with_retry(
    model: str,
    prompt: str,
    system: str = None,
    temperature: float = 0.3,
    max_tokens: int = 1024,
    max_retries: int = 3
) -> str:
    """
    Call Ollama with exponential backoff retry.

    Args:
        model: Ollama model name
        prompt: User prompt
        system: System prompt (optional)
        temperature: Temperature parameter
        max_tokens: Max tokens to generate
        max_retries: Maximum retry attempts

    Returns:
        Generated text response

    Raises:
        httpx.HTTPError: If all retries fail
    """
    for attempt in range(max_retries):
        try:
            response = await call_ollama(
                model=model,
                prompt=prompt,
                system=system,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response

        except httpx.ConnectError as e:
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                logger.warning(
                    f"Ollama connection failed, retry {attempt+1}/{max_retries} in {wait_time}s"
                )
                await asyncio.sleep(wait_time)
            else:
                raise

        except httpx.TimeoutException as e:
            if attempt < max_retries - 1:
                wait_time = (2 ** attempt) * 1.5
                logger.warning(
                    f"Ollama timeout, retry {attempt+1}/{max_retries} in {wait_time}s"
                )
                await asyncio.sleep(wait_time)
            else:
                raise

        except Exception as e:
            logger.error(f"Unexpected error calling Ollama: {e}")
            raise


def build_system_prompt(persona: Dict[str, Any]) -> str:
    """
    Build system prompt from persona configuration.

    Args:
        persona: Agent persona JSON

    Returns:
        Formatted system prompt
    """
    # Check for custom override
    if persona.get("system_prompt_override"):
        return persona["system_prompt_override"]

    # Build from persona fields
    name = persona.get("name", "a debater")
    tone = persona.get("tone", "formal")
    thinking_style = persona.get("thinking_style", "analytical")
    speaking_style = persona.get("speaking_style", "structured")
    values = persona.get("values", [])

    system_prompt = f"""You are {name}, a debate participant.

Your characteristics:
- Tone: {tone}
- Thinking Style: {thinking_style}
- Speaking Style: {speaking_style}"""

    if values:
        system_prompt += f"\n- Core Values: {', '.join(values)}"

    system_prompt += "\n\nEngage in the debate with clarity, logic, and persuasive arguments."

    return system_prompt


def get_agent_for_phase(phase: str, state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get the appropriate agent for a given phase.

    Args:
        phase: Phase name (e.g., "opening_a", "judge_intro")
        state: Current debate state

    Returns:
        Agent configuration dict
    """
    if phase.endswith("_a"):
        return state["agent_a"]
    elif phase.endswith("_b"):
        return state["agent_b"]
    elif "judge" in phase or "score" in phase or "verdict" in phase:
        return state["agent_j"]
    else:
        raise ValueError(f"Unknown phase: {phase}")


def parse_json_scores(response: str, default_score: int = 7) -> Dict[str, Any]:
    """
    Parse JSON scores from judge response with fallback.

    Args:
        response: Raw response from judge
        default_score: Default score if parsing fails

    Returns:
        Scores dictionary
    """
    import json
    import re

    try:
        # Try direct JSON parse
        return json.loads(response)
    except json.JSONDecodeError:
        # Try to extract JSON from response
        json_match = re.search(r'\{[^{}]*\}', response, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except:
                pass

    # Fallback to default scores
    logger.warning(f"Failed to parse JSON scores, using defaults")
    return {
        "argumentation": {"total": default_score * 3},
        "delivery": {"total": default_score * 2},
        "strategy": {"total": default_score},
        "total": default_score * 6,
        "justification": "Score parsing failed, using default values"
    }

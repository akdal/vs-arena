"""
Debater Node Implementations
"""
from typing import Dict, Any
from uuid import uuid4
from datetime import datetime
import logging

from app.graph.state import DebateState, Turn
from app.graph.prompts.debater_prompts import (
    build_opening_prompt,
    build_rebuttal_prompt,
    build_summary_prompt
)
from app.graph.nodes.utils import (
    stream_ollama_with_retry,
    build_system_prompt
)

logger = logging.getLogger(__name__)


async def opening_a(state: DebateState) -> DebateState:
    """
    Generate Agent A's opening argument.

    Streams the response and creates a turn in the debate state.
    """
    agent_a = state["agent_a"]

    # Build prompt
    system_prompt = build_system_prompt(agent_a["persona_json"])
    prompt = build_opening_prompt(
        topic=state["topic"],
        position=state["position_a"],
        persona=agent_a["persona_json"]
    )

    # Stream generation with retry
    turn_id = str(uuid4())
    content_chunks = []

    logger.info(f"Generating opening argument for Agent A (turn_id: {turn_id})")

    try:
        async for chunk in stream_ollama_with_retry(
            model=agent_a["model"],
            prompt=prompt,
            system=system_prompt,
            temperature=agent_a["params_json"].get("temperature", 0.7),
            max_tokens=agent_a["params_json"].get("max_tokens", 1024),
            max_retries=3
        ):
            content_chunks.append(chunk)
    except Exception as e:
        logger.error(f"Failed to generate opening_a: {e}")
        state["status"] = "failed"
        raise

    full_content = "".join(content_chunks)

    # Create turn
    turn: Turn = {
        "turn_id": turn_id,
        "agent_id": agent_a["agent_id"],
        "phase": "opening_a",
        "role": "debater",
        "content": full_content,
        "targets": [],
        "metadata": {
            "timestamp": datetime.utcnow().isoformat(),
            "model": agent_a["model"]
        }
    }

    # Update state
    return {
        **state,
        "turns": state["turns"] + [turn],
        "current_phase": "score_opening_a"
    }


async def opening_b(state: DebateState) -> DebateState:
    """Generate Agent B's opening argument."""
    agent_b = state["agent_b"]

    system_prompt = build_system_prompt(agent_b["persona_json"])
    prompt = build_opening_prompt(
        topic=state["topic"],
        position=state["position_b"],
        persona=agent_b["persona_json"]
    )

    turn_id = str(uuid4())
    content_chunks = []

    logger.info(f"Generating opening argument for Agent B (turn_id: {turn_id})")

    try:
        async for chunk in stream_ollama_with_retry(
            model=agent_b["model"],
            prompt=prompt,
            system=system_prompt,
            temperature=agent_b["params_json"].get("temperature", 0.7),
            max_tokens=agent_b["params_json"].get("max_tokens", 1024),
            max_retries=3
        ):
            content_chunks.append(chunk)
    except Exception as e:
        logger.error(f"Failed to generate opening_b: {e}")
        state["status"] = "failed"
        raise

    full_content = "".join(content_chunks)

    turn: Turn = {
        "turn_id": turn_id,
        "agent_id": agent_b["agent_id"],
        "phase": "opening_b",
        "role": "debater",
        "content": full_content,
        "targets": [],
        "metadata": {
            "timestamp": datetime.utcnow().isoformat(),
            "model": agent_b["model"]
        }
    }

    return {
        **state,
        "turns": state["turns"] + [turn],
        "current_phase": "score_opening_b"
    }


async def rebuttal_a(state: DebateState) -> DebateState:
    """Generate Agent A's rebuttal."""
    agent_a = state["agent_a"]

    # Get previous turns
    opening_a_turn = next((t for t in state["turns"] if t["phase"] == "opening_a"), None)
    opening_b_turn = next((t for t in state["turns"] if t["phase"] == "opening_b"), None)

    if not opening_a_turn:
        raise ValueError("opening_a turn not found in state - execution order may be corrupted")
    if not opening_b_turn:
        raise ValueError("opening_b turn not found in state - execution order may be corrupted")

    system_prompt = build_system_prompt(agent_a["persona_json"])
    prompt = build_rebuttal_prompt(
        topic=state["topic"],
        position=state["position_a"],
        persona=agent_a["persona_json"],
        opponent_opening=opening_b_turn["content"],
        own_opening=opening_a_turn["content"]
    )

    turn_id = str(uuid4())
    content_chunks = []

    logger.info(f"Generating rebuttal for Agent A (turn_id: {turn_id})")

    try:
        async for chunk in stream_ollama_with_retry(
            model=agent_a["model"],
            prompt=prompt,
            system=system_prompt,
            temperature=agent_a["params_json"].get("temperature", 0.7),
            max_tokens=agent_a["params_json"].get("max_tokens", 1024),
            max_retries=3
        ):
            content_chunks.append(chunk)
    except Exception as e:
        logger.error(f"Failed to generate rebuttal_a: {e}")
        state["status"] = "failed"
        raise

    full_content = "".join(content_chunks)

    turn: Turn = {
        "turn_id": turn_id,
        "agent_id": agent_a["agent_id"],
        "phase": "rebuttal_a",
        "role": "debater",
        "content": full_content,
        "targets": [opening_b_turn["turn_id"]],  # Targeting opponent's opening
        "metadata": {
            "timestamp": datetime.utcnow().isoformat(),
            "model": agent_a["model"]
        }
    }

    return {
        **state,
        "turns": state["turns"] + [turn],
        "current_phase": "score_rebuttal_a"
    }


async def rebuttal_b(state: DebateState) -> DebateState:
    """Generate Agent B's rebuttal."""
    agent_b = state["agent_b"]

    # Get previous turns
    opening_a_turn = next((t for t in state["turns"] if t["phase"] == "opening_a"), None)
    opening_b_turn = next((t for t in state["turns"] if t["phase"] == "opening_b"), None)

    if not opening_a_turn:
        raise ValueError("opening_a turn not found in state - execution order may be corrupted")
    if not opening_b_turn:
        raise ValueError("opening_b turn not found in state - execution order may be corrupted")

    system_prompt = build_system_prompt(agent_b["persona_json"])
    prompt = build_rebuttal_prompt(
        topic=state["topic"],
        position=state["position_b"],
        persona=agent_b["persona_json"],
        opponent_opening=opening_a_turn["content"],
        own_opening=opening_b_turn["content"]
    )

    turn_id = str(uuid4())
    content_chunks = []

    logger.info(f"Generating rebuttal for Agent B (turn_id: {turn_id})")

    try:
        async for chunk in stream_ollama_with_retry(
            model=agent_b["model"],
            prompt=prompt,
            system=system_prompt,
            temperature=agent_b["params_json"].get("temperature", 0.7),
            max_tokens=agent_b["params_json"].get("max_tokens", 1024),
            max_retries=3
        ):
            content_chunks.append(chunk)
    except Exception as e:
        logger.error(f"Failed to generate rebuttal_b: {e}")
        state["status"] = "failed"
        raise

    full_content = "".join(content_chunks)

    turn: Turn = {
        "turn_id": turn_id,
        "agent_id": agent_b["agent_id"],
        "phase": "rebuttal_b",
        "role": "debater",
        "content": full_content,
        "targets": [opening_a_turn["turn_id"]],
        "metadata": {
            "timestamp": datetime.utcnow().isoformat(),
            "model": agent_b["model"]
        }
    }

    return {
        **state,
        "turns": state["turns"] + [turn],
        "current_phase": "score_rebuttal_b"
    }


async def summary_a(state: DebateState) -> DebateState:
    """Generate Agent A's summary (Whip Speech)."""
    agent_a = state["agent_a"]

    # Get all debate turns for context
    all_turns = [t["content"] for t in state["turns"] if t["role"] == "debater"]

    system_prompt = build_system_prompt(agent_a["persona_json"])
    prompt = build_summary_prompt(
        topic=state["topic"],
        position=state["position_a"],
        persona=agent_a["persona_json"],
        all_debate_turns=all_turns
    )

    turn_id = str(uuid4())
    content_chunks = []

    logger.info(f"Generating summary for Agent A (turn_id: {turn_id})")

    try:
        async for chunk in stream_ollama_with_retry(
            model=agent_a["model"],
            prompt=prompt,
            system=system_prompt,
            temperature=agent_a["params_json"].get("temperature", 0.7),
            max_tokens=agent_a["params_json"].get("max_tokens", 1024),
            max_retries=3
        ):
            content_chunks.append(chunk)
    except Exception as e:
        logger.error(f"Failed to generate summary_a: {e}")
        state["status"] = "failed"
        raise

    full_content = "".join(content_chunks)

    turn: Turn = {
        "turn_id": turn_id,
        "agent_id": agent_a["agent_id"],
        "phase": "summary_a",
        "role": "debater",
        "content": full_content,
        "targets": [],
        "metadata": {
            "timestamp": datetime.utcnow().isoformat(),
            "model": agent_a["model"]
        }
    }

    return {
        **state,
        "turns": state["turns"] + [turn],
        "current_phase": "score_summary_a"
    }


async def summary_b(state: DebateState) -> DebateState:
    """Generate Agent B's summary (Whip Speech)."""
    agent_b = state["agent_b"]

    # Get all debate turns for context
    all_turns = [t["content"] for t in state["turns"] if t["role"] == "debater"]

    system_prompt = build_system_prompt(agent_b["persona_json"])
    prompt = build_summary_prompt(
        topic=state["topic"],
        position=state["position_b"],
        persona=agent_b["persona_json"],
        all_debate_turns=all_turns
    )

    turn_id = str(uuid4())
    content_chunks = []

    logger.info(f"Generating summary for Agent B (turn_id: {turn_id})")

    try:
        async for chunk in stream_ollama_with_retry(
            model=agent_b["model"],
            prompt=prompt,
            system=system_prompt,
            temperature=agent_b["params_json"].get("temperature", 0.7),
            max_tokens=agent_b["params_json"].get("max_tokens", 1024),
            max_retries=3
        ):
            content_chunks.append(chunk)
    except Exception as e:
        logger.error(f"Failed to generate summary_b: {e}")
        state["status"] = "failed"
        raise

    full_content = "".join(content_chunks)

    turn: Turn = {
        "turn_id": turn_id,
        "agent_id": agent_b["agent_id"],
        "phase": "summary_b",
        "role": "debater",
        "content": full_content,
        "targets": [],
        "metadata": {
            "timestamp": datetime.utcnow().isoformat(),
            "model": agent_b["model"]
        }
    }

    return {
        **state,
        "turns": state["turns"] + [turn],
        "current_phase": "score_summary_b"
    }

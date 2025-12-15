"""
Judge Node Implementations
"""
from typing import Dict, Any
from uuid import uuid4
from datetime import datetime
import logging

from app.graph.state import DebateState, Turn
from app.graph.prompts.judge_prompts import (
    build_judge_intro_prompt,
    build_scoring_prompt_opening,
    build_scoring_prompt_rebuttal,
    build_scoring_prompt_summary,
    build_verdict_prompt
)
from app.graph.nodes.utils import (
    call_ollama_with_retry,
    build_system_prompt,
    parse_json_scores,
    detect_forbidden_phrases
)

logger = logging.getLogger(__name__)


async def judge_intro(state: DebateState) -> DebateState:
    """
    Generate judge introduction and rules explanation.
    """
    agent_j = state["agent_j"]

    system_prompt = build_system_prompt(agent_j["persona_json"])
    prompt = build_judge_intro_prompt(
        topic=state["topic"],
        persona=agent_j["persona_json"]
    )

    turn_id = str(uuid4())

    logger.info(f"Generating judge intro (turn_id: {turn_id})")

    try:
        content = await call_ollama_with_retry(
            model=agent_j["model"],
            prompt=prompt,
            system=system_prompt,
            temperature=0.5,  # Lower for consistency
            max_tokens=512,
            max_retries=3
        )
    except Exception as e:
        logger.error(f"Failed to generate judge_intro: {e}")
        state["status"] = "failed"
        raise

    turn: Turn = {
        "turn_id": turn_id,
        "agent_id": agent_j["agent_id"],
        "phase": "judge_intro",
        "role": "judge",
        "content": content,
        "targets": [],
        "metadata": {
            "timestamp": datetime.utcnow().isoformat(),
            "model": agent_j["model"]
        }
    }

    return {
        **state,
        "turns": state["turns"] + [turn],
        "current_phase": "opening_a",
        "status": "running"
    }


async def score_opening_a(state: DebateState) -> DebateState:
    """Score Agent A's opening argument."""
    agent_j = state["agent_j"]
    agent_a = state["agent_a"]

    # Get the opening turn
    opening_turn = next((t for t in state["turns"] if t["phase"] == "opening_a"), None)
    if not opening_turn:
        raise ValueError("opening_a turn not found in state - execution order may be corrupted")

    # Detect forbidden phrase violations
    forbidden_phrases = agent_a["persona_json"].get("forbidden_phrases", [])
    violations = detect_forbidden_phrases(opening_turn["content"], forbidden_phrases)

    if violations:
        phrases = [v["phrase"] for v in violations]
        logger.info(f"Detected {len(violations)} forbidden phrase violations in opening_a: {phrases}")

    prompt = build_scoring_prompt_opening(
        turn_content=opening_turn["content"],
        rubric=state["rubric"],
        agent_name=agent_a["name"],
        forbidden_phrases=forbidden_phrases,
        detected_violations=violations
    )

    logger.info(f"Scoring opening_a")

    try:
        response = await call_ollama_with_retry(
            model=agent_j["model"],
            prompt=prompt,
            system="You are a fair and objective debate judge. Provide scores in valid JSON format.",
            temperature=0.3,  # Low for consistency
            max_tokens=512,
            max_retries=3
        )
    except Exception as e:
        logger.error(f"Failed to score opening_a: {e}")
        state["status"] = "failed"
        raise

    # Parse scores
    scores = parse_json_scores(response, default_score=7)

    # Calculate weighted scores
    rubric = state["rubric"]
    weighted_scores = {
        "argumentation": scores.get("argumentation", {}).get("total", 21) * (rubric.get("argumentation_weight", 35) / 100),
        "delivery": scores.get("delivery", {}).get("total", 14) * (rubric.get("delivery_weight", 20) / 100),
        "strategy": scores.get("strategy", {}).get("total", 7) * (rubric.get("strategy_weight", 15) / 100),
        "rebuttal": 0,  # Not applicable for opening
        "total": scores.get("total", 42)
    }

    # Update turn metadata
    for turn in state["turns"]:
        if turn["turn_id"] == opening_turn["turn_id"]:
            turn["metadata"]["scores"] = scores
            turn["metadata"]["forbidden_phrases_detected"] = violations
            break

    return {
        **state,
        "scores_a": weighted_scores,
        "current_phase": "opening_b"
    }


async def score_opening_b(state: DebateState) -> DebateState:
    """Score Agent B's opening argument."""
    agent_j = state["agent_j"]
    agent_b = state["agent_b"]

    opening_turn = next((t for t in state["turns"] if t["phase"] == "opening_b"), None)
    if not opening_turn:
        raise ValueError("opening_b turn not found in state - execution order may be corrupted")

    # Detect forbidden phrase violations
    forbidden_phrases = agent_b["persona_json"].get("forbidden_phrases", [])
    violations = detect_forbidden_phrases(opening_turn["content"], forbidden_phrases)

    if violations:
        phrases = [v["phrase"] for v in violations]
        logger.info(f"Detected {len(violations)} forbidden phrase violations in opening_b: {phrases}")

    prompt = build_scoring_prompt_opening(
        turn_content=opening_turn["content"],
        rubric=state["rubric"],
        agent_name=agent_b["name"],
        forbidden_phrases=forbidden_phrases,
        detected_violations=violations
    )

    logger.info(f"Scoring opening_b")

    try:
        response = await call_ollama_with_retry(
            model=agent_j["model"],
            prompt=prompt,
            system="You are a fair and objective debate judge. Provide scores in valid JSON format.",
            temperature=0.3,
            max_tokens=512,
            max_retries=3
        )
    except Exception as e:
        logger.error(f"Failed to score opening_b: {e}")
        state["status"] = "failed"
        raise

    scores = parse_json_scores(response, default_score=7)

    rubric = state["rubric"]
    weighted_scores = {
        "argumentation": scores.get("argumentation", {}).get("total", 21) * (rubric.get("argumentation_weight", 35) / 100),
        "delivery": scores.get("delivery", {}).get("total", 14) * (rubric.get("delivery_weight", 20) / 100),
        "strategy": scores.get("strategy", {}).get("total", 7) * (rubric.get("strategy_weight", 15) / 100),
        "rebuttal": 0,
        "total": scores.get("total", 42)
    }

    for turn in state["turns"]:
        if turn["turn_id"] == opening_turn["turn_id"]:
            turn["metadata"]["scores"] = scores
            turn["metadata"]["forbidden_phrases_detected"] = violations
            break

    return {
        **state,
        "scores_b": weighted_scores,
        "current_phase": "rebuttal_a"
    }


async def score_rebuttal_a(state: DebateState) -> DebateState:
    """Score Agent A's rebuttal."""
    agent_j = state["agent_j"]
    agent_a = state["agent_a"]

    rebuttal_turn = next((t for t in state["turns"] if t["phase"] == "rebuttal_a"), None)
    opening_b_turn = next((t for t in state["turns"] if t["phase"] == "opening_b"), None)

    if not rebuttal_turn:
        raise ValueError("rebuttal_a turn not found in state - execution order may be corrupted")
    if not opening_b_turn:
        raise ValueError("opening_b turn not found in state - execution order may be corrupted")

    # Detect forbidden phrase violations
    forbidden_phrases = agent_a["persona_json"].get("forbidden_phrases", [])
    violations = detect_forbidden_phrases(rebuttal_turn["content"], forbidden_phrases)

    if violations:
        phrases = [v["phrase"] for v in violations]
        logger.info(f"Detected {len(violations)} forbidden phrase violations in rebuttal_a: {phrases}")

    prompt = build_scoring_prompt_rebuttal(
        turn_content=rebuttal_turn["content"],
        rubric=state["rubric"],
        agent_name=agent_a["name"],
        opponent_opening=opening_b_turn["content"],
        forbidden_phrases=forbidden_phrases,
        detected_violations=violations
    )

    logger.info(f"Scoring rebuttal_a")

    try:
        response = await call_ollama_with_retry(
            model=agent_j["model"],
            prompt=prompt,
            system="You are a fair and objective debate judge. Provide scores in valid JSON format.",
            temperature=0.3,
            max_tokens=512,
            max_retries=3
        )
    except Exception as e:
        logger.error(f"Failed to score rebuttal_a: {e}")
        state["status"] = "failed"
        raise

    scores = parse_json_scores(response, default_score=7)

    rubric = state["rubric"]
    current_scores = state["scores_a"]

    # Add rebuttal scores
    rebuttal_score = scores.get("rebuttal", {}).get("total", 21) * (rubric.get("rebuttal_weight", 30) / 100)
    current_scores["rebuttal"] = current_scores.get("rebuttal", 0) + rebuttal_score
    current_scores["total"] = current_scores.get("total", 0) + scores.get("total", 35)

    for turn in state["turns"]:
        if turn["turn_id"] == rebuttal_turn["turn_id"]:
            turn["metadata"]["scores"] = scores
            turn["metadata"]["forbidden_phrases_detected"] = violations
            break

    return {
        **state,
        "scores_a": current_scores,
        "current_phase": "rebuttal_b"
    }


async def score_rebuttal_b(state: DebateState) -> DebateState:
    """Score Agent B's rebuttal."""
    agent_j = state["agent_j"]
    agent_b = state["agent_b"]

    rebuttal_turn = next((t for t in state["turns"] if t["phase"] == "rebuttal_b"), None)
    opening_a_turn = next((t for t in state["turns"] if t["phase"] == "opening_a"), None)

    if not rebuttal_turn:
        raise ValueError("rebuttal_b turn not found in state - execution order may be corrupted")
    if not opening_a_turn:
        raise ValueError("opening_a turn not found in state - execution order may be corrupted")

    # Detect forbidden phrase violations
    forbidden_phrases = agent_b["persona_json"].get("forbidden_phrases", [])
    violations = detect_forbidden_phrases(rebuttal_turn["content"], forbidden_phrases)

    if violations:
        phrases = [v["phrase"] for v in violations]
        logger.info(f"Detected {len(violations)} forbidden phrase violations in rebuttal_b: {phrases}")

    prompt = build_scoring_prompt_rebuttal(
        turn_content=rebuttal_turn["content"],
        rubric=state["rubric"],
        agent_name=agent_b["name"],
        opponent_opening=opening_a_turn["content"],
        forbidden_phrases=forbidden_phrases,
        detected_violations=violations
    )

    logger.info(f"Scoring rebuttal_b")

    try:
        response = await call_ollama_with_retry(
            model=agent_j["model"],
            prompt=prompt,
            system="You are a fair and objective debate judge. Provide scores in valid JSON format.",
            temperature=0.3,
            max_tokens=512,
            max_retries=3
        )
    except Exception as e:
        logger.error(f"Failed to score rebuttal_b: {e}")
        state["status"] = "failed"
        raise

    scores = parse_json_scores(response, default_score=7)

    rubric = state["rubric"]
    current_scores = state["scores_b"]

    rebuttal_score = scores.get("rebuttal", {}).get("total", 21) * (rubric.get("rebuttal_weight", 30) / 100)
    current_scores["rebuttal"] = current_scores.get("rebuttal", 0) + rebuttal_score
    current_scores["total"] = current_scores.get("total", 0) + scores.get("total", 35)

    for turn in state["turns"]:
        if turn["turn_id"] == rebuttal_turn["turn_id"]:
            turn["metadata"]["scores"] = scores
            turn["metadata"]["forbidden_phrases_detected"] = violations
            break

    return {
        **state,
        "scores_b": current_scores,
        "current_phase": "summary_a"
    }


async def score_summary_a(state: DebateState) -> DebateState:
    """Score Agent A's summary."""
    agent_j = state["agent_j"]
    agent_a = state["agent_a"]

    summary_turn = next((t for t in state["turns"] if t["phase"] == "summary_a"), None)
    if not summary_turn:
        raise ValueError("summary_a turn not found in state - execution order may be corrupted")

    # Get all previous debate turns (excluding judge turns)
    previous_turns = [t["content"] for t in state["turns"] if t["role"] == "debater" and t["phase"] != "summary_a"]

    # Detect forbidden phrase violations
    forbidden_phrases = agent_a["persona_json"].get("forbidden_phrases", [])
    violations = detect_forbidden_phrases(summary_turn["content"], forbidden_phrases)

    if violations:
        phrases = [v["phrase"] for v in violations]
        logger.info(f"Detected {len(violations)} forbidden phrase violations in summary_a: {phrases}")

    prompt = build_scoring_prompt_summary(
        turn_content=summary_turn["content"],
        rubric=state["rubric"],
        agent_name=agent_a["name"],
        all_previous_turns=previous_turns,
        forbidden_phrases=forbidden_phrases,
        detected_violations=violations
    )

    logger.info(f"Scoring summary_a")

    try:
        response = await call_ollama_with_retry(
            model=agent_j["model"],
            prompt=prompt,
            system="You are a fair and objective debate judge. Check for new arguments and forbidden phrases. Provide scores in valid JSON format.",
            temperature=0.3,
            max_tokens=512,
            max_retries=3
        )
    except Exception as e:
        logger.error(f"Failed to score summary_a: {e}")
        state["status"] = "failed"
        raise

    scores = parse_json_scores(response, default_score=7)

    rubric = state["rubric"]
    current_scores = state["scores_a"]

    # Add summary scores (with potential penalty)
    strategy_score = scores.get("strategy", {}).get("total", 7) * (rubric.get("strategy_weight", 15) / 100)
    current_scores["strategy"] = current_scores.get("strategy", 0) + strategy_score
    current_scores["total"] = current_scores.get("total", 0) + scores.get("total", 28)

    for turn in state["turns"]:
        if turn["turn_id"] == summary_turn["turn_id"]:
            turn["metadata"]["scores"] = scores
            turn["metadata"]["new_arguments_detected"] = scores.get("new_arguments_detected", False)
            turn["metadata"]["forbidden_phrases_detected"] = violations
            break

    return {
        **state,
        "scores_a": current_scores,
        "current_phase": "summary_b"
    }


async def score_summary_b(state: DebateState) -> DebateState:
    """Score Agent B's summary."""
    agent_j = state["agent_j"]
    agent_b = state["agent_b"]

    summary_turn = next((t for t in state["turns"] if t["phase"] == "summary_b"), None)
    if not summary_turn:
        raise ValueError("summary_b turn not found in state - execution order may be corrupted")

    previous_turns = [t["content"] for t in state["turns"] if t["role"] == "debater" and t["phase"] != "summary_b"]

    # Detect forbidden phrase violations
    forbidden_phrases = agent_b["persona_json"].get("forbidden_phrases", [])
    violations = detect_forbidden_phrases(summary_turn["content"], forbidden_phrases)

    if violations:
        phrases = [v["phrase"] for v in violations]
        logger.info(f"Detected {len(violations)} forbidden phrase violations in summary_b: {phrases}")

    prompt = build_scoring_prompt_summary(
        turn_content=summary_turn["content"],
        rubric=state["rubric"],
        agent_name=agent_b["name"],
        all_previous_turns=previous_turns,
        forbidden_phrases=forbidden_phrases,
        detected_violations=violations
    )

    logger.info(f"Scoring summary_b")

    try:
        response = await call_ollama_with_retry(
            model=agent_j["model"],
            prompt=prompt,
            system="You are a fair and objective debate judge. Check for new arguments and forbidden phrases. Provide scores in valid JSON format.",
            temperature=0.3,
            max_tokens=512,
            max_retries=3
        )
    except Exception as e:
        logger.error(f"Failed to score summary_b: {e}")
        state["status"] = "failed"
        raise

    scores = parse_json_scores(response, default_score=7)

    rubric = state["rubric"]
    current_scores = state["scores_b"]

    strategy_score = scores.get("strategy", {}).get("total", 7) * (rubric.get("strategy_weight", 15) / 100)
    current_scores["strategy"] = current_scores.get("strategy", 0) + strategy_score
    current_scores["total"] = current_scores.get("total", 0) + scores.get("total", 28)

    for turn in state["turns"]:
        if turn["turn_id"] == summary_turn["turn_id"]:
            turn["metadata"]["scores"] = scores
            turn["metadata"]["new_arguments_detected"] = scores.get("new_arguments_detected", False)
            turn["metadata"]["forbidden_phrases_detected"] = violations
            break

    return {
        **state,
        "scores_b": current_scores,
        "current_phase": "judge_verdict",
        "status": "judging"
    }


async def judge_verdict(state: DebateState) -> DebateState:
    """Generate final verdict and determine winner."""
    agent_j = state["agent_j"]
    agent_a = state["agent_a"]
    agent_b = state["agent_b"]

    # Get all debate turns
    all_turns = [t["content"] for t in state["turns"] if t["role"] == "debater"]

    prompt = build_verdict_prompt(
        topic=state["topic"],
        position_a=state["position_a"],
        position_b=state["position_b"],
        agent_a_name=agent_a["name"],
        agent_b_name=agent_b["name"],
        scores_a=state["scores_a"],
        scores_b=state["scores_b"],
        all_turns=all_turns
    )

    turn_id = str(uuid4())

    logger.info(f"Generating final verdict (turn_id: {turn_id})")

    try:
        content = await call_ollama_with_retry(
            model=agent_j["model"],
            prompt=prompt,
            system="You are a fair and objective debate judge delivering your final verdict.",
            temperature=0.5,
            max_tokens=1024,
            max_retries=3
        )
    except Exception as e:
        logger.error(f"Failed to generate verdict: {e}")
        state["status"] = "failed"
        raise

    # Determine winner
    score_a = state["scores_a"].get("total", 0)
    score_b = state["scores_b"].get("total", 0)
    score_diff = abs(score_a - score_b)

    if score_diff < 5:  # Within 5 points = draw
        winner = "DRAW"
    elif score_a > score_b:
        winner = "A"
    else:
        winner = "B"

    turn: Turn = {
        "turn_id": turn_id,
        "agent_id": agent_j["agent_id"],
        "phase": "judge_verdict",
        "role": "judge",
        "content": content,
        "targets": [],
        "metadata": {
            "timestamp": datetime.utcnow().isoformat(),
            "model": agent_j["model"],
            "winner": winner,
            "final_scores": {
                "a": state["scores_a"],
                "b": state["scores_b"]
            }
        }
    }

    return {
        **state,
        "turns": state["turns"] + [turn],
        "winner": winner,
        "verdict": content,
        "current_phase": "completed",
        "status": "completed"
    }

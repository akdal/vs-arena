"""
Debate Graph Executor with SSE Streaming

This module provides the execution layer for the debate graph with real-time
Server-Sent Events (SSE) streaming support.
"""
import json
import logging
from typing import AsyncGenerator, Dict, Any
from uuid import uuid4, UUID
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette import EventSourceResponse

from app.graph.state import DebateState, Turn
from app.graph.graph import debate_graph
from app.graph.nodes.utils import (
    stream_ollama_with_retry,
    call_ollama_with_retry,
    build_system_prompt,
    parse_json_scores
)
from app.graph.prompts.debater_prompts import (
    build_opening_prompt,
    build_rebuttal_prompt,
    build_summary_prompt
)
from app.graph.prompts.judge_prompts import (
    build_judge_intro_prompt,
    build_scoring_prompt_opening,
    build_scoring_prompt_rebuttal,
    build_scoring_prompt_summary,
    build_verdict_prompt
)
from app.services.run_crud import get_run_with_agents, update_run_status
from app.models.turn import Turn as TurnModel

logger = logging.getLogger(__name__)


async def initialize_debate_state(run_id: str, db: AsyncSession) -> DebateState:
    """
    Initialize DebateState from database.

    Args:
        run_id: UUID of the run
        db: Database session

    Returns:
        Initialized DebateState ready for graph execution
    """
    # Fetch run with all agents
    run_data = await get_run_with_agents(db, UUID(run_id))
    if not run_data:
        raise ValueError(f"Run {run_id} not found")

    run = run_data["run"]
    agent_a = run_data["agent_a"]
    agent_b = run_data["agent_b"]
    agent_j = run_data["agent_j"]

    # Convert SQLAlchemy models to dicts
    agent_a_dict = {
        "agent_id": str(agent_a.agent_id),
        "name": agent_a.name,
        "model": agent_a.model,
        "persona_json": agent_a.persona_json,
        "params_json": agent_a.params_json
    }

    agent_b_dict = {
        "agent_id": str(agent_b.agent_id),
        "name": agent_b.name,
        "model": agent_b.model,
        "persona_json": agent_b.persona_json,
        "params_json": agent_b.params_json
    }

    agent_j_dict = {
        "agent_id": str(agent_j.agent_id),
        "name": agent_j.name,
        "model": agent_j.model,
        "persona_json": agent_j.persona_json,
        "params_json": agent_j.params_json
    }

    # Initialize state
    state: DebateState = {
        "run_id": str(run.run_id),
        "topic": run.topic,
        "position_a": run.position_a,
        "position_b": run.position_b,
        "agent_a": agent_a_dict,
        "agent_b": agent_b_dict,
        "agent_j": agent_j_dict,
        "config": run.config_json or {"rounds": 3, "max_tokens_per_turn": 1024},
        "rubric": run.rubric_json or {
            "argumentation_weight": 35,
            "rebuttal_weight": 30,
            "delivery_weight": 20,
            "strategy_weight": 15
        },
        "current_phase": "judge_intro",
        "turns": [],
        "scores_a": {},
        "scores_b": {},
        "winner": None,
        "verdict": None,
        "status": "pending"
    }

    return state


async def persist_turn(turn: Turn, run_id: str, db: AsyncSession) -> None:
    """
    Persist a turn to the database.

    Args:
        turn: Turn to persist
        run_id: Run UUID
        db: Database session
    """
    db_turn = TurnModel(
        turn_id=UUID(turn["turn_id"]),
        run_id=UUID(run_id),
        agent_id=UUID(turn["agent_id"]),
        phase=turn["phase"],
        role=turn["role"],
        content=turn["content"],
        targets=[UUID(t) for t in turn["targets"]],
        metadata_json=turn["metadata"]  # Use metadata_json attribute
    )
    db.add(db_turn)
    await db.commit()
    await db.refresh(db_turn)


async def update_turn_metadata(turn_id: str, metadata: Dict[str, Any], db: AsyncSession) -> None:
    """
    Update metadata for an existing turn.

    Args:
        turn_id: Turn UUID to update
        metadata: New metadata to merge with existing
        db: Database session
    """
    from sqlalchemy import select, update

    # Fetch existing turn
    stmt = select(TurnModel).where(TurnModel.turn_id == UUID(turn_id))
    result = await db.execute(stmt)
    db_turn = result.scalar_one_or_none()

    if db_turn:
        # Merge metadata
        existing_metadata = db_turn.metadata_json or {}
        existing_metadata.update(metadata)

        # Update
        update_stmt = (
            update(TurnModel)
            .where(TurnModel.turn_id == UUID(turn_id))
            .values(metadata_json=existing_metadata)
        )
        await db.execute(update_stmt)
        await db.commit()


async def execute_debate_with_streaming(
    run_id: str,
    db: AsyncSession
) -> EventSourceResponse:
    """
    Execute debate graph and stream events via SSE.

    This function orchestrates the complete debate flow with real-time streaming:
    - Initializes state from database
    - Executes 14 nodes in sequence
    - Streams tokens for debater nodes
    - Sends complete results for judge nodes
    - Persists turns to database
    - Updates run status

    Database Session Lifecycle:
        The database session is held open for the entire debate execution (typically
        2-5 minutes). This is intentional for the following reasons:

        1. Transactional consistency: All debate turns belong to a single logical unit
        2. Immediate commits: Each turn is committed immediately after generation,
           so the session doesn't accumulate uncommitted changes
        3. Connection pool design: FastAPI's connection pool can handle concurrent
           debates (pool_size=10, max_overflow=20)
        4. SSE streaming requirement: The session must survive across multiple yields

        Trade-offs considered:
        - Connection pool exhaustion: Mitigated by reasonable pool settings
        - Stale connections: PostgreSQL keepalive handles this automatically
        - Long transactions: Not an issue since we commit after each turn

        Alternative of creating new sessions per turn would require complex state
        management and wouldn't provide significant benefits.

    Args:
        run_id: UUID of the run to execute
        db: Database session (held for entire debate duration)

    Returns:
        EventSourceResponse for SSE streaming
    """

    async def event_generator() -> AsyncGenerator[Dict[str, str], None]:
        """Generate SSE events for the debate execution."""
        try:
            # Initialize state
            state = await initialize_debate_state(run_id, db)
            logger.info(f"Starting debate execution for run {run_id}")

            # Update run status to running
            await update_run_status(db, UUID(run_id), "running")

            # Define execution order (14 nodes in BP Lite sequence)
            execution_order = [
                "judge_intro",
                "opening_a",
                "score_opening_a",
                "opening_b",
                "score_opening_b",
                "rebuttal_a",
                "score_rebuttal_a",
                "rebuttal_b",
                "score_rebuttal_b",
                "summary_a",
                "score_summary_a",
                "summary_b",
                "score_summary_b",
                "judge_verdict"
            ]

            # Execute each node in sequence
            for node_name in execution_order:
                logger.info(f"Executing node: {node_name}")

                # Send phase start event
                agent_id = _get_agent_id_for_phase(node_name, state)
                yield {
                    "event": "phase_start",
                    "data": json.dumps({
                        "phase": node_name,
                        "agent_id": agent_id
                    })
                }

                # Execute node based on type
                if node_name.startswith("score_") or node_name in ["judge_intro", "judge_verdict"]:
                    # Non-streaming judge operations
                    state = await _execute_judge_node(node_name, state, db)

                    # Send complete result
                    if state["turns"]:
                        last_turn = state["turns"][-1]
                        yield {
                            "event": "token",
                            "data": json.dumps({
                                "turn_id": last_turn["turn_id"],
                                "content": last_turn["content"],
                                "complete": True
                            })
                        }

                        # Send scores if available
                        if "score" in node_name and "scores" in last_turn.get("metadata", {}):
                            yield {
                                "event": "score",
                                "data": json.dumps({
                                    "phase": node_name,
                                    "scores": last_turn["metadata"]["scores"],
                                    "agent": "A" if "a" in node_name else "B"
                                })
                            }

                else:
                    # Streaming debater operations
                    async for event in _execute_debater_node_with_streaming(node_name, state, db):
                        # Handle internal state updates without sending to client
                        if event["event"] == "_internal_state_update":
                            state = event["_state"]
                            continue  # Don't send internal events to client

                        # Send all other events to client
                        yield event

                # Send phase end event
                yield {
                    "event": "phase_end",
                    "data": json.dumps({
                        "phase": node_name,
                        "turn_id": state["turns"][-1]["turn_id"] if state["turns"] else None
                    })
                }

            # Send final verdict
            yield {
                "event": "verdict",
                "data": json.dumps({
                    "winner": state["winner"],
                    "final_scores": {
                        "a": state["scores_a"],
                        "b": state["scores_b"]
                    },
                    "reasoning": state["verdict"]
                })
            }

            # Update run status to completed
            await update_run_status(
                db,
                UUID(run_id),
                "completed",
                result_json={
                    "winner": state["winner"],
                    "scores_a": state["scores_a"],
                    "scores_b": state["scores_b"],
                    "verdict": state["verdict"]
                }
            )

            # Send completion event
            yield {
                "event": "run_complete",
                "data": json.dumps({
                    "run_id": run_id,
                    "status": "completed",
                    "winner": state["winner"]
                })
            }

            logger.info(f"Debate execution completed for run {run_id}")

        except Exception as e:
            logger.error(f"Debate execution failed for run {run_id}: {e}", exc_info=True)

            # Send error event
            yield {
                "event": "error",
                "data": json.dumps({
                    "code": "DEBATE_ERROR",
                    "message": str(e),
                    "phase": state.get("current_phase", "unknown") if 'state' in locals() else "unknown"
                })
            }

            # Update run status to failed
            try:
                await update_run_status(db, UUID(run_id), "failed")
            except Exception as db_error:
                logger.error(f"Failed to update run status: {db_error}")

    return EventSourceResponse(event_generator())


async def _execute_judge_node(
    node_name: str,
    state: DebateState,
    db: AsyncSession
) -> DebateState:
    """
    Execute a judge node (non-streaming).

    Args:
        node_name: Name of the node to execute
        state: Current debate state
        db: Database session

    Returns:
        Updated debate state
    """
    agent_j = state["agent_j"]

    if node_name == "judge_intro":
        # Generate judge introduction
        prompt = build_judge_intro_prompt(state["topic"], agent_j["persona_json"])
        system_prompt = build_system_prompt(agent_j["persona_json"])

        content = await call_ollama_with_retry(
            model=agent_j["model"],
            prompt=prompt,
            system=system_prompt,
            temperature=0.5,
            max_tokens=512,
            max_retries=3
        )

        turn: Turn = {
            "turn_id": str(uuid4()),
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

        await persist_turn(turn, state["run_id"], db)

        return {
            **state,
            "turns": state["turns"] + [turn],
            "current_phase": "opening_a",
            "status": "running"
        }

    elif node_name == "judge_verdict":
        # Generate final verdict
        all_turns = [t["content"] for t in state["turns"] if t["role"] == "debater"]

        prompt = build_verdict_prompt(
            topic=state["topic"],
            position_a=state["position_a"],
            position_b=state["position_b"],
            agent_a_name=state["agent_a"]["name"],
            agent_b_name=state["agent_b"]["name"],
            scores_a=state["scores_a"],
            scores_b=state["scores_b"],
            all_turns=all_turns
        )

        content = await call_ollama_with_retry(
            model=agent_j["model"],
            prompt=prompt,
            system="You are a fair and objective debate judge delivering your final verdict.",
            temperature=0.5,
            max_tokens=1024,
            max_retries=3
        )

        # Determine winner
        score_a = state["scores_a"].get("total", 0)
        score_b = state["scores_b"].get("total", 0)
        score_diff = abs(score_a - score_b)

        if score_diff < 5:
            winner = "DRAW"
        elif score_a > score_b:
            winner = "A"
        else:
            winner = "B"

        turn: Turn = {
            "turn_id": str(uuid4()),
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

        await persist_turn(turn, state["run_id"], db)

        return {
            **state,
            "turns": state["turns"] + [turn],
            "winner": winner,
            "verdict": content,
            "current_phase": "completed",
            "status": "completed"
        }

    elif node_name.startswith("score_"):
        # Scoring nodes
        return await _execute_scoring_node(node_name, state, db)

    return state


async def _execute_scoring_node(
    node_name: str,
    state: DebateState,
    db: AsyncSession
) -> DebateState:
    """
    Execute a scoring node.

    Args:
        node_name: Name of the scoring node
        state: Current debate state
        db: Database session

    Returns:
        Updated debate state
    """
    agent_j = state["agent_j"]
    rubric = state["rubric"]

    # Map node name to phase and agent
    phase_map = {
        "score_opening_a": ("opening_a", "A", state["agent_a"]["name"]),
        "score_opening_b": ("opening_b", "B", state["agent_b"]["name"]),
        "score_rebuttal_a": ("rebuttal_a", "A", state["agent_a"]["name"]),
        "score_rebuttal_b": ("rebuttal_b", "B", state["agent_b"]["name"]),
        "score_summary_a": ("summary_a", "A", state["agent_a"]["name"]),
        "score_summary_b": ("summary_b", "B", state["agent_b"]["name"])
    }

    turn_phase, agent_label, agent_name = phase_map[node_name]

    # Get the turn to score
    turn_to_score = next((t for t in state["turns"] if t["phase"] == turn_phase), None)
    if not turn_to_score:
        raise ValueError(f"{turn_phase} turn not found in state - execution order may be corrupted")

    # Build appropriate scoring prompt
    if "opening" in node_name:
        prompt = build_scoring_prompt_opening(
            turn_content=turn_to_score["content"],
            rubric=rubric,
            agent_name=agent_name
        )
    elif "rebuttal" in node_name:
        opponent_opening_phase = "opening_b" if agent_label == "A" else "opening_a"
        opponent_opening = next((t for t in state["turns"] if t["phase"] == opponent_opening_phase), None)
        if not opponent_opening:
            raise ValueError(f"{opponent_opening_phase} turn not found in state - execution order may be corrupted")
        prompt = build_scoring_prompt_rebuttal(
            turn_content=turn_to_score["content"],
            rubric=rubric,
            agent_name=agent_name,
            opponent_opening=opponent_opening["content"]
        )
    else:  # summary
        previous_turns = [t["content"] for t in state["turns"] if t["role"] == "debater" and t["phase"] != turn_phase]
        prompt = build_scoring_prompt_summary(
            turn_content=turn_to_score["content"],
            rubric=rubric,
            agent_name=agent_name,
            all_previous_turns=previous_turns
        )

    # Get scores from judge
    response = await call_ollama_with_retry(
        model=agent_j["model"],
        prompt=prompt,
        system="You are a fair and objective debate judge. Provide scores in valid JSON format.",
        temperature=0.3,
        max_tokens=512,
        max_retries=3
    )

    # Parse scores
    scores = parse_json_scores(response, default_score=7)

    # Calculate weighted scores and update state
    if "opening" in node_name:
        weighted_scores = {
            "argumentation": scores.get("argumentation", {}).get("total", 21) * (rubric.get("argumentation_weight", 35) / 100),
            "delivery": scores.get("delivery", {}).get("total", 14) * (rubric.get("delivery_weight", 20) / 100),
            "strategy": scores.get("strategy", {}).get("total", 7) * (rubric.get("strategy_weight", 15) / 100),
            "rebuttal": 0,
            "total": scores.get("total", 42)
        }
        score_key = "scores_a" if agent_label == "A" else "scores_b"
        new_scores = {score_key: weighted_scores}

    elif "rebuttal" in node_name:
        score_key = "scores_a" if agent_label == "A" else "scores_b"
        current_scores = state[score_key]
        rebuttal_score = scores.get("rebuttal", {}).get("total", 21) * (rubric.get("rebuttal_weight", 30) / 100)
        current_scores["rebuttal"] = current_scores.get("rebuttal", 0) + rebuttal_score
        current_scores["total"] = current_scores.get("total", 0) + scores.get("total", 35)
        new_scores = {score_key: current_scores}

    else:  # summary
        score_key = "scores_a" if agent_label == "A" else "scores_b"
        current_scores = state[score_key]
        strategy_score = scores.get("strategy", {}).get("total", 7) * (rubric.get("strategy_weight", 15) / 100)
        current_scores["strategy"] = current_scores.get("strategy", 0) + strategy_score
        current_scores["total"] = current_scores.get("total", 0) + scores.get("total", 28)
        new_scores = {score_key: current_scores}

    # Update turn metadata with scores
    for turn in state["turns"]:
        if turn["turn_id"] == turn_to_score["turn_id"]:
            turn["metadata"]["scores"] = scores
            if "summary" in node_name:
                turn["metadata"]["new_arguments_detected"] = scores.get("new_arguments_detected", False)
            break

    # Update turn metadata in database (turn already persisted by debater node)
    metadata_update = {"scores": scores}
    if "summary" in node_name:
        metadata_update["new_arguments_detected"] = scores.get("new_arguments_detected", False)
    await update_turn_metadata(turn_to_score["turn_id"], metadata_update, db)

    # Determine next phase
    next_phase_map = {
        "score_opening_a": "opening_b",
        "score_opening_b": "rebuttal_a",
        "score_rebuttal_a": "rebuttal_b",
        "score_rebuttal_b": "summary_a",
        "score_summary_a": "summary_b",
        "score_summary_b": "judge_verdict"
    }

    return {
        **state,
        **new_scores,
        "current_phase": next_phase_map[node_name],
        "status": "judging" if node_name == "score_summary_b" else state["status"]
    }


async def _execute_debater_node_with_streaming(
    node_name: str,
    state: DebateState,
    db: AsyncSession
) -> AsyncGenerator[Dict[str, str], None]:
    """
    Execute a debater node with real-time token streaming.

    Args:
        node_name: Name of the debater node
        state: Current debate state
        db: Database session

    Yields:
        SSE events for token streaming
    """
    # Map node name to agent and phase
    phase_map = {
        "opening_a": ("A", state["agent_a"]),
        "opening_b": ("B", state["agent_b"]),
        "rebuttal_a": ("A", state["agent_a"]),
        "rebuttal_b": ("B", state["agent_b"]),
        "summary_a": ("A", state["agent_a"]),
        "summary_b": ("B", state["agent_b"])
    }

    agent_label, agent = phase_map[node_name]
    position = state["position_a"] if agent_label == "A" else state["position_b"]

    # Build prompt based on phase
    system_prompt = build_system_prompt(agent["persona_json"])

    if "opening" in node_name:
        prompt = build_opening_prompt(
            topic=state["topic"],
            position=position,
            persona=agent["persona_json"]
        )
    elif "rebuttal" in node_name:
        own_opening_phase = f"opening_{agent_label.lower()}"
        opponent_opening_phase = "opening_b" if agent_label == "A" else "opening_a"
        own_opening = next((t for t in state["turns"] if t["phase"] == own_opening_phase), None)
        opponent_opening = next((t for t in state["turns"] if t["phase"] == opponent_opening_phase), None)

        if not own_opening:
            raise ValueError(f"{own_opening_phase} turn not found in state - execution order may be corrupted")
        if not opponent_opening:
            raise ValueError(f"{opponent_opening_phase} turn not found in state - execution order may be corrupted")

        prompt = build_rebuttal_prompt(
            topic=state["topic"],
            position=position,
            persona=agent["persona_json"],
            opponent_opening=opponent_opening["content"],
            own_opening=own_opening["content"]
        )
    else:  # summary
        all_turns = [t["content"] for t in state["turns"] if t["role"] == "debater"]
        prompt = build_summary_prompt(
            topic=state["topic"],
            position=position,
            persona=agent["persona_json"],
            all_debate_turns=all_turns
        )

    # Stream generation
    turn_id = str(uuid4())
    content_chunks = []

    try:
        async for chunk in stream_ollama_with_retry(
            model=agent["model"],
            prompt=prompt,
            system=system_prompt,
            temperature=agent["params_json"].get("temperature", 0.7),
            max_tokens=agent["params_json"].get("max_tokens", 1024),
            max_retries=3
        ):
            content_chunks.append(chunk)

            # Stream token to frontend
            yield {
                "event": "token",
                "data": json.dumps({
                    "turn_id": turn_id,
                    "content": chunk
                })
            }

    except Exception as e:
        logger.error(f"Failed to generate {node_name}: {e}")
        raise

    # Create complete turn
    full_content = "".join(content_chunks)

    # Determine targets for rebuttals
    targets = []
    if "rebuttal" in node_name:
        opponent_opening_phase = "opening_b" if agent_label == "A" else "opening_a"
        opponent_turn = next((t for t in state["turns"] if t["phase"] == opponent_opening_phase), None)
        if not opponent_turn:
            raise ValueError(f"{opponent_opening_phase} turn not found in state - execution order may be corrupted")
        targets = [opponent_turn["turn_id"]]

    turn: Turn = {
        "turn_id": turn_id,
        "agent_id": agent["agent_id"],
        "phase": node_name,
        "role": "debater",
        "content": full_content,
        "targets": targets,
        "metadata": {
            "timestamp": datetime.utcnow().isoformat(),
            "model": agent["model"]
        }
    }

    # Persist to database
    await persist_turn(turn, state["run_id"], db)

    # Update state
    next_phase_map = {
        "opening_a": "score_opening_a",
        "opening_b": "score_opening_b",
        "rebuttal_a": "score_rebuttal_a",
        "rebuttal_b": "score_rebuttal_b",
        "summary_a": "score_summary_a",
        "summary_b": "score_summary_b"
    }

    updated_state = {
        **state,
        "turns": state["turns"] + [turn],
        "current_phase": next_phase_map[node_name]
    }

    # Yield internal state update event (not sent to client)
    # Main loop will extract this and update its state variable
    yield {
        "event": "_internal_state_update",
        "data": json.dumps({"turn_id": turn_id}),
        "_state": updated_state  # Internal field, not serialized to client
    }


def _get_agent_id_for_phase(phase: str, state: DebateState) -> str:
    """Get agent ID for a given phase."""
    if "judge" in phase or "score" in phase:
        return state["agent_j"]["agent_id"]
    elif "_a" in phase:
        return state["agent_a"]["agent_id"]
    else:
        return state["agent_b"]["agent_id"]

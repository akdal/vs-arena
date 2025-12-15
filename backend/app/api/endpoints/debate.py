"""
Debate API Endpoints
"""
from fastapi import APIRouter, HTTPException, status, Depends
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from typing import List

from app.db.database import get_db
from app.models.schemas import (
    DebateStartRequest, DebateStartResponse,
    RunResponse, RunDetailResponse, TurnResponse
)
from app.services.run_crud import (
    create_run, get_run_with_agents, update_run_status,
    get_all_runs, get_run_by_id, get_turns_by_run_id
)
from app.services import agent_crud, run_crud
from app.graph.executor import execute_debate_with_streaming

router = APIRouter()


@router.post(
    "/start",
    status_code=status.HTTP_201_CREATED,
    response_model=DebateStartResponse,
    summary="Start new debate",
    description="""
Start a new debate between two agents with a judge.

**Requirements:**
- All three agents (A, B, Judge) must exist
- Positions must be opposite (one FOR, one AGAINST)

**Returns:**
- `run_id` - UUID of the created debate run
- `stream_url` - SSE endpoint to stream the debate execution
    """,
)
async def start_debate(
    debate_config: DebateStartRequest,
    db: AsyncSession = Depends(get_db)
) -> DebateStartResponse:
    """
    Start a new debate.

    Creates a new debate run and returns the stream URL for real-time updates.

    Args:
        debate_config: Debate configuration with topic, positions, and agent IDs
        db: Database session

    Returns:
        DebateStartResponse with run_id and stream_url
    """
    # Validate agents exist
    agent_a = await agent_crud.get_agent_by_id(db, debate_config.agent_a_id)
    agent_b = await agent_crud.get_agent_by_id(db, debate_config.agent_b_id)
    agent_j = await agent_crud.get_agent_by_id(db, debate_config.agent_j_id)

    if not agent_a:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent A with ID {debate_config.agent_a_id} not found"
        )
    if not agent_b:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent B with ID {debate_config.agent_b_id} not found"
        )
    if not agent_j:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Judge agent with ID {debate_config.agent_j_id} not found"
        )

    # Validate positions are opposite
    if debate_config.position_a == debate_config.position_b:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agent A and Agent B must have opposite positions (one FOR, one AGAINST)"
        )

    # Create run
    run = await create_run(
        db=db,
        topic=debate_config.topic,
        agent_a_id=debate_config.agent_a_id,
        agent_b_id=debate_config.agent_b_id,
        agent_j_id=debate_config.agent_j_id,
        position_a=debate_config.position_a,
        position_b=debate_config.position_b,
        config=debate_config.config,
        rubric=debate_config.rubric
    )

    return DebateStartResponse(
        run_id=str(run.run_id),
        status="pending",
        stream_url=f"/api/debate/stream/{run.run_id}"
    )


@router.get(
    "/stream/{run_id}",
    summary="Stream debate (SSE)",
    description="""
Execute and stream a debate via Server-Sent Events (SSE).

**SSE Event Types:**
| Event | Description |
|-------|-------------|
| `phase_start` | New phase begins (opening, rebuttal, summary, verdict) |
| `token` | Individual token from LLM generation |
| `score` | Scoring results after debate phase |
| `phase_end` | Phase completed |
| `verdict` | Final judgment with winner |
| `run_complete` | Debate finished successfully |
| `error` | Error during execution |

**Error Codes:**
- `404` - Run not found
- `400` - Run already completed or failed
- `409` - Run already in progress
    """,
)
async def stream_debate(
    run_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Stream debate execution via Server-Sent Events (SSE).

    Executes the complete debate graph and streams real-time events:
    - phase_start: When a new phase begins
    - token: Individual tokens as they're generated (for debater arguments)
    - score: Scoring results after each phase
    - phase_end: When a phase completes
    - verdict: Final verdict and winner announcement
    - run_complete: Debate execution completed
    - error: Error occurred during execution

    Args:
        run_id: UUID of the run to execute
        db: Database session

    Returns:
        EventSourceResponse with SSE stream
    """
    # Validate run exists
    run_data = await get_run_with_agents(db, run_id)
    if not run_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run {run_id} not found"
        )

    run = run_data["run"]

    # Check run status
    if run.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Run already completed"
        )
    if run.status == "running":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Run already in progress"
        )
    if run.status == "failed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Run previously failed"
        )

    # Execute with streaming
    return await execute_debate_with_streaming(str(run_id), db)


@router.get(
    "/runs",
    response_model=List[RunResponse],
    summary="List all runs",
    description="Retrieve all debate runs ordered by creation time (newest first).",
)
async def list_runs(db: AsyncSession = Depends(get_db)):
    """Get all debate runs ordered by creation time (newest first)"""
    runs = await get_all_runs(db)
    return runs


@router.get(
    "/runs/{run_id}",
    response_model=RunDetailResponse,
    summary="Get run details",
    description="Retrieve detailed run information including full agent configurations for A, B, and Judge.",
)
async def get_run(run_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Get run details with full agent information.

    Returns complete run data including agent configurations for A, B, and Judge.
    """
    run_data = await get_run_with_agents(db, run_id)
    if not run_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run {run_id} not found"
        )

    run = run_data["run"]

    # Build response with agent details
    return RunDetailResponse(
        run_id=run.run_id,
        topic=run.topic,
        position_a=run.position_a,
        position_b=run.position_b,
        agent_a=run_data["agent_a"],
        agent_b=run_data["agent_b"],
        agent_j=run_data["agent_j"],
        config_json=run.config_json,
        rubric_json=run.rubric_json,
        result_json=run.result_json,
        status=run.status,
        created_at=run.created_at,
        finished_at=run.finished_at
    )


@router.get(
    "/runs/{run_id}/turns",
    response_model=List[TurnResponse],
    summary="Get run turns (for replay)",
    description="""
Retrieve all turns for a debate run in chronological order.

**Use Cases:**
- Debate replay functionality
- Reviewing debate history
- Analyzing agent performance

**Returns:** List of turns including phase, role, content, and metadata.
    """,
)
async def get_run_turns(run_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Get all turns for a run ordered by creation time.

    Use this endpoint for debate replay functionality - returns all turns
    in chronological order with full content and metadata.
    """
    # First verify run exists
    run = await get_run_by_id(db, run_id)
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run {run_id} not found"
        )

    turns = await get_turns_by_run_id(db, run_id)
    return turns


@router.delete(
    "/runs/{run_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete run",
    description="Permanently delete a debate run and all its associated turns. This cannot be undone.",
)
async def delete_run_endpoint(run_id: UUID, db: AsyncSession = Depends(get_db)):
    """
    Delete a debate run and all associated turns.

    This operation cascades to delete all turns belonging to the run.
    """
    success = await run_crud.delete_run(db, run_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run {run_id} not found"
        )


@router.post(
    "/runs/{run_id}/swap",
    status_code=status.HTTP_201_CREATED,
    response_model=DebateStartResponse,
    summary="Create swap test",
    description="""
Create a position-swapped copy of a completed debate for bias detection.

**What it does:**
- Swaps Agent A ↔ Agent B
- Swaps Position A ↔ Position B
- Keeps the same topic, judge, and configuration

**Use Case:** Run both debates and compare results to detect position bias in the judge.

**Requirement:** Original run must be completed.
    """,
)
async def create_swap_test(
    run_id: UUID,
    db: AsyncSession = Depends(get_db)
) -> DebateStartResponse:
    """
    Create a swap test from a completed run.

    Swaps agent positions (A becomes B, B becomes A) while keeping
    the same topic, judge, and configuration. This helps detect
    position bias in the judge.
    """
    original = await get_run_by_id(db, run_id)

    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Run {run_id} not found"
        )

    if original.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only create swap test from completed runs"
        )

    # Create swapped run: Agent A ↔ B, Position A ↔ B
    swapped = await create_run(
        db=db,
        topic=original.topic,
        agent_a_id=original.agent_b_id,    # B → A
        agent_b_id=original.agent_a_id,    # A → B
        agent_j_id=original.agent_j_id,    # Judge unchanged
        position_a=original.position_b,    # B's position → A
        position_b=original.position_a,    # A's position → B
        config=original.config_json,
        rubric=original.rubric_json
    )

    return DebateStartResponse(
        run_id=str(swapped.run_id),
        status="pending",
        stream_url=f"/api/debate/stream/{swapped.run_id}"
    )


def _analyze_position_bias(original: dict, swapped: dict) -> dict:
    """
    Analyze position bias between original and swapped runs.

    Cases:
    - Same agent wins both → Agent skill difference (no bias)
    - Same position wins both → Position bias detected
    """
    orig_result = original["run"].result_json or {}
    swap_result = swapped["run"].result_json or {}

    orig_winner = orig_result.get("winner")  # "A", "B", or "DRAW"
    swap_winner = swap_result.get("winner")

    # Handle missing winner data
    if orig_winner is None or swap_winner is None:
        return {
            "bias_type": "inconclusive",
            "biased_toward": None,
            "description": "One or both debates have no winner data."
        }

    # Handle DRAW cases
    if orig_winner == "DRAW" or swap_winner == "DRAW":
        return {
            "bias_type": "inconclusive",
            "biased_toward": None,
            "description": "One or both debates ended in a draw. Cannot determine bias."
        }

    # Determine which position won in each run
    orig_winning_position = original["run"].position_a if orig_winner == "A" else original["run"].position_b
    swap_winning_position = swapped["run"].position_a if swap_winner == "A" else swapped["run"].position_b

    if orig_winning_position == swap_winning_position:
        # Same position won both times → position bias
        return {
            "bias_type": "position",
            "biased_toward": orig_winning_position,
            "description": f"Position '{orig_winning_position}' won in both runs. Judge may be biased toward this position."
        }
    else:
        # Different positions won → same agent won both (no position bias)
        return {
            "bias_type": "none",
            "biased_toward": None,
            "description": "Different positions won in each run. Results suggest agent skill difference rather than position bias."
        }


@router.get(
    "/runs/{run_id}/compare/{swap_run_id}",
    summary="Compare swap test",
    description="""
Analyze position bias by comparing original and swapped debate results.

**Bias Analysis Types:**
| Type | Meaning |
|------|---------|
| `position` | Same position won both times → Judge favors that position |
| `none` | Different positions won → No position bias detected |
| `inconclusive` | One/both draws or missing data |

**Requirement:** Both runs must be completed.
    """,
)
async def compare_swap_test(
    run_id: UUID,
    swap_run_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    Compare original run with its swap test to detect position bias.

    Returns both runs' details and bias analysis.
    """
    original = await get_run_with_agents(db, run_id)
    swapped = await get_run_with_agents(db, swap_run_id)

    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Original run {run_id} not found"
        )

    if not swapped:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Swapped run {swap_run_id} not found"
        )

    # Check both runs are completed
    if original["run"].status != "completed" or swapped["run"].status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both runs must be completed for comparison"
        )

    # Analyze bias
    analysis = _analyze_position_bias(original, swapped)

    orig_result = original["run"].result_json or {}
    swap_result = swapped["run"].result_json or {}

    return {
        "original": {
            "run_id": str(original["run"].run_id),
            "agent_a": original["agent_a"],
            "agent_b": original["agent_b"],
            "position_a": original["run"].position_a,
            "position_b": original["run"].position_b,
            "winner": orig_result.get("winner"),
            "scores_a": orig_result.get("scores_a"),
            "scores_b": orig_result.get("scores_b"),
        },
        "swapped": {
            "run_id": str(swapped["run"].run_id),
            "agent_a": swapped["agent_a"],
            "agent_b": swapped["agent_b"],
            "position_a": swapped["run"].position_a,
            "position_b": swapped["run"].position_b,
            "winner": swap_result.get("winner"),
            "scores_a": swap_result.get("scores_a"),
            "scores_b": swap_result.get("scores_b"),
        },
        "analysis": analysis
    }

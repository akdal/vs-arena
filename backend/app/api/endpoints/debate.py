"""
Debate API Endpoints
"""
from fastapi import APIRouter, HTTPException, status, Depends
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.schemas import DebateStartRequest, DebateStartResponse
from app.services.run_crud import create_run, get_run_with_agents, update_run_status
from app.services import agent_crud
from app.graph.executor import execute_debate_with_streaming

router = APIRouter()


@router.post("/start", status_code=status.HTTP_201_CREATED, response_model=DebateStartResponse)
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


@router.get("/stream/{run_id}")
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


@router.get("/runs")
async def list_runs():
    """Get all runs"""
    # TODO: Implement
    return {"runs": []}


@router.get("/runs/{run_id}")
async def get_run(run_id: UUID):
    """Get run details"""
    # TODO: Implement
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.get("/runs/{run_id}/turns")
async def get_run_turns(run_id: UUID):
    """Get all turns for a run (for replay)"""
    # TODO: Implement
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.delete("/runs/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_run(run_id: UUID):
    """Delete a run"""
    # TODO: Implement
    raise HTTPException(status_code=501, detail="Not implemented yet")

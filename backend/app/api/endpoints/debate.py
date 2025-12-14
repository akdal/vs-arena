"""
Debate API Endpoints
"""
from fastapi import APIRouter, HTTPException, status
from uuid import UUID

router = APIRouter()


@router.post("/start", status_code=status.HTTP_201_CREATED)
async def start_debate():
    """Start a new debate (create Run)"""
    # TODO: Implement
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.get("/stream/{run_id}")
async def stream_debate(run_id: UUID):
    """Stream debate progress via SSE"""
    # TODO: Implement SSE streaming
    raise HTTPException(status_code=501, detail="Not implemented yet")


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

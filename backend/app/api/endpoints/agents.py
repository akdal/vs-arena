"""
Agent API Endpoints
"""
from fastapi import APIRouter, HTTPException, status
from typing import List
from uuid import UUID

router = APIRouter()


@router.get("/")
async def list_agents():
    """Get all agents"""
    # TODO: Implement with database
    return {"agents": []}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_agent():
    """Create a new agent"""
    # TODO: Implement
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.get("/{agent_id}")
async def get_agent(agent_id: UUID):
    """Get agent by ID"""
    # TODO: Implement
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.put("/{agent_id}")
async def update_agent(agent_id: UUID):
    """Update an agent"""
    # TODO: Implement
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(agent_id: UUID):
    """Delete an agent"""
    # TODO: Implement
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.post("/{agent_id}/clone", status_code=status.HTTP_201_CREATED)
async def clone_agent(agent_id: UUID):
    """Clone an agent"""
    # TODO: Implement
    raise HTTPException(status_code=501, detail="Not implemented yet")


@router.post("/preview")
async def preview_agent():
    """Preview agent with 1-turn test"""
    # TODO: Implement SSE streaming
    raise HTTPException(status_code=501, detail="Not implemented yet")

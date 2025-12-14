"""
Agent API Endpoints
"""
import json
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.models.schemas import AgentCreate, AgentUpdate, AgentResponse, PreviewRequest
from app.services import agent_crud
from app.services.ollama import stream_ollama

router = APIRouter()


@router.get("/", response_model=List[AgentResponse])
async def list_agents(db: AsyncSession = Depends(get_db)):
    """Get all agents"""
    agents = await agent_crud.get_all_agents(db)
    return agents


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=AgentResponse)
async def create_agent(
    agent_data: AgentCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new agent"""
    agent = await agent_crud.create_agent(db, agent_data)
    return agent


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get agent by ID"""
    agent = await agent_crud.get_agent_by_id(db, agent_id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} not found"
        )
    return agent


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: UUID,
    agent_data: AgentUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update an agent"""
    agent = await agent_crud.update_agent(db, agent_id, agent_data)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} not found"
        )
    return agent


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(
    agent_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete an agent"""
    success = await agent_crud.delete_agent(db, agent_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} not found"
        )


@router.post("/{agent_id}/clone", status_code=status.HTTP_201_CREATED, response_model=AgentResponse)
async def clone_agent(
    agent_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Clone an agent"""
    cloned = await agent_crud.clone_agent(db, agent_id)
    if not cloned:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent {agent_id} not found"
        )
    return cloned


@router.post("/preview")
async def preview_agent(preview_data: PreviewRequest):
    """
    Preview agent with 1-turn test

    Generates an opening argument for the given topic and position using SSE streaming.
    """
    agent_config = preview_data.agent_config
    topic = preview_data.topic
    position = preview_data.position

    # Build the system prompt from persona
    persona = agent_config.persona_json
    system_prompt = f"""You are {agent_config.name}, a debate agent.
Role: {persona.get('role', 'debater')}
Style: {persona.get('style', 'structured and logical')}

Your task is to present a strong opening argument in a debate."""

    # Build the user prompt
    user_prompt = f"""Topic: {topic}
Position: {position}

Present your opening argument for this position. Be persuasive, logical, and structured."""

    # Get LLM parameters
    params = agent_config.params_json
    temperature = params.get('temperature', 0.7)
    max_tokens = params.get('max_tokens', 1024)

    async def event_generator():
        """Generate SSE events"""
        try:
            # Send start event
            yield {
                "event": "start",
                "data": json.dumps({
                    "topic": topic,
                    "position": position,
                    "agent": agent_config.name
                })
            }

            # Stream the response
            full_text = ""
            async for chunk in stream_ollama(
                model=agent_config.model,
                prompt=user_prompt,
                system=system_prompt,
                temperature=temperature,
                max_tokens=max_tokens
            ):
                full_text += chunk
                yield {
                    "event": "chunk",
                    "data": json.dumps({"content": chunk})
                }

            # Send completion event
            yield {
                "event": "done",
                "data": json.dumps({
                    "argument": full_text,
                    "topic": topic,
                    "position": position
                })
            }

        except Exception as e:
            yield {
                "event": "error",
                "data": json.dumps({"error": str(e)})
            }

    return EventSourceResponse(event_generator())

"""
Agent CRUD Operations
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID
import uuid

from app.models.agent import Agent
from app.models.schemas import AgentCreate, AgentUpdate


async def get_all_agents(db: AsyncSession) -> List[Agent]:
    """Get all agents"""
    result = await db.execute(select(Agent).order_by(Agent.created_at.desc()))
    return list(result.scalars().all())


async def get_agent_by_id(db: AsyncSession, agent_id: UUID) -> Optional[Agent]:
    """Get agent by ID"""
    result = await db.execute(select(Agent).where(Agent.agent_id == agent_id))
    return result.scalar_one_or_none()


async def create_agent(db: AsyncSession, agent_data: AgentCreate) -> Agent:
    """Create a new agent"""
    agent = Agent(
        agent_id=uuid.uuid4(),
        name=agent_data.name,
        model=agent_data.model,
        persona_json=agent_data.persona_json,
        params_json=agent_data.params_json,
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent


async def update_agent(
    db: AsyncSession, agent_id: UUID, agent_data: AgentUpdate
) -> Optional[Agent]:
    """Update an agent"""
    agent = await get_agent_by_id(db, agent_id)
    if not agent:
        return None

    # Update only provided fields
    update_data = agent_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(agent, field, value)

    await db.commit()
    await db.refresh(agent)
    return agent


async def delete_agent(db: AsyncSession, agent_id: UUID) -> bool:
    """Delete an agent"""
    agent = await get_agent_by_id(db, agent_id)
    if not agent:
        return False

    await db.delete(agent)
    await db.commit()
    return True


async def clone_agent(db: AsyncSession, agent_id: UUID) -> Optional[Agent]:
    """Clone an agent"""
    original = await get_agent_by_id(db, agent_id)
    if not original:
        return None

    cloned = Agent(
        agent_id=uuid.uuid4(),
        name=f"{original.name} (Copy)",
        model=original.model,
        persona_json=original.persona_json.copy(),
        params_json=original.params_json.copy(),
    )
    db.add(cloned)
    await db.commit()
    await db.refresh(cloned)
    return cloned

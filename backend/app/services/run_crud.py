"""
Run CRUD Operations
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime
import uuid

from app.models.run import Run
from app.models.agent import Agent
from app.models.turn import Turn


async def create_run(
    db: AsyncSession,
    topic: str,
    agent_a_id: UUID,
    agent_b_id: UUID,
    agent_j_id: UUID,
    position_a: str,
    position_b: str,
    config: Dict[str, Any] = None,
    rubric: Dict[str, Any] = None
) -> Run:
    """Create a new debate run"""
    run = Run(
        run_id=uuid.uuid4(),
        topic=topic,
        agent_a_id=agent_a_id,
        agent_b_id=agent_b_id,
        agent_j_id=agent_j_id,
        position_a=position_a,
        position_b=position_b,
        config_json=config or {
            "rounds": 3,
            "max_tokens_per_turn": 1024
        },
        rubric_json=rubric or {
            "argumentation_weight": 35,
            "rebuttal_weight": 30,
            "delivery_weight": 20,
            "strategy_weight": 15
        },
        status="pending"
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)
    return run


async def get_run_by_id(db: AsyncSession, run_id: UUID) -> Optional[Run]:
    """Get run by ID"""
    result = await db.execute(select(Run).where(Run.run_id == run_id))
    return result.scalar_one_or_none()


async def get_run_with_agents(db: AsyncSession, run_id: UUID) -> Optional[Dict[str, Any]]:
    """Fetch run with all agent details"""
    result = await db.execute(select(Run).where(Run.run_id == run_id))
    run = result.scalar_one_or_none()
    if not run:
        return None

    # Fetch agents
    agent_a = await db.get(Agent, run.agent_a_id)
    agent_b = await db.get(Agent, run.agent_b_id)
    agent_j = await db.get(Agent, run.agent_j_id)

    if not all([agent_a, agent_b, agent_j]):
        return None

    return {
        "run": run,
        "agent_a": {
            "agent_id": str(agent_a.agent_id),
            "name": agent_a.name,
            "model": agent_a.model,
            "persona_json": agent_a.persona_json,
            "params_json": agent_a.params_json,
            "created_at": agent_a.created_at,
            "updated_at": agent_a.updated_at
        },
        "agent_b": {
            "agent_id": str(agent_b.agent_id),
            "name": agent_b.name,
            "model": agent_b.model,
            "persona_json": agent_b.persona_json,
            "params_json": agent_b.params_json,
            "created_at": agent_b.created_at,
            "updated_at": agent_b.updated_at
        },
        "agent_j": {
            "agent_id": str(agent_j.agent_id),
            "name": agent_j.name,
            "model": agent_j.model,
            "persona_json": agent_j.persona_json,
            "params_json": agent_j.params_json,
            "created_at": agent_j.created_at,
            "updated_at": agent_j.updated_at
        }
    }


async def update_run_status(
    db: AsyncSession,
    run_id: UUID,
    status: str,
    result_json: Dict[str, Any] = None
) -> Optional[Run]:
    """Update run status and optionally result"""
    run = await db.get(Run, run_id)
    if not run:
        return None

    run.status = status
    if result_json:
        run.result_json = result_json
    if status == "completed":
        run.finished_at = datetime.utcnow()

    await db.commit()
    await db.refresh(run)
    return run


async def get_all_runs(db: AsyncSession) -> list[Run]:
    """Get all runs ordered by creation time"""
    result = await db.execute(select(Run).order_by(Run.created_at.desc()))
    return list(result.scalars().all())


async def delete_run(db: AsyncSession, run_id: UUID) -> bool:
    """Delete a run (cascades to turns)"""
    run = await db.get(Run, run_id)
    if not run:
        return False

    await db.delete(run)
    await db.commit()
    return True


async def get_turns_by_run_id(db: AsyncSession, run_id: UUID) -> list[Turn]:
    """Get all turns for a run ordered by creation time"""
    result = await db.execute(
        select(Turn)
        .where(Turn.run_id == run_id)
        .order_by(Turn.created_at.asc())
    )
    return list(result.scalars().all())

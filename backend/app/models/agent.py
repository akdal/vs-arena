"""
Agent SQLAlchemy Model
"""
from sqlalchemy import Column, String, TIMESTAMP, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.db.database import Base


class Agent(Base):
    __tablename__ = "agents"

    agent_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    persona_json = Column(JSONB, nullable=False, default=dict)
    params_json = Column(JSONB, nullable=False, default=dict)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

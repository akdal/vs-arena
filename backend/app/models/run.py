"""
Run SQLAlchemy Model
"""
from sqlalchemy import Column, String, Text, TIMESTAMP, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.db.database import Base


class Run(Base):
    __tablename__ = "runs"

    run_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    topic = Column(Text, nullable=False)
    agent_a_id = Column(UUID(as_uuid=True), ForeignKey("agents.agent_id"), nullable=False)
    agent_b_id = Column(UUID(as_uuid=True), ForeignKey("agents.agent_id"), nullable=False)
    agent_j_id = Column(UUID(as_uuid=True), ForeignKey("agents.agent_id"), nullable=False)
    position_a = Column(Text, nullable=False)
    position_b = Column(Text, nullable=False)
    config_json = Column(JSONB, nullable=False, default={"rounds": 3})
    rubric_json = Column(JSONB, nullable=False, default=dict)
    result_json = Column(JSONB, nullable=True)
    status = Column(String(20), nullable=False, default="pending")
    created_at = Column(TIMESTAMP, server_default=func.now())
    finished_at = Column(TIMESTAMP, nullable=True)

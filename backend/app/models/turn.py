"""
Turn SQLAlchemy Model
"""
from sqlalchemy import Column, String, Text, TIMESTAMP, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.db.database import Base


class Turn(Base):
    __tablename__ = "turns"

    turn_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(UUID(as_uuid=True), ForeignKey("runs.run_id", ondelete="CASCADE"), nullable=False)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.agent_id"), nullable=False)
    phase = Column(String(30), nullable=False)
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    targets = Column(JSONB, default=list)
    # Use metadata_json attribute name to avoid SQLAlchemy reserved 'metadata' attribute
    metadata_json = Column("metadata", JSONB, default=dict)
    created_at = Column(TIMESTAMP, server_default=func.now())

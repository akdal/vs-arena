"""
Pydantic schemas for API request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal
from uuid import UUID
from datetime import datetime


# Agent Schemas
class AgentBase(BaseModel):
    """Base agent schema"""
    name: str = Field(..., max_length=50, description="Agent name")
    model: str = Field(..., max_length=50, description="Ollama model name")
    persona_json: Dict[str, Any] = Field(
        default_factory=dict,
        description="Agent persona configuration (role, style, etc.)"
    )
    params_json: Dict[str, Any] = Field(
        default_factory=dict,
        description="LLM parameters (temperature, max_tokens, etc.)"
    )


class AgentCreate(AgentBase):
    """Schema for creating an agent"""
    pass


class AgentUpdate(BaseModel):
    """Schema for updating an agent (all fields optional)"""
    name: Optional[str] = Field(None, max_length=50)
    model: Optional[str] = Field(None, max_length=50)
    persona_json: Optional[Dict[str, Any]] = None
    params_json: Optional[Dict[str, Any]] = None


class AgentResponse(AgentBase):
    """Schema for agent response"""
    agent_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Preview Schemas
class PreviewRequest(BaseModel):
    """Schema for agent preview request"""
    agent_config: AgentCreate = Field(..., description="Agent configuration to preview")
    topic: str = Field(..., description="Debate topic")
    position: Literal["FOR", "AGAINST"] = Field(..., description="Position to argue")


class PreviewResponse(BaseModel):
    """Schema for agent preview response"""
    argument: str = Field(..., description="Generated opening argument")
    topic: str
    position: str


# Run Schemas
class RunCreate(BaseModel):
    """Schema for creating a debate run"""
    topic: str = Field(..., max_length=500)
    position_a: Literal["FOR", "AGAINST"]
    position_b: Literal["FOR", "AGAINST"]
    agent_a_id: UUID
    agent_b_id: UUID
    agent_j_id: Optional[UUID] = None
    config_json: Dict[str, Any] = Field(default_factory=dict)


class RunResponse(BaseModel):
    """Schema for run response"""
    run_id: UUID
    topic: str
    position_a: str
    position_b: str
    agent_a_id: UUID
    agent_b_id: UUID
    agent_j_id: Optional[UUID]
    config_json: Dict[str, Any]
    status: str
    winner: Optional[str]
    verdict_json: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


# Turn Schemas
class TurnResponse(BaseModel):
    """Schema for turn response"""
    turn_id: UUID
    run_id: UUID
    turn_number: int
    speaker: str
    content_json: Dict[str, Any]
    timestamp: datetime

    class Config:
        from_attributes = True

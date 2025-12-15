"""
Pydantic schemas for API request/response validation
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, Literal, List
from uuid import UUID
from datetime import datetime


# Agent Schemas
class AgentBase(BaseModel):
    """Base agent schema"""
    name: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Agent name",
        examples=["Aristotle", "Socrates", "Devil's Advocate"],
    )
    model: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="Ollama model name",
        examples=["llama3.2", "qwen2.5:7b", "mistral"],
    )
    persona_json: Dict[str, Any] = Field(
        default_factory=dict,
        description="Agent persona configuration (role, style, forbidden_phrases, etc.)",
        examples=[
            {
                "role": "Philosopher",
                "style": "Uses Socratic questioning and logical reasoning",
                "tone": "measured and thoughtful",
                "forbidden_phrases": ["obviously", "clearly"],
            }
        ],
    )
    params_json: Dict[str, Any] = Field(
        default_factory=dict,
        description="LLM parameters (temperature, max_tokens, top_p, etc.)",
        examples=[{"temperature": 0.7, "max_tokens": 512, "top_p": 0.9}],
    )


class AgentCreate(AgentBase):
    """Schema for creating an agent"""
    pass


class AgentUpdate(BaseModel):
    """Schema for updating an agent (all fields optional)"""
    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=50,
        description="New agent name",
        examples=["Updated Aristotle"],
    )
    model: Optional[str] = Field(
        None,
        min_length=1,
        max_length=50,
        description="New Ollama model",
        examples=["llama3.2"],
    )
    persona_json: Optional[Dict[str, Any]] = Field(
        None,
        description="Updated persona configuration",
    )
    params_json: Optional[Dict[str, Any]] = Field(
        None,
        description="Updated LLM parameters",
    )


class AgentResponse(AgentBase):
    """Schema for agent response with metadata"""
    agent_id: UUID = Field(..., description="Unique agent identifier")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        from_attributes = True


# Preview Schemas
class PreviewRequest(BaseModel):
    """Schema for agent preview request - test an agent with a sample topic"""
    agent_config: AgentCreate = Field(..., description="Agent configuration to preview")
    topic: str = Field(
        ...,
        min_length=1,
        description="Debate topic to test with",
        examples=["AI will replace most human jobs within 10 years"],
    )
    position: Literal["FOR", "AGAINST"] = Field(
        ...,
        description="Position to argue (FOR or AGAINST the topic)",
        examples=["FOR"],
    )


class PreviewResponse(BaseModel):
    """Schema for agent preview response"""
    argument: str = Field(
        ...,
        description="Generated opening argument",
        examples=["Ladies and gentlemen, I stand before you to argue..."],
    )
    topic: str = Field(..., description="The debate topic")
    position: str = Field(..., description="The argued position")


# Run Schemas
class RunCreate(BaseModel):
    """Schema for creating a debate run"""
    topic: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Debate topic",
        examples=["Artificial intelligence will benefit humanity more than harm it"],
    )
    position_a: Literal["FOR", "AGAINST"] = Field(
        ...,
        description="Agent A's position",
        examples=["FOR"],
    )
    position_b: Literal["FOR", "AGAINST"] = Field(
        ...,
        description="Agent B's position (must be opposite of position_a)",
        examples=["AGAINST"],
    )
    agent_a_id: UUID = Field(..., description="Agent A's UUID")
    agent_b_id: UUID = Field(..., description="Agent B's UUID")
    agent_j_id: Optional[UUID] = Field(None, description="Judge agent's UUID (optional)")
    config_json: Dict[str, Any] = Field(
        default_factory=dict,
        description="Debate configuration",
        examples=[{"rounds": 3, "max_tokens_per_turn": 1024}],
    )
    rubric_json: Dict[str, Any] = Field(
        default_factory=lambda: {
            "argumentation_weight": 35,
            "rebuttal_weight": 30,
            "delivery_weight": 20,
            "strategy_weight": 15
        },
        description="Scoring rubric weights (must sum to 100)",
    )


class RunResponse(BaseModel):
    """Schema for run response (list view)"""
    run_id: UUID = Field(..., description="Unique run identifier")
    topic: str = Field(..., description="Debate topic")
    position_a: str = Field(..., description="Agent A's position")
    position_b: str = Field(..., description="Agent B's position")
    agent_a_id: UUID = Field(..., description="Agent A's UUID")
    agent_b_id: UUID = Field(..., description="Agent B's UUID")
    agent_j_id: Optional[UUID] = Field(None, description="Judge agent's UUID")
    config_json: Dict[str, Any] = Field(..., description="Debate configuration")
    rubric_json: Dict[str, Any] = Field(..., description="Scoring rubric weights")
    result_json: Optional[Dict[str, Any]] = Field(
        None,
        description="Final results including scores and verdict",
    )
    status: str = Field(
        ...,
        description="Run status: pending, running, completed, failed",
        examples=["completed"],
    )
    created_at: datetime = Field(..., description="Creation timestamp")
    finished_at: Optional[datetime] = Field(None, description="Completion timestamp")

    class Config:
        from_attributes = True


class RunDetailResponse(BaseModel):
    """Schema for run detail response (with full agent info)"""
    run_id: UUID = Field(..., description="Unique run identifier")
    topic: str = Field(..., description="Debate topic")
    position_a: str = Field(..., description="Agent A's position")
    position_b: str = Field(..., description="Agent B's position")
    agent_a: AgentResponse = Field(..., description="Full Agent A configuration")
    agent_b: AgentResponse = Field(..., description="Full Agent B configuration")
    agent_j: AgentResponse = Field(..., description="Full Judge agent configuration")
    config_json: Dict[str, Any] = Field(..., description="Debate configuration")
    rubric_json: Dict[str, Any] = Field(..., description="Scoring rubric weights")
    result_json: Optional[Dict[str, Any]] = Field(
        None,
        description="Final results including scores and verdict",
    )
    status: str = Field(
        ...,
        description="Run status: pending, running, completed, failed",
        examples=["completed"],
    )
    created_at: datetime = Field(..., description="Creation timestamp")
    finished_at: Optional[datetime] = Field(None, description="Completion timestamp")


# Turn Schemas
class TurnResponse(BaseModel):
    """Schema for turn response - a single debate turn"""
    turn_id: UUID = Field(..., description="Unique turn identifier")
    run_id: UUID = Field(..., description="Parent run identifier")
    agent_id: UUID = Field(..., description="Agent who made this turn")
    phase: str = Field(
        ...,
        description="Debate phase (opening_a, opening_b, rebuttal_a, rebuttal_b, summary_a, summary_b, judge_intro, judge_verdict, score_*)",
        examples=["opening_a", "rebuttal_b", "judge_verdict"],
    )
    role: str = Field(
        ...,
        description="Agent role in this turn",
        examples=["debater_a", "debater_b", "judge"],
    )
    content: str = Field(
        ...,
        description="Generated content for this turn",
        examples=["Ladies and gentlemen, I argue that artificial intelligence..."],
    )
    targets: List[UUID] = Field(
        default_factory=list,
        description="Target turn IDs this turn is responding to (for rebuttals)",
    )
    metadata_json: Dict[str, Any] = Field(
        default_factory=dict,
        description="Additional metadata (scores, penalties, etc.)",
    )
    created_at: datetime = Field(..., description="Turn creation timestamp")

    class Config:
        from_attributes = True


# Debate Schemas
class DebateStartRequest(BaseModel):
    """
    Schema for starting a debate.

    Note: position_a and position_b must be opposite (one FOR, one AGAINST).
    """
    topic: str = Field(
        ...,
        min_length=1,
        max_length=500,
        description="Debate topic statement",
        examples=["Artificial intelligence will benefit humanity more than harm it"],
    )
    position_a: Literal["FOR", "AGAINST"] = Field(
        ...,
        description="Agent A's position",
        examples=["FOR"],
    )
    position_b: Literal["FOR", "AGAINST"] = Field(
        ...,
        description="Agent B's position (must be opposite of position_a)",
        examples=["AGAINST"],
    )
    agent_a_id: UUID = Field(..., description="Agent A's UUID")
    agent_b_id: UUID = Field(..., description="Agent B's UUID")
    agent_j_id: UUID = Field(..., description="Judge agent's UUID")
    config: Optional[Dict[str, Any]] = Field(
        default_factory=lambda: {"rounds": 3, "max_tokens_per_turn": 1024},
        description="Debate configuration (rounds, max_tokens_per_turn)",
    )
    rubric: Optional[Dict[str, Any]] = Field(
        default_factory=lambda: {
            "argumentation_weight": 35,
            "rebuttal_weight": 30,
            "delivery_weight": 20,
            "strategy_weight": 15
        },
        description="Scoring rubric weights (must sum to 100)",
    )


class DebateStartResponse(BaseModel):
    """Schema for debate start response - returned after starting a debate"""
    run_id: str = Field(
        ...,
        description="UUID of the created debate run",
        examples=["550e8400-e29b-41d4-a716-446655440000"],
    )
    status: str = Field(
        ...,
        description="Run status (initially 'pending')",
        examples=["pending"],
    )
    stream_url: str = Field(
        ...,
        description="SSE stream URL for real-time debate updates",
        examples=["/api/debate/stream/550e8400-e29b-41d4-a716-446655440000"],
    )

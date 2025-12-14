"""
LangGraph State Definitions for VS Arena Debate Flow
"""
from typing import TypedDict, Literal, Optional, List, Dict, Any


class Turn(TypedDict):
    """Single turn in the debate"""
    turn_id: str
    agent_id: str
    phase: str  # "opening_a", "rebuttal_b", "judge_verdict", etc.
    role: Literal["debater", "judge"]
    content: str
    targets: List[str]  # Target turn_ids for rebuttals
    metadata: Dict[str, Any]  # Scores, timestamps, etc.


class DebateState(TypedDict):
    """Complete debate state managed by LangGraph"""
    # Run metadata
    run_id: str
    topic: str
    position_a: str
    position_b: str

    # Agent information (full Agent objects from DB)
    agent_a: Dict[str, Any]
    agent_b: Dict[str, Any]
    agent_j: Dict[str, Any]

    # Configuration
    config: Dict[str, Any]  # rounds, max_tokens, etc.
    rubric: Dict[str, Any]  # Scoring criteria

    # Execution state
    current_phase: str
    turns: List[Turn]

    # Scoring state
    scores_a: Dict[str, Any]
    scores_b: Dict[str, Any]

    # Final results
    winner: Optional[Literal["A", "B", "DRAW"]]
    verdict: Optional[str]
    status: Literal["pending", "running", "judging", "completed", "failed"]

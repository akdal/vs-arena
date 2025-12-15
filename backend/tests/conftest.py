"""
Shared test fixtures for VS Arena backend tests
"""
import pytest
from uuid import uuid4
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.agent import Agent
from app.models.run import Run
from app.models.turn import Turn
from app.models.schemas import AgentCreate, AgentUpdate, DebateStartRequest


@pytest.fixture
def mock_db():
    """Create a mock AsyncSession for testing CRUD operations."""
    session = AsyncMock(spec=AsyncSession)
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.delete = AsyncMock()
    session.rollback = AsyncMock()
    session.close = AsyncMock()
    return session


@pytest.fixture
def sample_agent_id():
    """Generate a sample agent UUID."""
    return uuid4()


@pytest.fixture
def sample_agent_create():
    """Create sample AgentCreate schema for tests."""
    return AgentCreate(
        name="Test Agent",
        model="llama3",
        persona_json={"role": "debater", "style": "analytical"},
        params_json={"temperature": 0.7, "max_tokens": 1024}
    )


@pytest.fixture
def sample_agent(sample_agent_id):
    """Create a sample Agent model instance."""
    return Agent(
        agent_id=sample_agent_id,
        name="Test Agent",
        model="llama3",
        persona_json={"role": "debater", "style": "analytical"},
        params_json={"temperature": 0.7, "max_tokens": 1024},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


@pytest.fixture
def sample_agent_list():
    """Create a list of sample agents."""
    return [
        Agent(
            agent_id=uuid4(),
            name="Agent 1",
            model="llama3",
            persona_json={"role": "debater"},
            params_json={"temperature": 0.8},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        ),
        Agent(
            agent_id=uuid4(),
            name="Agent 2",
            model="qwen2.5",
            persona_json={"role": "judge"},
            params_json={"temperature": 0.5},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        ),
    ]


@pytest.fixture
def sample_run_id():
    """Generate a sample run UUID."""
    return uuid4()


@pytest.fixture
def sample_run(sample_run_id, sample_agent_list):
    """Create a sample Run model instance."""
    agents = sample_agent_list
    return Run(
        run_id=sample_run_id,
        topic="AI will benefit humanity",
        agent_a_id=agents[0].agent_id,
        agent_b_id=agents[1].agent_id,
        agent_j_id=agents[0].agent_id,
        position_a="FOR",
        position_b="AGAINST",
        config_json={"rounds": 3, "max_tokens_per_turn": 1024},
        rubric_json={
            "argumentation_weight": 35,
            "rebuttal_weight": 30,
            "delivery_weight": 20,
            "strategy_weight": 15
        },
        result_json=None,
        status="pending",
        created_at=datetime.utcnow(),
        finished_at=None
    )


@pytest.fixture
def sample_completed_run(sample_run):
    """Create a sample completed Run."""
    sample_run.status = "completed"
    sample_run.finished_at = datetime.utcnow()
    sample_run.result_json = {
        "winner": "A",
        "scores_a": {"argumentation": 8, "rebuttal": 7, "delivery": 8, "strategy": 7},
        "scores_b": {"argumentation": 7, "rebuttal": 6, "delivery": 7, "strategy": 6},
        "total_a": 75,
        "total_b": 65
    }
    return sample_run


@pytest.fixture
def sample_debate_start_request(sample_agent_list):
    """Create sample DebateStartRequest."""
    agents = sample_agent_list
    return DebateStartRequest(
        topic="AI will benefit humanity",
        position_a="FOR",
        position_b="AGAINST",
        agent_a_id=agents[0].agent_id,
        agent_b_id=agents[1].agent_id,
        agent_j_id=agents[0].agent_id
    )


@pytest.fixture
def mock_ollama_response():
    """Mock Ollama API response."""
    return {"response": "Test generated text", "done": True}


@pytest.fixture
def mock_ollama_stream_response():
    """Mock Ollama streaming response lines."""
    return [
        '{"response": "Hello ", "done": false}',
        '{"response": "World", "done": true}'
    ]


@pytest.fixture
def sample_turns(sample_run_id, sample_agent_list):
    """Create a list of sample turns for a run."""
    agents = sample_agent_list
    base_time = datetime.utcnow()
    return [
        Turn(
            turn_id=uuid4(),
            run_id=sample_run_id,
            agent_id=agents[0].agent_id,
            phase="opening",
            role="agent_a",
            content="Opening argument from Agent A",
            targets=[],
            metadata_json={"round": 1},
            created_at=base_time
        ),
        Turn(
            turn_id=uuid4(),
            run_id=sample_run_id,
            agent_id=agents[1].agent_id,
            phase="opening",
            role="agent_b",
            content="Opening argument from Agent B",
            targets=[],
            metadata_json={"round": 1},
            created_at=base_time
        ),
    ]

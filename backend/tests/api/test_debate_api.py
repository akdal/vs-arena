"""
Tests for Debate API endpoints
"""
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock, MagicMock
from uuid import uuid4
from datetime import datetime

from app.main import app
from app.models.run import Run
from app.models.agent import Agent
from app.models.turn import Turn


def create_mock_agent(agent_id=None, name="Test Agent"):
    """Create a mock agent for testing."""
    return Agent(
        agent_id=agent_id or uuid4(),
        name=name,
        model="llama3",
        persona_json={"role": "debater"},
        params_json={"temperature": 0.7},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


def create_mock_run(run_id=None, status="pending", agent_a_id=None, agent_b_id=None, agent_j_id=None):
    """Create a mock run for testing."""
    return Run(
        run_id=run_id or uuid4(),
        topic="Test topic",
        agent_a_id=agent_a_id or uuid4(),
        agent_b_id=agent_b_id or uuid4(),
        agent_j_id=agent_j_id or uuid4(),
        position_a="FOR",
        position_b="AGAINST",
        config_json={"rounds": 3},
        rubric_json={"argumentation_weight": 35},
        result_json=None if status == "pending" else {"winner": "A"},
        status=status,
        created_at=datetime.utcnow(),
        finished_at=None if status == "pending" else datetime.utcnow()
    )


def create_mock_turn(run_id, agent_id, phase="opening", role="agent_a", content="Test content"):
    """Create a mock turn for testing."""
    return Turn(
        turn_id=uuid4(),
        run_id=run_id,
        agent_id=agent_id,
        phase=phase,
        role=role,
        content=content,
        targets=[],
        metadata_json={"round": 1},
        created_at=datetime.utcnow()
    )


class TestStartDebate:
    """Tests for POST /api/debate/start endpoint."""

    @pytest.mark.asyncio
    async def test_starts_debate_successfully(self):
        """POST /api/debate/start should create run with valid data."""
        agent_a = create_mock_agent()
        agent_b = create_mock_agent(name="Agent B")
        agent_j = create_mock_agent(name="Judge")
        mock_run = create_mock_run(
            agent_a_id=agent_a.agent_id,
            agent_b_id=agent_b.agent_id,
            agent_j_id=agent_j.agent_id
        )

        # Use a dict lookup instead of fragile side_effect ordering
        agent_lookup = {
            agent_a.agent_id: agent_a,
            agent_b.agent_id: agent_b,
            agent_j.agent_id: agent_j,
        }

        async def mock_get_agent_by_id(db, agent_id):
            return agent_lookup.get(agent_id)

        with patch('app.api.endpoints.debate.agent_crud.get_agent_by_id',
                   side_effect=mock_get_agent_by_id):
            with patch('app.api.endpoints.debate.create_run',
                       new_callable=AsyncMock, return_value=mock_run):
                transport = ASGITransport(app=app)
                async with AsyncClient(transport=transport, base_url="http://test") as client:
                    response = await client.post("/api/debate/start", json={
                        "topic": "AI will benefit humanity",
                        "position_a": "FOR",
                        "position_b": "AGAINST",
                        "agent_a_id": str(agent_a.agent_id),
                        "agent_b_id": str(agent_b.agent_id),
                        "agent_j_id": str(agent_j.agent_id)
                    })

                assert response.status_code == 201
                data = response.json()
                assert "run_id" in data
                assert data["run_id"] == str(mock_run.run_id)
                assert data["status"] == "pending"
                assert "stream_url" in data
                assert f"/api/debate/stream/{mock_run.run_id}" in data["stream_url"]

    @pytest.mark.asyncio
    async def test_rejects_same_positions(self):
        """POST /api/debate/start should reject same positions."""
        agent_a = create_mock_agent()
        agent_b = create_mock_agent(name="Agent B")
        agent_j = create_mock_agent(name="Judge")

        # Use a dict lookup instead of fragile side_effect ordering
        agent_lookup = {
            agent_a.agent_id: agent_a,
            agent_b.agent_id: agent_b,
            agent_j.agent_id: agent_j,
        }

        async def mock_get_agent_by_id(db, agent_id):
            return agent_lookup.get(agent_id)

        with patch('app.api.endpoints.debate.agent_crud.get_agent_by_id',
                   side_effect=mock_get_agent_by_id):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/api/debate/start", json={
                    "topic": "Test topic",
                    "position_a": "FOR",
                    "position_b": "FOR",  # Same position
                    "agent_a_id": str(agent_a.agent_id),
                    "agent_b_id": str(agent_b.agent_id),
                    "agent_j_id": str(agent_j.agent_id)
                })

            assert response.status_code == 400
            assert "opposite" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_returns_404_when_agent_not_found(self):
        """POST /api/debate/start should return 404 for missing agent."""
        with patch('app.api.endpoints.debate.agent_crud.get_agent_by_id',
                   new_callable=AsyncMock, return_value=None):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/api/debate/start", json={
                    "topic": "Test topic",
                    "position_a": "FOR",
                    "position_b": "AGAINST",
                    "agent_a_id": str(uuid4()),
                    "agent_b_id": str(uuid4()),
                    "agent_j_id": str(uuid4())
                })

            assert response.status_code == 404


class TestListRuns:
    """Tests for GET /api/debate/runs endpoint."""

    @pytest.mark.asyncio
    async def test_returns_list_of_runs(self):
        """GET /api/debate/runs should return list of runs."""
        mock_runs = [create_mock_run(), create_mock_run()]

        with patch('app.api.endpoints.debate.get_all_runs',
                   new_callable=AsyncMock, return_value=mock_runs):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/api/debate/runs")

            assert response.status_code == 200
            assert len(response.json()) == 2

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_runs(self):
        """GET /api/debate/runs should return empty list when no runs."""
        with patch('app.api.endpoints.debate.get_all_runs',
                   new_callable=AsyncMock, return_value=[]):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/api/debate/runs")

            assert response.status_code == 200
            assert response.json() == []


class TestGetRun:
    """Tests for GET /api/debate/runs/{id} endpoint."""

    @pytest.mark.asyncio
    async def test_returns_run_with_agents(self):
        """GET /api/debate/runs/{id} should return run with agent details."""
        mock_run = create_mock_run()
        mock_data = {
            "run": mock_run,
            "agent_a": {"agent_id": str(uuid4()), "name": "Agent A", "model": "llama3",
                       "persona_json": {}, "params_json": {},
                       "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            "agent_b": {"agent_id": str(uuid4()), "name": "Agent B", "model": "llama3",
                       "persona_json": {}, "params_json": {},
                       "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            "agent_j": {"agent_id": str(uuid4()), "name": "Judge", "model": "llama3",
                       "persona_json": {}, "params_json": {},
                       "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
        }

        with patch('app.api.endpoints.debate.get_run_with_agents',
                   new_callable=AsyncMock, return_value=mock_data):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get(f"/api/debate/runs/{mock_run.run_id}")

            assert response.status_code == 200
            data = response.json()
            # Verify run data
            assert data["topic"] == mock_run.topic
            assert data["position_a"] == mock_run.position_a
            assert data["position_b"] == mock_run.position_b
            assert data["status"] == mock_run.status
            # Verify all agents present with correct data
            assert "agent_a" in data
            assert data["agent_a"]["name"] == "Agent A"
            assert data["agent_a"]["model"] == "llama3"
            assert "agent_b" in data
            assert data["agent_b"]["name"] == "Agent B"
            assert "agent_j" in data
            assert data["agent_j"]["name"] == "Judge"

    @pytest.mark.asyncio
    async def test_returns_404_when_not_found(self):
        """GET /api/debate/runs/{id} should return 404 for unknown ID."""
        with patch('app.api.endpoints.debate.get_run_with_agents',
                   new_callable=AsyncMock, return_value=None):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get(f"/api/debate/runs/{uuid4()}")

            assert response.status_code == 404


class TestDeleteRun:
    """Tests for DELETE /api/debate/runs/{id} endpoint."""

    @pytest.mark.asyncio
    async def test_deletes_run_returns_204(self):
        """DELETE /api/debate/runs/{id} should return 204 on success."""
        # Patch run_crud.delete_run since debate.py imports it as module
        with patch('app.api.endpoints.debate.run_crud.delete_run',
                   new_callable=AsyncMock, return_value=True):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.delete(f"/api/debate/runs/{uuid4()}")

            assert response.status_code == 204

    @pytest.mark.asyncio
    async def test_returns_404_when_not_found(self):
        """DELETE /api/debate/runs/{id} should return 404 for unknown ID."""
        # Patch run_crud.delete_run since debate.py imports it as module
        with patch('app.api.endpoints.debate.run_crud.delete_run',
                   new_callable=AsyncMock, return_value=False):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.delete(f"/api/debate/runs/{uuid4()}")

            assert response.status_code == 404


class TestSwapTest:
    """Tests for POST /api/debate/runs/{id}/swap endpoint."""

    @pytest.mark.asyncio
    async def test_swap_only_from_completed_run(self):
        """POST /api/debate/runs/{id}/swap should reject non-completed runs."""
        mock_run = create_mock_run(status="pending")

        with patch('app.api.endpoints.debate.get_run_by_id',
                   new_callable=AsyncMock, return_value=mock_run):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(f"/api/debate/runs/{mock_run.run_id}/swap")

            assert response.status_code == 400
            assert "completed" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_swap_returns_404_when_not_found(self):
        """POST /api/debate/runs/{id}/swap should return 404 for unknown ID."""
        with patch('app.api.endpoints.debate.get_run_by_id',
                   new_callable=AsyncMock, return_value=None):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(f"/api/debate/runs/{uuid4()}/swap")

            assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_swap_creates_new_run(self):
        """POST /api/debate/runs/{id}/swap should create swapped run."""
        mock_run = create_mock_run(status="completed")
        mock_run.result_json = {"winner": "A"}
        mock_swapped = create_mock_run()

        with patch('app.api.endpoints.debate.get_run_by_id',
                   new_callable=AsyncMock, return_value=mock_run):
            with patch('app.api.endpoints.debate.create_run',
                       new_callable=AsyncMock, return_value=mock_swapped):
                transport = ASGITransport(app=app)
                async with AsyncClient(transport=transport, base_url="http://test") as client:
                    response = await client.post(f"/api/debate/runs/{mock_run.run_id}/swap")

                assert response.status_code == 201
                data = response.json()
                assert "run_id" in data
                assert data["run_id"] == str(mock_swapped.run_id)
                assert data["status"] == "pending"


class TestGetRunTurns:
    """Tests for GET /api/debate/runs/{id}/turns endpoint."""

    @pytest.mark.asyncio
    async def test_returns_turns_for_run(self):
        """GET /api/debate/runs/{id}/turns should return turns for a run."""
        run_id = uuid4()
        agent_id = uuid4()
        mock_run = create_mock_run(run_id=run_id)
        mock_turns = [
            create_mock_turn(run_id, agent_id, phase="opening", role="agent_a", content="Opening A"),
            create_mock_turn(run_id, agent_id, phase="opening", role="agent_b", content="Opening B"),
        ]

        with patch('app.api.endpoints.debate.get_run_by_id',
                   new_callable=AsyncMock, return_value=mock_run):
            with patch('app.api.endpoints.debate.get_turns_by_run_id',
                       new_callable=AsyncMock, return_value=mock_turns):
                transport = ASGITransport(app=app)
                async with AsyncClient(transport=transport, base_url="http://test") as client:
                    response = await client.get(f"/api/debate/runs/{run_id}/turns")

                assert response.status_code == 200
                data = response.json()
                assert len(data) == 2
                assert data[0]["phase"] == "opening"
                assert data[0]["role"] == "agent_a"
                assert data[0]["content"] == "Opening A"
                assert data[1]["role"] == "agent_b"

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_turns(self):
        """GET /api/debate/runs/{id}/turns should return empty list when no turns."""
        run_id = uuid4()
        mock_run = create_mock_run(run_id=run_id)

        with patch('app.api.endpoints.debate.get_run_by_id',
                   new_callable=AsyncMock, return_value=mock_run):
            with patch('app.api.endpoints.debate.get_turns_by_run_id',
                       new_callable=AsyncMock, return_value=[]):
                transport = ASGITransport(app=app)
                async with AsyncClient(transport=transport, base_url="http://test") as client:
                    response = await client.get(f"/api/debate/runs/{run_id}/turns")

                assert response.status_code == 200
                assert response.json() == []

    @pytest.mark.asyncio
    async def test_returns_404_when_run_not_found(self):
        """GET /api/debate/runs/{id}/turns should return 404 for unknown run."""
        with patch('app.api.endpoints.debate.get_run_by_id',
                   new_callable=AsyncMock, return_value=None):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get(f"/api/debate/runs/{uuid4()}/turns")

            assert response.status_code == 404


class TestCompareSwapTest:
    """Tests for GET /api/debate/runs/{id}/compare/{swap_id} endpoint."""

    @pytest.mark.asyncio
    async def test_compares_runs_successfully(self):
        """GET /api/debate/runs/{id}/compare/{swap_id} should return comparison."""
        original_run = create_mock_run(status="completed")
        original_run.result_json = {"winner": "A", "scores_a": {"total": 80}, "scores_b": {"total": 70}}

        swapped_run = create_mock_run(status="completed")
        swapped_run.result_json = {"winner": "B", "scores_a": {"total": 65}, "scores_b": {"total": 75}}

        original_data = {
            "run": original_run,
            "agent_a": {"agent_id": str(uuid4()), "name": "Agent A", "model": "llama3",
                       "persona_json": {}, "params_json": {},
                       "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            "agent_b": {"agent_id": str(uuid4()), "name": "Agent B", "model": "llama3",
                       "persona_json": {}, "params_json": {},
                       "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            "agent_j": {"agent_id": str(uuid4()), "name": "Judge", "model": "llama3",
                       "persona_json": {}, "params_json": {},
                       "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
        }
        swapped_data = {
            "run": swapped_run,
            "agent_a": original_data["agent_b"],  # Swapped
            "agent_b": original_data["agent_a"],  # Swapped
            "agent_j": original_data["agent_j"]
        }

        async def mock_get_run_with_agents(db, run_id):
            if run_id == original_run.run_id:
                return original_data
            elif run_id == swapped_run.run_id:
                return swapped_data
            return None

        with patch('app.api.endpoints.debate.get_run_with_agents',
                   side_effect=mock_get_run_with_agents):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get(
                    f"/api/debate/runs/{original_run.run_id}/compare/{swapped_run.run_id}"
                )

            assert response.status_code == 200
            data = response.json()
            assert "original" in data
            assert "swapped" in data
            assert "analysis" in data
            assert data["original"]["winner"] == "A"
            assert data["swapped"]["winner"] == "B"
            assert data["analysis"]["bias_type"] in ["none", "position", "inconclusive"]

    @pytest.mark.asyncio
    async def test_returns_404_when_original_not_found(self):
        """GET /api/debate/runs/{id}/compare/{swap_id} should return 404 for missing original."""
        with patch('app.api.endpoints.debate.get_run_with_agents',
                   new_callable=AsyncMock, return_value=None):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get(f"/api/debate/runs/{uuid4()}/compare/{uuid4()}")

            assert response.status_code == 404
            assert "Original" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_returns_404_when_swapped_not_found(self):
        """GET /api/debate/runs/{id}/compare/{swap_id} should return 404 for missing swap."""
        original_run = create_mock_run(status="completed")
        original_data = {
            "run": original_run,
            "agent_a": {"agent_id": str(uuid4()), "name": "Agent A", "model": "llama3",
                       "persona_json": {}, "params_json": {},
                       "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            "agent_b": {"agent_id": str(uuid4()), "name": "Agent B", "model": "llama3",
                       "persona_json": {}, "params_json": {},
                       "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            "agent_j": {"agent_id": str(uuid4()), "name": "Judge", "model": "llama3",
                       "persona_json": {}, "params_json": {},
                       "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
        }

        async def mock_get_run_with_agents(db, run_id):
            if run_id == original_run.run_id:
                return original_data
            return None

        with patch('app.api.endpoints.debate.get_run_with_agents',
                   side_effect=mock_get_run_with_agents):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get(
                    f"/api/debate/runs/{original_run.run_id}/compare/{uuid4()}"
                )

            assert response.status_code == 404
            assert "Swapped" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_returns_400_when_runs_not_completed(self):
        """GET /api/debate/runs/{id}/compare/{swap_id} should return 400 for non-completed runs."""
        original_run = create_mock_run(status="completed")
        swapped_run = create_mock_run(status="pending")  # Not completed

        original_data = {
            "run": original_run,
            "agent_a": {"agent_id": str(uuid4()), "name": "Agent A", "model": "llama3",
                       "persona_json": {}, "params_json": {},
                       "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            "agent_b": {"agent_id": str(uuid4()), "name": "Agent B", "model": "llama3",
                       "persona_json": {}, "params_json": {},
                       "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            "agent_j": {"agent_id": str(uuid4()), "name": "Judge", "model": "llama3",
                       "persona_json": {}, "params_json": {},
                       "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
        }
        swapped_data = {
            "run": swapped_run,
            "agent_a": original_data["agent_b"],
            "agent_b": original_data["agent_a"],
            "agent_j": original_data["agent_j"]
        }

        async def mock_get_run_with_agents(db, run_id):
            if run_id == original_run.run_id:
                return original_data
            elif run_id == swapped_run.run_id:
                return swapped_data
            return None

        with patch('app.api.endpoints.debate.get_run_with_agents',
                   side_effect=mock_get_run_with_agents):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get(
                    f"/api/debate/runs/{original_run.run_id}/compare/{swapped_run.run_id}"
                )

            assert response.status_code == 400
            assert "completed" in response.json()["detail"].lower()

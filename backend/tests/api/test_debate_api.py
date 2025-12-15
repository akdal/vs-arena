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


def create_mock_run(run_id=None, status="pending"):
    """Create a mock run for testing."""
    return Run(
        run_id=run_id or uuid4(),
        topic="Test topic",
        agent_a_id=uuid4(),
        agent_b_id=uuid4(),
        agent_j_id=uuid4(),
        position_a="FOR",
        position_b="AGAINST",
        config_json={"rounds": 3},
        rubric_json={"argumentation_weight": 35},
        result_json=None if status == "pending" else {"winner": "A"},
        status=status,
        created_at=datetime.utcnow(),
        finished_at=None if status == "pending" else datetime.utcnow()
    )


class TestStartDebate:
    """Tests for POST /api/debate/start endpoint."""

    @pytest.mark.asyncio
    async def test_starts_debate_successfully(self):
        """POST /api/debate/start should create run with valid data."""
        agent_a = create_mock_agent()
        agent_b = create_mock_agent(name="Agent B")
        agent_j = create_mock_agent(name="Judge")
        mock_run = create_mock_run()

        with patch('app.api.endpoints.debate.agent_crud.get_agent_by_id') as mock_get_agent:
            mock_get_agent.side_effect = [agent_a, agent_b, agent_j]
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
                assert data["status"] == "pending"

    @pytest.mark.asyncio
    async def test_rejects_same_positions(self):
        """POST /api/debate/start should reject same positions."""
        agent_a = create_mock_agent()
        agent_b = create_mock_agent(name="Agent B")
        agent_j = create_mock_agent(name="Judge")

        with patch('app.api.endpoints.debate.agent_crud.get_agent_by_id') as mock_get_agent:
            mock_get_agent.side_effect = [agent_a, agent_b, agent_j]
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
            assert "agent_a" in data
            assert "agent_b" in data
            assert "agent_j" in data

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
        with patch('app.api.endpoints.debate.delete_run',
                   new_callable=AsyncMock, return_value=True):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.delete(f"/api/debate/runs/{uuid4()}")

            assert response.status_code == 204

    @pytest.mark.asyncio
    async def test_returns_404_when_not_found(self):
        """DELETE /api/debate/runs/{id} should return 404 for unknown ID."""
        with patch('app.api.endpoints.debate.delete_run',
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

"""
Tests for Agent API endpoints
"""
import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import patch, AsyncMock, MagicMock
from uuid import uuid4
from datetime import datetime

from app.main import app
from app.models.agent import Agent


# Create a sample agent for mocking
def create_mock_agent(
    agent_id=None,
    name="Test Agent",
    model="llama3"
):
    """Create a mock agent for testing."""
    return Agent(
        agent_id=agent_id or uuid4(),
        name=name,
        model=model,
        persona_json={"role": "debater"},
        params_json={"temperature": 0.7},
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )


class TestListAgents:
    """Tests for GET /api/agents/ endpoint."""

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_agents(self):
        """GET /api/agents/ should return empty list when no agents exist."""
        with patch('app.api.endpoints.agents.agent_crud.get_all_agents',
                   new_callable=AsyncMock, return_value=[]):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/api/agents/")

            assert response.status_code == 200
            assert response.json() == []

    @pytest.mark.asyncio
    async def test_returns_list_of_agents(self):
        """GET /api/agents/ should return list of agents."""
        mock_agents = [
            create_mock_agent(name="Agent 1"),
            create_mock_agent(name="Agent 2")
        ]

        with patch('app.api.endpoints.agents.agent_crud.get_all_agents',
                   new_callable=AsyncMock, return_value=mock_agents):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get("/api/agents/")

            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2
            assert data[0]["name"] == "Agent 1"
            assert data[1]["name"] == "Agent 2"


class TestCreateAgent:
    """Tests for POST /api/agents/ endpoint."""

    @pytest.mark.asyncio
    async def test_creates_agent_successfully(self):
        """POST /api/agents/ should create agent with valid data."""
        mock_agent = create_mock_agent()

        with patch('app.api.endpoints.agents.agent_crud.create_agent',
                   new_callable=AsyncMock, return_value=mock_agent):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post("/api/agents/", json={
                    "name": "Test Agent",
                    "model": "llama3",
                    "persona_json": {"role": "debater"},
                    "params_json": {"temperature": 0.7}
                })

            assert response.status_code == 201
            data = response.json()
            assert data["name"] == "Test Agent"

    @pytest.mark.asyncio
    async def test_rejects_empty_name(self):
        """POST /api/agents/ should reject empty name with 422."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/api/agents/", json={
                "name": "",
                "model": "llama3",
                "persona_json": {},
                "params_json": {}
            })

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_rejects_name_too_long(self):
        """POST /api/agents/ should reject name > 50 chars with 422."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/api/agents/", json={
                "name": "A" * 51,
                "model": "llama3",
                "persona_json": {},
                "params_json": {}
            })

        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_rejects_missing_model(self):
        """POST /api/agents/ should reject missing model with 422."""
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post("/api/agents/", json={
                "name": "Test Agent",
                "persona_json": {},
                "params_json": {}
            })

        assert response.status_code == 422


class TestGetAgent:
    """Tests for GET /api/agents/{id} endpoint."""

    @pytest.mark.asyncio
    async def test_returns_agent_when_found(self):
        """GET /api/agents/{id} should return agent when found."""
        mock_agent = create_mock_agent()

        with patch('app.api.endpoints.agents.agent_crud.get_agent_by_id',
                   new_callable=AsyncMock, return_value=mock_agent):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get(f"/api/agents/{mock_agent.agent_id}")

            assert response.status_code == 200
            data = response.json()
            assert data["name"] == "Test Agent"

    @pytest.mark.asyncio
    async def test_returns_404_when_not_found(self):
        """GET /api/agents/{id} should return 404 for unknown ID."""
        with patch('app.api.endpoints.agents.agent_crud.get_agent_by_id',
                   new_callable=AsyncMock, return_value=None):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.get(f"/api/agents/{uuid4()}")

            assert response.status_code == 404
            assert "not found" in response.json()["detail"].lower()


class TestUpdateAgent:
    """Tests for PUT /api/agents/{id} endpoint."""

    @pytest.mark.asyncio
    async def test_updates_agent_successfully(self):
        """PUT /api/agents/{id} should update agent with valid data."""
        mock_agent = create_mock_agent(name="Updated Name")

        with patch('app.api.endpoints.agents.agent_crud.update_agent',
                   new_callable=AsyncMock, return_value=mock_agent):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.put(
                    f"/api/agents/{mock_agent.agent_id}",
                    json={"name": "Updated Name"}
                )

            assert response.status_code == 200
            assert response.json()["name"] == "Updated Name"

    @pytest.mark.asyncio
    async def test_returns_404_when_not_found(self):
        """PUT /api/agents/{id} should return 404 for unknown ID."""
        with patch('app.api.endpoints.agents.agent_crud.update_agent',
                   new_callable=AsyncMock, return_value=None):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.put(
                    f"/api/agents/{uuid4()}",
                    json={"name": "New Name"}
                )

            assert response.status_code == 404


class TestDeleteAgent:
    """Tests for DELETE /api/agents/{id} endpoint."""

    @pytest.mark.asyncio
    async def test_deletes_agent_returns_204(self):
        """DELETE /api/agents/{id} should return 204 on success."""
        with patch('app.api.endpoints.agents.agent_crud.delete_agent',
                   new_callable=AsyncMock, return_value=True):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.delete(f"/api/agents/{uuid4()}")

            assert response.status_code == 204

    @pytest.mark.asyncio
    async def test_returns_404_when_not_found(self):
        """DELETE /api/agents/{id} should return 404 for unknown ID."""
        with patch('app.api.endpoints.agents.agent_crud.delete_agent',
                   new_callable=AsyncMock, return_value=False):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.delete(f"/api/agents/{uuid4()}")

            assert response.status_code == 404


class TestCloneAgent:
    """Tests for POST /api/agents/{id}/clone endpoint."""

    @pytest.mark.asyncio
    async def test_clones_agent_successfully(self):
        """POST /api/agents/{id}/clone should clone agent."""
        original_id = uuid4()
        mock_cloned = create_mock_agent(name="Test Agent (Copy)")

        with patch('app.api.endpoints.agents.agent_crud.clone_agent',
                   new_callable=AsyncMock, return_value=mock_cloned):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(f"/api/agents/{original_id}/clone")

            assert response.status_code == 201
            assert "(Copy)" in response.json()["name"]

    @pytest.mark.asyncio
    async def test_returns_404_when_not_found(self):
        """POST /api/agents/{id}/clone should return 404 for unknown ID."""
        with patch('app.api.endpoints.agents.agent_crud.clone_agent',
                   new_callable=AsyncMock, return_value=None):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                response = await client.post(f"/api/agents/{uuid4()}/clone")

            assert response.status_code == 404

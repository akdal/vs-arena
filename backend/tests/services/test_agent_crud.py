"""
Tests for Agent CRUD operations
"""
import pytest
from uuid import uuid4
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.agent_crud import (
    get_all_agents,
    get_agent_by_id,
    create_agent,
    update_agent,
    delete_agent,
    clone_agent
)
from app.models.agent import Agent
from app.models.schemas import AgentUpdate


class TestGetAllAgents:
    """Tests for get_all_agents function."""

    @pytest.mark.asyncio
    async def test_returns_list_of_agents(self, mock_db, sample_agent_list):
        """get_all_agents should return list of agents ordered by created_at desc."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = sample_agent_list
        mock_db.execute = AsyncMock(return_value=mock_result)

        agents = await get_all_agents(mock_db)

        assert len(agents) == 2
        assert agents[0].name == "Agent 1"
        assert agents[1].name == "Agent 2"
        mock_db.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_agents(self, mock_db):
        """get_all_agents should return empty list when no agents exist."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        agents = await get_all_agents(mock_db)

        assert agents == []


class TestGetAgentById:
    """Tests for get_agent_by_id function."""

    @pytest.mark.asyncio
    async def test_returns_agent_when_found(self, mock_db, sample_agent):
        """get_agent_by_id should return agent when found."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_agent
        mock_db.execute = AsyncMock(return_value=mock_result)

        agent = await get_agent_by_id(mock_db, sample_agent.agent_id)

        assert agent is not None
        assert agent.agent_id == sample_agent.agent_id
        assert agent.name == "Test Agent"

    @pytest.mark.asyncio
    async def test_returns_none_when_not_found(self, mock_db):
        """get_agent_by_id should return None when agent not found."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        agent = await get_agent_by_id(mock_db, uuid4())

        assert agent is None


class TestCreateAgent:
    """Tests for create_agent function."""

    @pytest.mark.asyncio
    async def test_creates_agent_successfully(self, mock_db, sample_agent_create):
        """create_agent should create and return new agent."""
        # Mock refresh to simulate database behavior
        async def mock_refresh(agent):
            agent.created_at = datetime.utcnow()
            agent.updated_at = datetime.utcnow()

        mock_db.refresh = mock_refresh

        agent = await create_agent(mock_db, sample_agent_create)

        assert agent.name == sample_agent_create.name
        assert agent.model == sample_agent_create.model
        assert agent.persona_json == sample_agent_create.persona_json
        assert agent.params_json == sample_agent_create.params_json
        assert agent.agent_id is not None
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_creates_agent_with_empty_json_fields(self, mock_db):
        """create_agent should handle empty persona and params."""
        from app.models.schemas import AgentCreate

        agent_data = AgentCreate(
            name="Minimal Agent",
            model="llama3",
            persona_json={},
            params_json={}
        )

        async def mock_refresh(agent):
            agent.created_at = datetime.utcnow()
            agent.updated_at = datetime.utcnow()

        mock_db.refresh = mock_refresh

        agent = await create_agent(mock_db, agent_data)

        assert agent.name == "Minimal Agent"
        assert agent.persona_json == {}
        assert agent.params_json == {}


class TestUpdateAgent:
    """Tests for update_agent function."""

    @pytest.mark.asyncio
    async def test_updates_only_provided_fields(self, mock_db, sample_agent):
        """update_agent should only update provided fields."""
        with patch('app.services.agent_crud.get_agent_by_id', return_value=sample_agent):
            update_data = AgentUpdate(name="Updated Name")

            async def mock_refresh(agent):
                pass

            mock_db.refresh = mock_refresh

            updated = await update_agent(mock_db, sample_agent.agent_id, update_data)

            assert updated.name == "Updated Name"
            # Original model should be unchanged
            assert updated.model == "llama3"

    @pytest.mark.asyncio
    async def test_returns_none_when_not_found(self, mock_db):
        """update_agent should return None when agent not found."""
        with patch('app.services.agent_crud.get_agent_by_id', return_value=None):
            update_data = AgentUpdate(name="New Name")

            result = await update_agent(mock_db, uuid4(), update_data)

            assert result is None
            mock_db.commit.assert_not_called()

    @pytest.mark.asyncio
    async def test_updates_multiple_fields(self, mock_db, sample_agent):
        """update_agent should update multiple fields at once."""
        with patch('app.services.agent_crud.get_agent_by_id', return_value=sample_agent):
            update_data = AgentUpdate(
                name="New Name",
                model="qwen2.5",
                params_json={"temperature": 0.9}
            )

            async def mock_refresh(agent):
                pass

            mock_db.refresh = mock_refresh

            updated = await update_agent(mock_db, sample_agent.agent_id, update_data)

            assert updated.name == "New Name"
            assert updated.model == "qwen2.5"
            assert updated.params_json == {"temperature": 0.9}


class TestDeleteAgent:
    """Tests for delete_agent function."""

    @pytest.mark.asyncio
    async def test_deletes_agent_successfully(self, mock_db, sample_agent):
        """delete_agent should delete agent and return True."""
        with patch('app.services.agent_crud.get_agent_by_id', return_value=sample_agent):
            result = await delete_agent(mock_db, sample_agent.agent_id)

            assert result is True
            mock_db.delete.assert_called_once_with(sample_agent)
            mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_returns_false_when_not_found(self, mock_db):
        """delete_agent should return False when agent not found."""
        with patch('app.services.agent_crud.get_agent_by_id', return_value=None):
            result = await delete_agent(mock_db, uuid4())

            assert result is False
            mock_db.delete.assert_not_called()


class TestCloneAgent:
    """Tests for clone_agent function."""

    @pytest.mark.asyncio
    async def test_clones_agent_with_copy_suffix(self, mock_db, sample_agent):
        """clone_agent should append '(Copy)' to name."""
        with patch('app.services.agent_crud.get_agent_by_id', return_value=sample_agent):
            async def mock_refresh(agent):
                agent.created_at = datetime.utcnow()
                agent.updated_at = datetime.utcnow()

            mock_db.refresh = mock_refresh

            cloned = await clone_agent(mock_db, sample_agent.agent_id)

            assert cloned is not None
            assert cloned.name == "Test Agent (Copy)"
            assert cloned.agent_id != sample_agent.agent_id
            assert cloned.model == sample_agent.model
            assert cloned.persona_json == sample_agent.persona_json
            assert cloned.params_json == sample_agent.params_json

    @pytest.mark.asyncio
    async def test_returns_none_when_not_found(self, mock_db):
        """clone_agent should return None when original not found."""
        with patch('app.services.agent_crud.get_agent_by_id', return_value=None):
            result = await clone_agent(mock_db, uuid4())

            assert result is None
            mock_db.add.assert_not_called()

    @pytest.mark.asyncio
    async def test_clones_with_independent_json_copies(self, mock_db, sample_agent):
        """clone_agent should create independent copies of JSON fields."""
        with patch('app.services.agent_crud.get_agent_by_id', return_value=sample_agent):
            async def mock_refresh(agent):
                agent.created_at = datetime.utcnow()
                agent.updated_at = datetime.utcnow()

            mock_db.refresh = mock_refresh

            cloned = await clone_agent(mock_db, sample_agent.agent_id)

            # Modify cloned JSON to ensure independence
            cloned.persona_json["new_key"] = "new_value"

            # Original should be unchanged
            assert "new_key" not in sample_agent.persona_json

"""
Tests for Run CRUD operations
"""
import pytest
from uuid import uuid4
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.run_crud import (
    create_run,
    get_run_by_id,
    get_run_with_agents,
    update_run_status,
    get_all_runs,
    delete_run,
    get_turns_by_run_id
)
from app.models.run import Run
from app.models.agent import Agent


class TestCreateRun:
    """Tests for create_run function."""

    @pytest.mark.asyncio
    async def test_creates_run_with_defaults(self, mock_db):
        """create_run should apply default config and rubric when not provided."""
        agent_a_id = uuid4()
        agent_b_id = uuid4()
        agent_j_id = uuid4()

        async def mock_refresh(run):
            run.created_at = datetime.utcnow()

        mock_db.refresh = mock_refresh

        run = await create_run(
            db=mock_db,
            topic="Test topic",
            agent_a_id=agent_a_id,
            agent_b_id=agent_b_id,
            agent_j_id=agent_j_id,
            position_a="FOR",
            position_b="AGAINST"
        )

        assert run.topic == "Test topic"
        assert run.status == "pending"
        assert run.config_json == {"rounds": 3, "max_tokens_per_turn": 1024}
        assert run.rubric_json["argumentation_weight"] == 35
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_creates_run_with_custom_config(self, mock_db):
        """create_run should use provided config and rubric."""
        custom_config = {"rounds": 5, "max_tokens_per_turn": 2048}
        custom_rubric = {"argumentation_weight": 50, "rebuttal_weight": 50}

        async def mock_refresh(run):
            run.created_at = datetime.utcnow()

        mock_db.refresh = mock_refresh

        run = await create_run(
            db=mock_db,
            topic="Custom topic",
            agent_a_id=uuid4(),
            agent_b_id=uuid4(),
            agent_j_id=uuid4(),
            position_a="FOR",
            position_b="AGAINST",
            config=custom_config,
            rubric=custom_rubric
        )

        assert run.config_json == custom_config
        assert run.rubric_json == custom_rubric


class TestGetRunById:
    """Tests for get_run_by_id function."""

    @pytest.mark.asyncio
    async def test_returns_run_when_found(self, mock_db, sample_run):
        """get_run_by_id should return run when found."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_run
        mock_db.execute = AsyncMock(return_value=mock_result)

        run = await get_run_by_id(mock_db, sample_run.run_id)

        assert run is not None
        assert run.run_id == sample_run.run_id

    @pytest.mark.asyncio
    async def test_returns_none_when_not_found(self, mock_db):
        """get_run_by_id should return None when run not found."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        run = await get_run_by_id(mock_db, uuid4())

        assert run is None


class TestUpdateRunStatus:
    """Tests for update_run_status function."""

    @pytest.mark.asyncio
    async def test_updates_status(self, mock_db, sample_run):
        """update_run_status should update status field."""
        mock_db.get = AsyncMock(return_value=sample_run)

        async def mock_refresh(run):
            pass

        mock_db.refresh = mock_refresh

        updated = await update_run_status(mock_db, sample_run.run_id, "running")

        assert updated.status == "running"
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_sets_finished_at_when_completed(self, mock_db, sample_run):
        """update_run_status should set finished_at when status is completed."""
        mock_db.get = AsyncMock(return_value=sample_run)
        sample_run.finished_at = None

        async def mock_refresh(run):
            pass

        mock_db.refresh = mock_refresh

        updated = await update_run_status(mock_db, sample_run.run_id, "completed")

        assert updated.status == "completed"
        assert updated.finished_at is not None

    @pytest.mark.asyncio
    async def test_updates_result_json(self, mock_db, sample_run):
        """update_run_status should update result_json when provided."""
        mock_db.get = AsyncMock(return_value=sample_run)
        result_data = {"winner": "A", "total_a": 80, "total_b": 70}

        async def mock_refresh(run):
            pass

        mock_db.refresh = mock_refresh

        updated = await update_run_status(
            mock_db, sample_run.run_id, "completed", result_json=result_data
        )

        assert updated.result_json == result_data

    @pytest.mark.asyncio
    async def test_returns_none_when_not_found(self, mock_db):
        """update_run_status should return None when run not found."""
        mock_db.get = AsyncMock(return_value=None)

        result = await update_run_status(mock_db, uuid4(), "completed")

        assert result is None
        mock_db.commit.assert_not_called()


class TestGetAllRuns:
    """Tests for get_all_runs function."""

    @pytest.mark.asyncio
    async def test_returns_list_of_runs(self, mock_db, sample_run):
        """get_all_runs should return list of runs."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_run]
        mock_db.execute = AsyncMock(return_value=mock_result)

        runs = await get_all_runs(mock_db)

        assert len(runs) == 1
        assert runs[0].run_id == sample_run.run_id

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_runs(self, mock_db):
        """get_all_runs should return empty list when no runs exist."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        runs = await get_all_runs(mock_db)

        assert runs == []


class TestDeleteRun:
    """Tests for delete_run function."""

    @pytest.mark.asyncio
    async def test_deletes_run_successfully(self, mock_db, sample_run):
        """delete_run should delete run and return True."""
        mock_db.get = AsyncMock(return_value=sample_run)

        result = await delete_run(mock_db, sample_run.run_id)

        assert result is True
        mock_db.delete.assert_called_once_with(sample_run)
        mock_db.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_returns_false_when_not_found(self, mock_db):
        """delete_run should return False when run not found."""
        mock_db.get = AsyncMock(return_value=None)

        result = await delete_run(mock_db, uuid4())

        assert result is False
        mock_db.delete.assert_not_called()


class TestGetTurnsByRunId:
    """Tests for get_turns_by_run_id function."""

    @pytest.mark.asyncio
    async def test_returns_turns_ordered_by_creation(self, mock_db, sample_turns):
        """get_turns_by_run_id should return turns ordered by creation time."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = sample_turns
        mock_db.execute = AsyncMock(return_value=mock_result)

        turns = await get_turns_by_run_id(mock_db, sample_turns[0].run_id)

        assert len(turns) == 2
        assert turns[0].phase == "opening"
        assert turns[0].role == "agent_a"
        assert turns[1].role == "agent_b"

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_turns(self, mock_db):
        """get_turns_by_run_id should return empty list when run has no turns."""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        turns = await get_turns_by_run_id(mock_db, uuid4())

        assert turns == []


class TestGetRunWithAgents:
    """Tests for get_run_with_agents function."""

    @pytest.mark.asyncio
    async def test_returns_run_with_agent_details(self, mock_db, sample_run, sample_agent_list):
        """get_run_with_agents should return run with all agent details."""
        agents = sample_agent_list
        agent_a = agents[0]
        agent_b = agents[1]
        agent_j = agents[0]  # Using same as agent_a for judge

        # Mock execute for run query
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_run
        mock_db.execute = AsyncMock(return_value=mock_result)

        # Mock get for individual agents
        mock_db.get = AsyncMock(side_effect=[agent_a, agent_b, agent_j])

        result = await get_run_with_agents(mock_db, sample_run.run_id)

        assert result is not None
        assert "run" in result
        assert "agent_a" in result
        assert "agent_b" in result
        assert "agent_j" in result
        assert result["run"].run_id == sample_run.run_id
        assert result["agent_a"]["name"] == agent_a.name
        assert result["agent_b"]["name"] == agent_b.name

    @pytest.mark.asyncio
    async def test_returns_none_when_run_not_found(self, mock_db):
        """get_run_with_agents should return None when run not found."""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await get_run_with_agents(mock_db, uuid4())

        assert result is None

    @pytest.mark.asyncio
    async def test_returns_none_when_agent_missing(self, mock_db, sample_run, sample_agent_list):
        """get_run_with_agents should return None if any agent is missing."""
        agents = sample_agent_list

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_run
        mock_db.execute = AsyncMock(return_value=mock_result)

        # Return None for one of the agents
        mock_db.get = AsyncMock(side_effect=[agents[0], None, agents[0]])

        result = await get_run_with_agents(mock_db, sample_run.run_id)

        assert result is None

"""
Tests for Ollama service
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import httpx

from app.services.ollama import call_ollama, stream_ollama, get_model_info


class TestCallOllama:
    """Tests for call_ollama function."""

    @pytest.mark.asyncio
    async def test_returns_response_text_on_success(self):
        """call_ollama should return response text on success."""
        mock_response = MagicMock()
        mock_response.json.return_value = {"response": "Generated text"}
        mock_response.raise_for_status = MagicMock()

        with patch('httpx.AsyncClient') as MockClient:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            MockClient.return_value.__aenter__.return_value = mock_client

            result = await call_ollama("llama3", "Test prompt")

            assert result == "Generated text"
            mock_client.post.assert_called_once()

    @pytest.mark.asyncio
    async def test_includes_system_prompt_when_provided(self):
        """call_ollama should include system prompt in payload."""
        mock_response = MagicMock()
        mock_response.json.return_value = {"response": "Response"}
        mock_response.raise_for_status = MagicMock()

        with patch('httpx.AsyncClient') as MockClient:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            MockClient.return_value.__aenter__.return_value = mock_client

            await call_ollama("llama3", "Test prompt", system="System prompt")

            # Verify system was included in the call
            call_args = mock_client.post.call_args
            payload = call_args.kwargs.get('json') or call_args[1].get('json')
            assert payload.get("system") == "System prompt"

    @pytest.mark.asyncio
    async def test_raises_on_connection_error(self):
        """call_ollama should raise on connection failure."""
        with patch('httpx.AsyncClient') as MockClient:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(
                side_effect=httpx.ConnectError("Connection refused")
            )
            MockClient.return_value.__aenter__.return_value = mock_client

            with pytest.raises(httpx.ConnectError):
                await call_ollama("llama3", "Test prompt")

    @pytest.mark.asyncio
    async def test_raises_on_http_error(self):
        """call_ollama should raise on HTTP error."""
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock(
            side_effect=httpx.HTTPStatusError(
                "Server Error",
                request=MagicMock(),
                response=MagicMock()
            )
        )

        with patch('httpx.AsyncClient') as MockClient:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            MockClient.return_value.__aenter__.return_value = mock_client

            with pytest.raises(httpx.HTTPStatusError):
                await call_ollama("llama3", "Test prompt")

    @pytest.mark.asyncio
    async def test_returns_empty_string_when_no_response_field(self):
        """call_ollama should return empty string when response field missing."""
        mock_response = MagicMock()
        mock_response.json.return_value = {"done": True}  # No response field
        mock_response.raise_for_status = MagicMock()

        with patch('httpx.AsyncClient') as MockClient:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            MockClient.return_value.__aenter__.return_value = mock_client

            result = await call_ollama("llama3", "Test prompt")

            assert result == ""


class TestStreamOllama:
    """Tests for stream_ollama function."""

    @pytest.mark.asyncio
    async def test_yields_response_chunks(self):
        """stream_ollama should yield response chunks."""
        # Create async iterator for response lines
        async def mock_aiter_lines():
            yield '{"response": "Hello ", "done": false}'
            yield '{"response": "World", "done": true}'

        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.aiter_lines = mock_aiter_lines

        with patch('httpx.AsyncClient') as MockClient:
            mock_client = AsyncMock()
            mock_stream_context = AsyncMock()
            mock_stream_context.__aenter__.return_value = mock_response
            mock_stream_context.__aexit__.return_value = None
            mock_client.stream.return_value = mock_stream_context
            MockClient.return_value.__aenter__.return_value = mock_client

            chunks = []
            async for chunk in stream_ollama("llama3", "Test"):
                chunks.append(chunk)

            assert chunks == ["Hello ", "World"]

    @pytest.mark.asyncio
    async def test_handles_invalid_json_gracefully(self):
        """stream_ollama should skip invalid JSON lines."""
        async def mock_aiter_lines():
            yield 'invalid json'
            yield '{"response": "Valid", "done": true}'

        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.aiter_lines = mock_aiter_lines

        with patch('httpx.AsyncClient') as MockClient:
            mock_client = AsyncMock()
            mock_stream_context = AsyncMock()
            mock_stream_context.__aenter__.return_value = mock_response
            mock_stream_context.__aexit__.return_value = None
            mock_client.stream.return_value = mock_stream_context
            MockClient.return_value.__aenter__.return_value = mock_client

            chunks = []
            async for chunk in stream_ollama("llama3", "Test"):
                chunks.append(chunk)

            assert chunks == ["Valid"]

    @pytest.mark.asyncio
    async def test_stops_on_done_flag(self):
        """stream_ollama should stop when done flag is True."""
        async def mock_aiter_lines():
            yield '{"response": "First", "done": false}'
            yield '{"response": "Last", "done": true}'
            yield '{"response": "Should not appear", "done": false}'

        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.aiter_lines = mock_aiter_lines

        with patch('httpx.AsyncClient') as MockClient:
            mock_client = AsyncMock()
            mock_stream_context = AsyncMock()
            mock_stream_context.__aenter__.return_value = mock_response
            mock_stream_context.__aexit__.return_value = None
            mock_client.stream.return_value = mock_stream_context
            MockClient.return_value.__aenter__.return_value = mock_client

            chunks = []
            async for chunk in stream_ollama("llama3", "Test"):
                chunks.append(chunk)

            assert chunks == ["First", "Last"]

    @pytest.mark.asyncio
    async def test_raises_on_connection_error(self):
        """stream_ollama should raise on connection failure."""
        with patch('httpx.AsyncClient') as MockClient:
            mock_client = AsyncMock()
            mock_client.stream = MagicMock(
                side_effect=httpx.ConnectError("Connection refused")
            )
            MockClient.return_value.__aenter__.return_value = mock_client

            with pytest.raises(httpx.ConnectError):
                async for _ in stream_ollama("llama3", "Test"):
                    pass


class TestGetModelInfo:
    """Tests for get_model_info function."""

    @pytest.mark.asyncio
    async def test_returns_model_info_on_success(self):
        """get_model_info should return model information."""
        model_info = {
            "name": "llama3",
            "modified_at": "2024-01-01T00:00:00Z",
            "size": 1234567890
        }
        mock_response = MagicMock()
        mock_response.json.return_value = model_info
        mock_response.raise_for_status = MagicMock()

        with patch('httpx.AsyncClient') as MockClient:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            MockClient.return_value.__aenter__.return_value = mock_client

            result = await get_model_info("llama3")

            assert result == model_info

    @pytest.mark.asyncio
    async def test_returns_none_when_model_not_found(self):
        """get_model_info should return None when model not found."""
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock(
            side_effect=httpx.HTTPStatusError(
                "Not Found",
                request=MagicMock(),
                response=MagicMock()
            )
        )

        with patch('httpx.AsyncClient') as MockClient:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_response)
            MockClient.return_value.__aenter__.return_value = mock_client

            result = await get_model_info("nonexistent")

            assert result is None

    @pytest.mark.asyncio
    async def test_returns_none_on_exception(self):
        """get_model_info should return None on unexpected exception."""
        with patch('httpx.AsyncClient') as MockClient:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(side_effect=Exception("Unexpected"))
            MockClient.return_value.__aenter__.return_value = mock_client

            result = await get_model_info("llama3")

            assert result is None

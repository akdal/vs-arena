"""
Tests for debate node utility functions
"""
import pytest
from unittest.mock import AsyncMock, patch
import httpx

from app.graph.nodes.utils import (
    build_system_prompt,
    get_agent_for_phase,
    parse_json_scores,
    detect_forbidden_phrases,
)


class TestBuildSystemPrompt:
    """Tests for build_system_prompt function."""

    def test_returns_override_when_provided(self):
        """build_system_prompt should return override if set."""
        persona = {"system_prompt_override": "Custom system prompt"}
        result = build_system_prompt(persona)
        assert result == "Custom system prompt"

    def test_builds_from_persona_fields(self):
        """build_system_prompt should build from persona fields."""
        persona = {
            "name": "Alex the Debater",
            "tone": "confident",
            "thinking_style": "strategic",
            "speaking_style": "persuasive",
        }
        result = build_system_prompt(persona)

        assert "Alex the Debater" in result
        assert "confident" in result
        assert "strategic" in result
        assert "persuasive" in result

    def test_includes_values_when_provided(self):
        """build_system_prompt should include values list."""
        persona = {
            "name": "Test Agent",
            "values": ["logic", "clarity", "truth"],
        }
        result = build_system_prompt(persona)

        assert "logic" in result
        assert "clarity" in result
        assert "truth" in result

    def test_uses_defaults_for_missing_fields(self):
        """build_system_prompt should use defaults for missing fields."""
        persona = {}
        result = build_system_prompt(persona)

        assert "a debater" in result  # default name
        assert "formal" in result  # default tone
        assert "analytical" in result  # default thinking_style
        assert "structured" in result  # default speaking_style

    def test_handles_empty_values_list(self):
        """build_system_prompt should handle empty values list."""
        persona = {"name": "Test", "values": []}
        result = build_system_prompt(persona)

        # Should not include "Core Values" line
        assert "Core Values" not in result


class TestGetAgentForPhase:
    """Tests for get_agent_for_phase function."""

    def test_returns_agent_a_for_a_phases(self):
        """get_agent_for_phase should return agent_a for _a phases."""
        state = {
            "agent_a": {"name": "Agent A"},
            "agent_b": {"name": "Agent B"},
            "agent_j": {"name": "Judge"},
        }

        assert get_agent_for_phase("opening_a", state)["name"] == "Agent A"
        assert get_agent_for_phase("rebuttal_a", state)["name"] == "Agent A"
        assert get_agent_for_phase("closing_a", state)["name"] == "Agent A"

    def test_returns_agent_b_for_b_phases(self):
        """get_agent_for_phase should return agent_b for _b phases."""
        state = {
            "agent_a": {"name": "Agent A"},
            "agent_b": {"name": "Agent B"},
            "agent_j": {"name": "Judge"},
        }

        assert get_agent_for_phase("opening_b", state)["name"] == "Agent B"
        assert get_agent_for_phase("rebuttal_b", state)["name"] == "Agent B"
        assert get_agent_for_phase("closing_b", state)["name"] == "Agent B"

    def test_returns_judge_for_judge_phases(self):
        """get_agent_for_phase should return judge for judge phases."""
        state = {
            "agent_a": {"name": "Agent A"},
            "agent_b": {"name": "Agent B"},
            "agent_j": {"name": "Judge"},
        }

        assert get_agent_for_phase("judge_intro", state)["name"] == "Judge"
        assert get_agent_for_phase("judge_verdict", state)["name"] == "Judge"

    def test_returns_correct_agent_for_score_phases(self):
        """get_agent_for_phase should prioritize suffix over score keyword."""
        state = {
            "agent_a": {"name": "Agent A"},
            "agent_b": {"name": "Agent B"},
            "agent_j": {"name": "Judge"},
        }

        # score_a ends with _a, so returns agent_a
        assert get_agent_for_phase("score_a", state)["name"] == "Agent A"
        # score_b ends with _b, so returns agent_b
        assert get_agent_for_phase("score_b", state)["name"] == "Agent B"

    def test_returns_judge_for_verdict_phase(self):
        """get_agent_for_phase should return judge for verdict phase."""
        state = {
            "agent_a": {"name": "Agent A"},
            "agent_b": {"name": "Agent B"},
            "agent_j": {"name": "Judge"},
        }

        assert get_agent_for_phase("final_verdict", state)["name"] == "Judge"

    def test_raises_for_unknown_phase(self):
        """get_agent_for_phase should raise ValueError for unknown phase."""
        state = {
            "agent_a": {},
            "agent_b": {},
            "agent_j": {},
        }

        with pytest.raises(ValueError) as exc_info:
            get_agent_for_phase("unknown_phase", state)

        assert "Unknown phase" in str(exc_info.value)


class TestParseJsonScores:
    """Tests for parse_json_scores function."""

    def test_parses_valid_json(self):
        """parse_json_scores should parse valid JSON."""
        response = '{"argumentation": {"total": 21}, "total": 42}'
        result = parse_json_scores(response)

        assert result["argumentation"]["total"] == 21
        assert result["total"] == 42

    def test_extracts_json_from_text(self):
        """parse_json_scores should extract JSON from surrounding text."""
        response = 'Here are the scores: {"total": 35} That is all.'
        result = parse_json_scores(response)

        assert result["total"] == 35

    def test_returns_defaults_on_invalid_json(self):
        """parse_json_scores should return defaults when JSON is invalid."""
        response = "This is not JSON at all"
        result = parse_json_scores(response, default_score=5)

        assert "total" in result
        assert result["total"] == 30  # 5 * 6
        assert "justification" in result

    def test_returns_defaults_on_empty_response(self):
        """parse_json_scores should return defaults for empty response."""
        result = parse_json_scores("")

        assert "total" in result
        assert "justification" in result

    def test_handles_nested_json(self):
        """parse_json_scores should handle nested JSON structures."""
        response = '''
        {
            "argumentation": {"logic": 8, "evidence": 7, "total": 21},
            "delivery": {"clarity": 9, "total": 14},
            "total": 35
        }
        '''
        result = parse_json_scores(response)

        assert result["argumentation"]["logic"] == 8
        assert result["delivery"]["clarity"] == 9


class TestDetectForbiddenPhrases:
    """Tests for detect_forbidden_phrases function."""

    def test_detects_single_phrase(self):
        """detect_forbidden_phrases should find single occurrence."""
        content = "This content contains forbidden word here."
        phrases = ["forbidden"]
        result = detect_forbidden_phrases(content, phrases)

        assert len(result) == 1
        assert result[0]["phrase"] == "forbidden"

    def test_detects_case_insensitive(self):
        """detect_forbidden_phrases should match case-insensitively."""
        content = "This has FORBIDDEN and Forbidden words."
        phrases = ["forbidden"]
        result = detect_forbidden_phrases(content, phrases)

        assert len(result) == 2

    def test_detects_multiple_occurrences(self):
        """detect_forbidden_phrases should find all occurrences."""
        content = "Bad word here, another bad word there, and bad again."
        phrases = ["bad"]
        result = detect_forbidden_phrases(content, phrases)

        assert len(result) == 3

    def test_detects_multiple_phrases(self):
        """detect_forbidden_phrases should find multiple different phrases."""
        content = "This has forbidden and banned content."
        phrases = ["forbidden", "banned"]
        result = detect_forbidden_phrases(content, phrases)

        assert len(result) == 2
        phrases_found = [v["phrase"] for v in result]
        assert "forbidden" in phrases_found
        assert "banned" in phrases_found

    def test_returns_empty_for_no_matches(self):
        """detect_forbidden_phrases should return empty list when no matches."""
        content = "Clean content with nothing bad."
        phrases = ["forbidden", "banned"]
        result = detect_forbidden_phrases(content, phrases)

        assert len(result) == 0

    def test_returns_empty_for_empty_phrases(self):
        """detect_forbidden_phrases should return empty for empty phrases list."""
        content = "Some content here."
        phrases = []
        result = detect_forbidden_phrases(content, phrases)

        assert len(result) == 0

    def test_returns_empty_for_empty_content(self):
        """detect_forbidden_phrases should return empty for empty content."""
        content = ""
        phrases = ["forbidden"]
        result = detect_forbidden_phrases(content, phrases)

        assert len(result) == 0

    def test_skips_empty_phrases(self):
        """detect_forbidden_phrases should skip empty or whitespace phrases."""
        content = "This has forbidden content."
        phrases = ["", "   ", "forbidden"]
        result = detect_forbidden_phrases(content, phrases)

        assert len(result) == 1
        assert result[0]["phrase"] == "forbidden"

    def test_includes_context(self):
        """detect_forbidden_phrases should include surrounding context."""
        content = "Before the forbidden word after."
        phrases = ["forbidden"]
        result = detect_forbidden_phrases(content, phrases)

        assert len(result) == 1
        assert "Before" in result[0]["context"]
        assert "after" in result[0]["context"]

    def test_handles_phrase_at_start(self):
        """detect_forbidden_phrases should handle phrase at start."""
        content = "forbidden at the beginning."
        phrases = ["forbidden"]
        result = detect_forbidden_phrases(content, phrases)

        assert len(result) == 1
        assert "forbidden" in result[0]["context"].lower()

    def test_handles_phrase_at_end(self):
        """detect_forbidden_phrases should handle phrase at end."""
        content = "Something forbidden"
        phrases = ["forbidden"]
        result = detect_forbidden_phrases(content, phrases)

        assert len(result) == 1

    def test_multi_word_phrase(self):
        """detect_forbidden_phrases should detect multi-word phrases."""
        content = "This is a bad phrase example."
        phrases = ["bad phrase"]
        result = detect_forbidden_phrases(content, phrases)

        assert len(result) == 1
        assert result[0]["phrase"] == "bad phrase"

    def test_partial_word_match(self):
        """detect_forbidden_phrases should match partial words."""
        content = "This is unforbidden content."
        phrases = ["forbidden"]
        result = detect_forbidden_phrases(content, phrases)

        # Should match "forbidden" within "unforbidden"
        assert len(result) == 1

"""
Judge Prompt Templates
"""
from typing import Dict, Any, List
import json


def build_judge_intro_prompt(topic: str, persona: Dict[str, Any]) -> str:
    """
    Generate judge introduction prompt.

    Args:
        topic: Debate topic
        persona: Judge persona configuration

    Returns:
        Formatted prompt string
    """
    return f"""You are {persona.get('name', 'the judge')}, presiding over this debate.

Topic: {topic}

Your task: Introduce yourself and explain the debate rules.

Include in your introduction:
1. Welcome and your judging philosophy
2. Debate format: BP Lite (Opening → Rebuttal → Summary)
3. Scoring criteria:
   - Argumentation (35%): Logic, originality, evidence
   - Rebuttal (30%): Targeting, effectiveness, reconstruction
   - Delivery (20%): Clarity, structure
   - Strategy (15%): Position consistency, weighing
4. Key rules:
   - No new arguments in Summary (Whip Speech)
   - Rebuttals must engage opponent's points
   - Focus on comparative analysis
5. Your tone: {persona.get('tone', 'fair and objective')}

Keep it concise (150-250 words) and professional.

Provide your introduction:"""


def build_scoring_prompt_opening(
    turn_content: str,
    rubric: Dict[str, Any],
    agent_name: str
) -> str:
    """
    Generate scoring prompt for opening arguments.

    Args:
        turn_content: Opening argument text
        rubric: Scoring weights configuration
        agent_name: Name of the agent being scored

    Returns:
        Formatted prompt string
    """
    return f"""You are scoring {agent_name}'s opening argument.

=== OPENING ARGUMENT ===
{turn_content}

Scoring Criteria (0-10 for each sub-criterion):

**Argumentation ({rubric.get('argumentation_weight', 35)}%)**
- Logic (0-10): Logical structure and coherence
- Originality (0-10): Depth and uniqueness of perspective
- Evidence (0-10): Quality and relevance of support

**Delivery ({rubric.get('delivery_weight', 20)}%)**
- Clarity (0-10): Clear expression and understandability
- Structure (0-10): Organization and flow

**Strategy ({rubric.get('strategy_weight', 15)}%)**
- Position Setup (0-10): Clarity of position framework

Provide your scores in this exact JSON format:
{{
    "argumentation": {{
        "logic": <0-10>,
        "originality": <0-10>,
        "evidence": <0-10>
    }},
    "delivery": {{
        "clarity": <0-10>,
        "structure": <0-10>
    }},
    "strategy": {{
        "position_setup": <0-10>
    }},
    "total": <calculated sum>,
    "justification": "<brief 1-2 sentence explanation>"
}}

Respond with ONLY the JSON, no additional text:"""


def build_scoring_prompt_rebuttal(
    turn_content: str,
    rubric: Dict[str, Any],
    agent_name: str,
    opponent_opening: str
) -> str:
    """
    Generate scoring prompt for rebuttal arguments.

    Args:
        turn_content: Rebuttal argument text
        rubric: Scoring weights configuration
        agent_name: Name of the agent being scored
        opponent_opening: Opponent's opening for context

    Returns:
        Formatted prompt string
    """
    return f"""You are scoring {agent_name}'s rebuttal.

=== OPPONENT'S OPENING (FOR REFERENCE) ===
{opponent_opening}

=== REBUTTAL TO SCORE ===
{turn_content}

Scoring Criteria (0-10 for each sub-criterion):

**Rebuttal ({rubric.get('rebuttal_weight', 30)}%)**
- Targeting (0-10): Accuracy in identifying opponent's core claims
- Effectiveness (0-10): Strength of counter-arguments
- Reconstruction (0-10): Ability to turn opponent's points

**Argumentation ({rubric.get('argumentation_weight', 35)}%)**
- Consistency (0-10): Alignment with opening argument

**Delivery ({rubric.get('delivery_weight', 20)}%)**
- Clarity (0-10): Clear refutation logic

Provide your scores in this exact JSON format:
{{
    "rebuttal": {{
        "targeting": <0-10>,
        "effectiveness": <0-10>,
        "reconstruction": <0-10>
    }},
    "argumentation": {{
        "consistency": <0-10>
    }},
    "delivery": {{
        "clarity": <0-10>
    }},
    "total": <calculated sum>,
    "justification": "<brief 1-2 sentence explanation>"
}}

Respond with ONLY the JSON, no additional text:"""


def build_scoring_prompt_summary(
    turn_content: str,
    rubric: Dict[str, Any],
    agent_name: str,
    all_previous_turns: List[str]
) -> str:
    """
    Generate scoring prompt for summary arguments.

    Args:
        turn_content: Summary argument text
        rubric: Scoring weights configuration
        agent_name: Name of the agent being scored
        all_previous_turns: All previous debate turns for new argument detection

    Returns:
        Formatted prompt string
    """
    debate_context = "\n\n".join([
        f"[Turn {i+1}] {turn}" for i, turn in enumerate(all_previous_turns)
    ])

    return f"""You are scoring {agent_name}'s summary (Whip Speech).

=== PREVIOUS DEBATE TURNS ===
{debate_context}

=== SUMMARY TO SCORE ===
{turn_content}

Scoring Criteria (0-10 for each sub-criterion):

**Strategy ({rubric.get('strategy_weight', 15)}%)**
- Weighing (0-10): Quality of comparative analysis
- New Argument Penalty: **-5 points if new arguments detected**

**Argumentation ({rubric.get('argumentation_weight', 35)}%)**
- Synthesis (0-10): Coherence of overall case summary

**Delivery ({rubric.get('delivery_weight', 20)}%)**
- Impact (0-10): Memorability and closing strength

**IMPORTANT**: Check if the summary introduces NEW arguments, evidence, or examples not mentioned in previous turns. This is strictly forbidden in BP Lite format.

Provide your scores in this exact JSON format:
{{
    "strategy": {{
        "weighing": <0-10>,
        "new_argument_penalty": <0 or -5>
    }},
    "argumentation": {{
        "synthesis": <0-10>
    }},
    "delivery": {{
        "impact": <0-10>
    }},
    "total": <calculated sum including penalty>,
    "new_arguments_detected": <true/false>,
    "justification": "<brief 1-2 sentence explanation>"
}}

Respond with ONLY the JSON, no additional text:"""


def build_verdict_prompt(
    topic: str,
    position_a: str,
    position_b: str,
    agent_a_name: str,
    agent_b_name: str,
    scores_a: Dict[str, Any],
    scores_b: Dict[str, Any],
    all_turns: List[str]
) -> str:
    """
    Generate final verdict prompt.

    Args:
        topic: Debate topic
        position_a: Agent A's position
        position_b: Agent B's position
        agent_a_name: Name of Agent A
        agent_b_name: Name of Agent B
        scores_a: Agent A's cumulative scores
        scores_b: Agent B's cumulative scores
        all_turns: All debate turns for reference

    Returns:
        Formatted prompt string
    """
    debate_summary = "\n\n".join([
        f"[Turn {i+1}] {turn[:200]}..." for i, turn in enumerate(all_turns)
    ])

    return f"""You are delivering the final verdict for this debate.

Topic: {topic}
- {agent_a_name}'s Position: {position_a}
- {agent_b_name}'s Position: {position_b}

=== FINAL SCORES ===
**{agent_a_name}: {scores_a.get('total', 0)} points**
- Argumentation: {scores_a.get('argumentation', 0)}
- Rebuttal: {scores_a.get('rebuttal', 0)}
- Delivery: {scores_a.get('delivery', 0)}
- Strategy: {scores_a.get('strategy', 0)}

**{agent_b_name}: {scores_b.get('total', 0)} points**
- Argumentation: {scores_b.get('argumentation', 0)}
- Rebuttal: {scores_b.get('rebuttal', 0)}
- Delivery: {scores_b.get('delivery', 0)}
- Strategy: {scores_b.get('strategy', 0)}

=== DEBATE SUMMARY ===
{debate_summary}

Your task: Deliver a comprehensive final verdict.

Include:
1. **Winner Announcement**: State the winner clearly
2. **Score Analysis**: Compare scores and explain the difference
3. **Strongest Moments**: Highlight best arguments from each side
4. **Weakest Moments**: Identify missed opportunities or weak points
5. **Recommendations**: Suggest improvements for each debater
6. **Closing Statement**: Memorable final remarks

Be fair, objective, and constructive. Length: 300-500 words.

Provide your verdict:"""

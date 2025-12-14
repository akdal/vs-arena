"""
Debater Prompt Templates
"""
from typing import Dict, Any, List


def build_opening_prompt(topic: str, position: str, persona: Dict[str, Any]) -> str:
    """
    Generate opening argument prompt with persona injection.

    Args:
        topic: Debate topic
        position: Debater's position (FOR/AGAINST)
        persona: Agent persona configuration

    Returns:
        Formatted prompt string
    """
    forbidden = persona.get("forbidden_phrases", [])
    forbidden_text = f"\n\nForbidden phrases (do not use): {', '.join(forbidden)}" if forbidden else ""

    return f"""You are {persona.get('name', 'a debater')}.

Persona:
- Tone: {persona.get('tone', 'formal')}
- Values: {', '.join(persona.get('values', ['logic', 'evidence']))}
- Thinking Style: {persona.get('thinking_style', 'analytical')}
- Speaking Style: {persona.get('speaking_style', 'structured')}

Debate Topic: {topic}
Your Position: {position}

Your task: Present a strong opening argument.

Requirements (BP Lite - Opening):
1. Define key terms relevant to the debate
2. Present 2-3 core arguments with clear reasoning
3. Use evidence, examples, or logical frameworks to support your claims
4. Establish a clear position framework
5. Be persuasive, well-structured, and compelling{forbidden_text}

Length: Aim for 300-500 words.

Present your opening argument now:"""


def build_rebuttal_prompt(
    topic: str,
    position: str,
    persona: Dict[str, Any],
    opponent_opening: str,
    own_opening: str
) -> str:
    """
    Generate rebuttal prompt with context from previous turns.

    Args:
        topic: Debate topic
        position: Debater's position
        persona: Agent persona configuration
        opponent_opening: Opponent's opening argument
        own_opening: Own opening argument

    Returns:
        Formatted prompt string
    """
    forbidden = persona.get("forbidden_phrases", [])
    forbidden_text = f"\n\nForbidden: {', '.join(forbidden)}" if forbidden else ""

    return f"""Topic: {topic}
Your Position: {position}

=== OPPONENT'S OPENING ARGUMENT ===
{opponent_opening}

=== YOUR OPENING ARGUMENT ===
{own_opening}

Your task: Rebut the opponent's argument.

Requirements (BP Lite - Rebuttal):
1. Identify the opponent's core claims and weakest points
2. Target their arguments with direct refutation
3. Expose logical flaws, unsupported assumptions, or weak evidence
4. Reconstruct their points to support your position (if possible)
5. Maintain consistency with your opening argument
6. Do not use strawman arguments or personal attacks{forbidden_text}

Length: Aim for 250-400 words.

Present your rebuttal now:"""


def build_summary_prompt(
    topic: str,
    position: str,
    persona: Dict[str, Any],
    all_debate_turns: List[str]
) -> str:
    """
    Generate summary/closing prompt with full debate context.

    Args:
        topic: Debate topic
        position: Debater's position
        persona: Agent persona configuration
        all_debate_turns: List of all previous turns in order

    Returns:
        Formatted prompt string
    """
    debate_context = "\n\n".join([
        f"[Turn {i+1}] {turn}" for i, turn in enumerate(all_debate_turns)
    ])

    forbidden = persona.get("forbidden_phrases", [])
    forbidden_text = f"\n\nForbidden phrases: {', '.join(forbidden)}" if forbidden else ""

    return f"""Topic: {topic}
Your Position: {position}

=== FULL DEBATE SO FAR ===
{debate_context}

Your task: Deliver a closing summary (Whip Speech).

Requirements (BP Lite - Summary/Whip):
1. **NO NEW ARGUMENTS** - This is strictly forbidden and will result in penalties
2. Weigh your arguments against the opponent's (comparative analysis)
3. Explain why your side wins (impact comparison, bigger picture)
4. Synthesize your team's case into a coherent narrative
5. Provide a memorable closing statement
6. Focus on "weighing" - why your arguments matter more{forbidden_text}

**WARNING**: Introducing new arguments, new evidence, or new examples that were not mentioned earlier will result in automatic penalties. You may only:
- Summarize and crystallize existing arguments
- Compare the relative importance/impact of arguments
- Explain why your framework is superior

Length: Aim for 200-350 words.

Present your summary now:"""

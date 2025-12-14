"""
LangGraph Debate Flow Definition

This module defines the complete BP Lite debate workflow graph with 14 nodes:
- 1 judge introduction
- 6 debater nodes (opening, rebuttal, summary for A and B)
- 7 judge scoring/verdict nodes
"""
from langgraph.graph import StateGraph, END

from app.graph.state import DebateState
from app.graph.nodes.debater import (
    opening_a,
    opening_b,
    rebuttal_a,
    rebuttal_b,
    summary_a,
    summary_b
)
from app.graph.nodes.judge import (
    judge_intro,
    score_opening_a,
    score_opening_b,
    score_rebuttal_a,
    score_rebuttal_b,
    score_summary_a,
    score_summary_b,
    judge_verdict
)


def create_debate_graph() -> StateGraph:
    """
    Create the BP Lite debate workflow graph.

    Flow:
    1. judge_intro - Judge introduces rules and scoring criteria
    2. opening_a - Agent A presents opening argument
    3. score_opening_a - Judge scores Agent A's opening
    4. opening_b - Agent B presents opening argument
    5. score_opening_b - Judge scores Agent B's opening
    6. rebuttal_a - Agent A rebuts Agent B's opening
    7. score_rebuttal_a - Judge scores Agent A's rebuttal
    8. rebuttal_b - Agent B rebuts Agent A's opening
    9. score_rebuttal_b - Judge scores Agent B's rebuttal
    10. summary_a - Agent A delivers closing summary (Whip Speech)
    11. score_summary_a - Judge scores Agent A's summary
    12. summary_b - Agent B delivers closing summary (Whip Speech)
    13. score_summary_b - Judge scores Agent B's summary
    14. judge_verdict - Judge delivers final verdict and announces winner

    Returns:
        Compiled StateGraph ready for execution
    """
    # Initialize graph with DebateState
    graph = StateGraph(DebateState)

    # Add all 14 nodes
    graph.add_node("judge_intro", judge_intro)
    graph.add_node("opening_a", opening_a)
    graph.add_node("score_opening_a", score_opening_a)
    graph.add_node("opening_b", opening_b)
    graph.add_node("score_opening_b", score_opening_b)
    graph.add_node("rebuttal_a", rebuttal_a)
    graph.add_node("score_rebuttal_a", score_rebuttal_a)
    graph.add_node("rebuttal_b", rebuttal_b)
    graph.add_node("score_rebuttal_b", score_rebuttal_b)
    graph.add_node("summary_a", summary_a)
    graph.add_node("score_summary_a", score_summary_a)
    graph.add_node("summary_b", summary_b)
    graph.add_node("score_summary_b", score_summary_b)
    graph.add_node("judge_verdict", judge_verdict)

    # Set entry point
    graph.set_entry_point("judge_intro")

    # Define sequential edges (BP Lite flow)
    graph.add_edge("judge_intro", "opening_a")
    graph.add_edge("opening_a", "score_opening_a")
    graph.add_edge("score_opening_a", "opening_b")
    graph.add_edge("opening_b", "score_opening_b")
    graph.add_edge("score_opening_b", "rebuttal_a")
    graph.add_edge("rebuttal_a", "score_rebuttal_a")
    graph.add_edge("score_rebuttal_a", "rebuttal_b")
    graph.add_edge("rebuttal_b", "score_rebuttal_b")
    graph.add_edge("score_rebuttal_b", "summary_a")
    graph.add_edge("summary_a", "score_summary_a")
    graph.add_edge("score_summary_a", "summary_b")
    graph.add_edge("summary_b", "score_summary_b")
    graph.add_edge("score_summary_b", "judge_verdict")
    graph.add_edge("judge_verdict", END)

    # Compile and return
    return graph.compile()


# Singleton instance for import
debate_graph = create_debate_graph()

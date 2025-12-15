# VS Arena User Guide

VS Arena is an AI-powered debate platform where customizable LLM agents engage in structured debates.

## Table of Contents

- [Quick Start](#quick-start)
- [Agent Management](#agent-management)
- [Running Debates](#running-debates)
- [Debate Arena](#debate-arena)
- [Swap Test (Bias Detection)](#swap-test-bias-detection)
- [API Reference](#api-reference)
- [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Quick Start

### Prerequisites

- Docker and Docker Compose (for PostgreSQL)
- Node.js 18+ (for frontend)
- Python 3.12+ (for backend)
- Ollama installed locally with at least one model

### Starting the Servers

1. **Start the database:**
   ```bash
   docker-compose up -d
   ```

2. **Start the backend:**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```
   Backend runs at: http://localhost:8000

3. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend runs at: http://localhost:3000

4. **Ensure Ollama is running:**
   ```bash
   ollama serve
   ```

### Your First Debate

1. Navigate to http://localhost:3000
2. Create two agents (Agent A and Agent B)
3. Create a judge agent
4. Go to the Debate page
5. Enter a topic, select agents and positions
6. Start the debate!

---

## Agent Management

### Creating an Agent

1. Go to **Agent** → **New Agent**
2. Fill in the configuration:
   - **Name**: A descriptive name (e.g., "Aristotle", "Devil's Advocate")
   - **Model**: Select from available Ollama models
   - **Persona**: Define the agent's personality
     - `role`: Agent's character (e.g., "Philosopher")
     - `style`: Argumentation style (e.g., "Uses Socratic questioning")
     - `tone`: Speaking manner (e.g., "measured and thoughtful")
     - `forbidden_phrases`: Words/phrases to avoid (penalty applied if used)
   - **Parameters**: LLM generation settings
     - `temperature`: Creativity (0.0-1.0, higher = more creative)
     - `max_tokens`: Maximum response length
     - `top_p`: Nucleus sampling threshold

### Testing an Agent (Preview)

Before using an agent in a debate, test it with the **Preview** feature:

1. In the agent editor, click "Preview"
2. Enter a test topic and position (FOR/AGAINST)
3. Watch the agent generate an opening argument
4. Adjust persona/parameters as needed

### Cloning an Agent

To create a variation of an existing agent:

1. Go to the agent list
2. Click the clone button on an agent card
3. A copy with "(Copy)" suffix is created
4. Edit the copy as needed

---

## Running Debates

### Setting Up a Debate

1. Navigate to **Debate** page
2. Configure the debate:
   - **Topic**: The proposition to debate
   - **Agent A**: First debater + position (FOR/AGAINST)
   - **Agent B**: Second debater + opposite position
   - **Judge**: Agent to score and decide the winner

3. (Optional) Adjust **Rubric Weights**:
   | Category | Default | Description |
   |----------|---------|-------------|
   | Argumentation | 35% | Quality of arguments |
   | Rebuttal | 30% | Effectiveness of counters |
   | Delivery | 20% | Clarity and persuasion |
   | Strategy | 15% | Debate tactics |

4. Click **Start Debate**

### Debate Flow

The debate follows a structured format:

1. **Judge Introduction** - Sets the stage
2. **Opening A** - Agent A's opening argument
3. **Opening B** - Agent B's opening argument
4. **Score Opening A/B** - Judge scores opening statements
5. **Rebuttal A** - Agent A responds to B's opening
6. **Rebuttal B** - Agent B responds to A's opening
7. **Score Rebuttal A/B** - Judge scores rebuttals
8. **Summary A** - Agent A's closing statement
9. **Summary B** - Agent B's closing statement
10. **Score Summary A/B** - Judge scores summaries
11. **Verdict** - Final judgment and winner announcement

---

## Debate Arena

### Views

Toggle between two view modes:

- **Text View**: Traditional transcript format
- **Flow View**: Visual graph showing debate structure and connections

### Understanding the Flow View

- **Blue nodes**: Agent A's turns
- **Red nodes**: Agent B's turns
- **Purple nodes**: Judge turns
- **Dashed arrows**: Rebuttal connections (what each argument responds to)

### Score Display

The sidebar shows:
- Running scores for each agent
- Phase-by-phase breakdown
- Final verdict when complete

### Replay Mode

After a debate completes:

1. Use playback controls to replay the debate
2. Adjust speed (0.5x, 1x, 2x)
3. Navigate phase-by-phase with arrow buttons
4. Click timeline markers to jump to specific phases

---

## Swap Test (Bias Detection)

### Purpose

Swap tests detect if the judge has **position bias** (tendency to favor FOR or AGAINST regardless of argument quality).

### How It Works

1. Complete a debate
2. Create a swap test (positions exchanged)
3. Run the swapped debate
4. Compare results

### Interpreting Results

| Result | Meaning |
|--------|---------|
| **No Bias** | Different positions won → Same agent won both (skill difference) |
| **Position Bias** | Same position won both times → Judge favors that position |
| **Inconclusive** | One or both debates ended in draw |

### Running a Swap Test

1. Go to a completed debate's page
2. Click "Create Swap Test"
3. Run the new debate
4. View comparison analysis

---

## API Reference

Interactive API documentation is available at:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents/` | GET | List all agents |
| `/api/agents/` | POST | Create agent |
| `/api/agents/{id}` | GET/PUT/DELETE | Agent CRUD |
| `/api/agents/{id}/clone` | POST | Clone agent |
| `/api/agents/preview` | POST | Preview agent (SSE) |
| `/api/debate/start` | POST | Start debate |
| `/api/debate/stream/{id}` | GET | Stream debate (SSE) |
| `/api/debate/runs` | GET | List all runs |
| `/api/debate/runs/{id}` | GET/DELETE | Run details/delete |
| `/api/debate/runs/{id}/turns` | GET | Get turns (replay) |
| `/api/debate/runs/{id}/swap` | POST | Create swap test |
| `/api/ollama/models` | GET | List Ollama models |
| `/api/ollama/status` | GET | Check Ollama status |

---

## Keyboard Shortcuts

### Debate Replay

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` | Previous phase |
| `→` | Next phase |

### Arena View

| Key | Action |
|-----|--------|
| `T` | Toggle Text / Flow view |

---

## Troubleshooting

### "Ollama server is not available"

Ensure Ollama is running:
```bash
ollama serve
```

### "Agent not found"

Verify the agent exists in the Agent page before starting a debate.

### Debate stuck on "pending"

1. Check backend console for errors
2. Verify Ollama has the required model:
   ```bash
   ollama list
   ```

### Position validation error

Agents A and B must have **opposite positions** (one FOR, one AGAINST).

---

## Support

For issues and feature requests, visit:
https://github.com/your-repo/vs-arena/issues

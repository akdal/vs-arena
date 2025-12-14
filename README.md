# VS Arena - AI Debate Platform

AI-powered debate platform with structured argumentation using British Parliamentary (BP Lite) format.

## Tech Stack

### Backend (최신 버전 - 2025-12-15)
- **Python 3.12+**
- **FastAPI 0.124.4** - Modern web framework
- **LangGraph 0.6.11** - Workflow orchestration
- **SQLAlchemy 2.0.45** - ORM
- **Pydantic 2.12.5** - Data validation
- **PostgreSQL 17+** - Database
- **Ollama 0.6.1** - Local LLM integration
- **SSE-Starlette 3.0.3** - Server-Sent Events

### Frontend (최신 버전 - 2025-12-15)
- **Next.js 16.0.10** - React framework with App Router
- **React 19.2.3** - UI library
- **TypeScript 5.9.3** - Type safety
- **Tailwind CSS 4.1.18** - Styling
- **React Flow 12.10.0** - Debate visualization
- **TanStack Query 5.90.12** - Data fetching

## Prerequisites

- Python 3.12 or higher
- Node.js 20 or higher
- Docker & Docker Compose
- Ollama (installed locally)

## Project Structure

```
vs-arena/
├── backend/          # FastAPI + LangGraph backend
│   ├── app/
│   │   ├── api/      # API routes
│   │   ├── core/     # Configuration
│   │   ├── db/       # Database setup
│   │   ├── models/   # SQLAlchemy models
│   │   ├── services/ # Business logic
│   │   └── graph/    # LangGraph workflows
│   └── pyproject.toml
├── frontend/         # Next.js frontend
│   ├── app/          # App Router pages
│   │   ├── agent/    # Agent management
│   │   └── debate/   # Debate setup & arena
│   └── package.json
├── docker/           # Docker configuration
│   └── init.sql      # Database schema
└── docker-compose.yml
```

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd vs-arena
```

### 2. Start PostgreSQL

```bash
docker-compose up -d
```

This will start PostgreSQL on port 5432 with the database schema already initialized.

### 3. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -e .

# Copy environment file
cp .env.example .env

# Start backend server
uvicorn app.main:app --reload --port 8000
```

Backend will be available at: http://localhost:8000

API docs: http://localhost:8000/docs

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: http://localhost:3000

### 5. Ensure Ollama is Running

Make sure Ollama is installed and running locally on port 11434.

```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Pull required models (examples)
ollama pull llama3
ollama pull qwen2.5
```

## Development

### Backend Development

```bash
cd backend

# Run with auto-reload
uvicorn app.main:app --reload

# Run tests
pytest

# Format code
black app/
ruff app/
```

### Frontend Development

```bash
cd frontend

# Development server with Turbopack
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Build for production
npm run build
```

## Database

### Access PostgreSQL

```bash
# Connect to database
docker exec -it vs-arena-postgres psql -U vsarena -d vsarena

# Or use any PostgreSQL client
# Host: localhost
# Port: 5432
# Database: vsarena
# Username: vsarena
# Password: vsarena
```

### Schema

The database schema is automatically created when you start docker-compose. See `docker/init.sql` for details.

Tables:
- `agents` - AI debate agents configuration
- `runs` - Debate sessions
- `turns` - Individual debate turns/speeches

## API Endpoints

### Agent API
- `GET /api/agents` - List all agents
- `POST /api/agents` - Create agent
- `GET /api/agents/{id}` - Get agent details
- `PUT /api/agents/{id}` - Update agent
- `DELETE /api/agents/{id}` - Delete agent
- `POST /api/agents/{id}/clone` - Clone agent
- `POST /api/agents/preview` - Preview agent (1-turn test)

### Ollama API
- `GET /api/ollama/models` - List available models
- `GET /api/ollama/status` - Check Ollama server status

### Debate API
- `POST /api/debate/start` - Start new debate
- `GET /api/debate/stream/{runId}` - Stream debate progress (SSE)
- `GET /api/runs` - List all runs
- `GET /api/runs/{id}` - Get run details
- `GET /api/runs/{id}/turns` - Get all turns for replay
- `DELETE /api/runs/{id}` - Delete run

## Features

### Completed (Phase 0-2)
- Project structure setup
- Backend FastAPI foundation with LangGraph orchestration
- Frontend Next.js with App Router
- PostgreSQL database schema
- Docker Compose setup
- Ollama integration (models, status, streaming)
- Agent CRUD API (create, read, update, delete, clone, preview)
- LangGraph 14-node debate workflow (BP Lite format)
- SSE streaming for real-time debate
- Frontend Agent Module (management, preview)
- Frontend Debate Module (setup, streaming arena)
- React Flow visualization (custom nodes/edges, Dagre layout)
- Animation & UX (typing effect, node glow, edge flow, auto-scroll)
- Arena UI (layout, turn indicator, side panel with scores/progress/log)

### In Progress (Phase 2 - M2)
- Judging System Frontend (ScoreCard, VerdictPanel)

### Planned
- Phase 3: Replay, rule violation detection, character showcase
- Phase 4: Testing, performance optimization, documentation

## Documentation

- [PRD (Product Requirements Document)](./prd.md)
- [TODO (Development Plan)](./todo.md)

## Contributing

This is a development project. Contributions welcome!

## License

MIT

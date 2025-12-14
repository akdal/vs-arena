# Changelog

All notable changes to VS Arena project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `GET /api/debate/runs` - List all debate runs
- `GET /api/debate/runs/{run_id}` - Get run details with agent information
- `GET /api/debate/runs/{run_id}/turns` - Get all turns for replay functionality
- `DELETE /api/debate/runs/{run_id}` - Delete run with cascade to turns

### Changed
- Updated `TurnResponse` schema to match actual Turn model fields
- Added `RunDetailResponse` schema with embedded agent information
- Added `get_turns_by_run_id()` function to run_crud service

### Fixed
- Updated TODO.md to reflect actual completion status (sections 1.1-1.4 were already implemented)
- **Critical**: Added missing `created_at` and `updated_at` fields to agent dictionaries in `get_run_with_agents()`
  - Fixes Pydantic validation error on `GET /api/debate/runs/{run_id}` endpoint
  - Agent dictionaries now properly match `AgentResponse` schema requirements

## [0.2.0] - 2025-12-15

### Added

#### LangGraph Debate Orchestration (Phase 1-M1)
- Complete BP Lite debate workflow with 14-node StateGraph
  - 6 debater nodes (opening, rebuttal, summary for A/B)
  - 7 judge nodes (intro, 6 scoring nodes)
  - 1 verdict node for final judgment
- Real-time SSE token streaming for debater arguments
- Exponential backoff retry logic for Ollama failures
- JSON score parsing with three-tier fallback strategy

#### Debate API Endpoints
- `POST /api/debate/start` - Create and initialize debate run
  - Agent validation (A, B, Judge)
  - Position validation (must be opposite)
  - Run creation with config and rubric
- `GET /api/debate/stream/{run_id}` - SSE streaming endpoint
  - `phase_start` - Phase beginning notification
  - `token` - Real-time token streaming
  - `phase_end` - Phase completion notification
  - `score` - Scoring results after each phase
  - `verdict` - Final judgment announcement
  - `run_complete` - Debate completion signal
  - `error` - Error handling events

#### Prompt Templates
- Debater prompts with persona injection
  - Opening prompt (topic, position, persona)
  - Rebuttal prompt (opponent context)
  - Summary/Whip Speech prompt (full debate context)
- Judge prompts for structured scoring
  - Introduction prompt
  - Scoring prompts (opening/rebuttal/summary criteria)
  - Verdict prompt with score aggregation

#### Database Integration
- Run CRUD service (`create_run`, `get_run_with_agents`, `update_run_status`)
- Immediate turn persistence during execution
- Run status lifecycle (pending -> running -> completed/failed)

### Changed
- Updated `Turn` model: `metadata` field renamed to `metadata_json` to avoid SQLAlchemy conflicts
- Enhanced `schemas.py` with `DebateStartRequest`, `DebateStartResponse`
- Added `rubric_json` field to `RunCreate` schema

### Technical Details
- **State Management**: `DebateState` and `Turn` TypedDicts for LangGraph state
- **Retry Logic**: Max 3 retries with exponential backoff (1s, 2s, 4s)
- **Score Calculation**: Weighted scoring with configurable rubric (argumentation, rebuttal, delivery, strategy)
- **Winner Determination**: Score difference threshold of 5 points for DRAW

## [0.1.0] - 2025-12-15

### Added

#### Project Infrastructure
- Project directory structure with `backend/`, `frontend/`, `docker/`, `docs/` directories
- Comprehensive README.md with setup instructions and documentation
- Development TODO.md with detailed phase-based development plan

#### Backend Foundation
- FastAPI 0.124.4 application with CORS middleware
- LangGraph 0.6.11 integration for workflow orchestration
- SQLAlchemy 2.0.45 ORM setup
- Pydantic 2.12.5 for data validation
- Ollama 0.6.1 SDK for local LLM integration
- SSE-Starlette 3.0.3 for Server-Sent Events streaming
- Basic API router structure (`/api/agents`, `/api/debate`, `/api/ollama`, `/api/runs`)
- Health check and root endpoints

#### Frontend Foundation
- Next.js 16.0.10 with App Router architecture
- React 19.2.3 with TypeScript 5.9.3
- Tailwind CSS 4.1.18 with `@tailwindcss/postcss` integration
- shadcn/ui component library (new-york style)
  - Button, Card, Input, Label, Textarea components
- React Flow 12.10.0 (@xyflow/react) for debate visualization
- TanStack Query 5.90.12 for data fetching and state management
- ESLint 9.39.2 configuration
- Turbopack support for fast development builds

#### Database
- PostgreSQL 17 Docker Compose configuration
- Database schema with three core tables:
  - `agents` - AI debate agent configurations
  - `runs` - Debate session records
  - `turns` - Individual debate turn/speech records
- UUID support with `gen_random_uuid()`
- Automatic `updated_at` trigger for agents table
- Performance indexes on key columns

#### Development Tools
- Docker Compose for local PostgreSQL instance
- Hot reload support for both backend (uvicorn) and frontend (Next.js Turbopack)
- Environment configuration templates (`.env.example`)

### Technical Stack Summary
- **Backend**: Python 3.12+, FastAPI 0.124.4, LangGraph 0.6.11, SQLAlchemy 2.0.45
- **Frontend**: Next.js 16.0.10, React 19.2.3, TypeScript 5.9.3, Tailwind CSS 4.1.18
- **Database**: PostgreSQL 17
- **LLM**: Ollama 0.6.1 (local)
- **Streaming**: SSE-Starlette 3.0.3
- **State Management**: TanStack Query 5.90.12

[Unreleased]: https://github.com/your-repo/vs-arena/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/your-repo/vs-arena/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/your-repo/vs-arena/releases/tag/v0.1.0

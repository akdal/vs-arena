# Changelog

All notable changes to VS Arena project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Run management API endpoints:
  - `GET /api/debate/runs` - List all runs
  - `GET /api/debate/runs/{run_id}` - Get run details with agents
  - `GET /api/debate/runs/{run_id}/turns` - Get turns for replay
  - `DELETE /api/debate/runs/{run_id}` - Delete run (cascades to turns)
- `RunDetailResponse` schema with embedded agent information
- `get_turns_by_run_id()` function in run_crud service

### Fixed
- Missing `created_at` and `updated_at` fields in agent dictionaries

## [0.2.0] - 2025-12-15

### Added
- **LangGraph Debate Orchestration**: Complete BP Lite workflow with 14-node StateGraph
  - 6 debater nodes (opening, rebuttal, summary for A/B)
  - 7 judge nodes (intro + 6 scoring nodes)
  - 1 verdict node
- **SSE Streaming**: Real-time token streaming for debate execution
  - Events: `phase_start`, `token`, `phase_end`, `score`, `verdict`, `run_complete`, `error`
- **Debate API**:
  - `POST /api/debate/start` - Create and start debate
  - `GET /api/debate/stream/{run_id}` - SSE streaming endpoint
- **Prompt Templates**: Debater (opening, rebuttal, summary) and Judge (intro, scoring, verdict)
- **Run CRUD**: `create_run`, `get_run_with_agents`, `update_run_status`
- Exponential backoff retry logic for Ollama failures
- JSON score parsing with three-tier fallback

### Changed
- `Turn` model: `metadata` field renamed to `metadata_json`
- Added `DebateStartRequest`, `DebateStartResponse` schemas
- Added `rubric_json` field to `RunCreate` schema

## [0.1.0] - 2025-12-15

### Added
- **Project Infrastructure**: Directory structure (backend, frontend, docker, docs)
- **Backend**: FastAPI 0.124.4, LangGraph 0.6.11, SQLAlchemy 2.0.45, Pydantic 2.12.5, Ollama 0.6.1
- **Frontend**: Next.js 16.0.10, React 19.2.3, TypeScript 5.9.3, Tailwind CSS 4.1.18, React Flow 12.10.0
- **Database**: PostgreSQL 17 with agents, runs, turns tables
- **Agent CRUD API**: Full CRUD + clone + preview endpoints
- **Ollama Integration**: Models list and status endpoints
- shadcn/ui components (Button, Card, Input, Label, Textarea)
- TanStack Query 5.90.12 for state management

[Unreleased]: https://github.com/your-repo/vs-arena/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/your-repo/vs-arena/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/your-repo/vs-arena/releases/tag/v0.1.0

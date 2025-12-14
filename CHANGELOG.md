# Changelog

All notable changes to VS Arena project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/your-repo/vs-arena/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-repo/vs-arena/releases/tag/v0.1.0

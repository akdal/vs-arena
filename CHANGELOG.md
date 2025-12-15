# Changelog

All notable changes to VS Arena project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Replay Feature**: Complete debate replay system for completed runs (Phase 3.1)
  - Core replay hook (use-debate-replay.ts):
    - Character-by-character streaming simulation
    - Playback state management (playing, paused, phase index)
    - Speed control support (0.5x, 1x, 2x)
    - Graph state reconstruction from Turn data
    - Phase navigation (previous, next, direct jump)
  - Replay controls component (replay-controls.tsx):
    - Play/Pause toggle button
    - Speed selector dropdown (0.5x, 1x, 2x)
    - Previous/Next phase buttons with disabled states
    - Phase counter display (current/total)
  - Replay timeline component (replay-timeline.tsx):
    - Clickable phase segments for direct navigation
    - Visual indicators for completed/current/pending phases
    - Agent-colored phase markers (Blue/Red/Purple)
  - Arena replay view component (arena-replay-view.tsx):
    - Integration of replay controls and timeline
    - React Flow canvas with reconstructed graph state
    - Seamless transition from live to replay mode
  - Arena page updates:
    - Replay mode toggle (only for completed runs)
    - useRunTurns hook integration
    - Mode prop for TurnIndicator (live/replay)
  - Type definitions:
    - ReplaySpeed type added to lib/types.ts

- **Error Handling UI**: Toast notification system for user-facing errors (Phase 3.3)
  - Sonner toast library integration
  - Global Toaster component in root layout (top-right, richColors)
  - Error toast notifications in key components:
    - DebateStreamView: SSE streaming errors
    - ArenaFlowView: Real-time flow streaming errors
    - AgentPreviewPanel: Preview generation errors
    - AgentEditor: Create/Update mutation errors
  - 5-second auto-dismiss duration for all error toasts
  - Inline error displays kept as backup

- **Rule Violation Detection**: Forbidden phrase and new argument detection (Phase 3.2)
  - Hybrid detection approach:
    - Rule-based string matching for forbidden phrases
    - LLM-based detection for new arguments in Summary
  - Utility function `detect_forbidden_phrases()` in utils.py:
    - Case-insensitive matching
    - Context extraction (30 chars before/after)
    - Multiple occurrence detection
  - Updated Judge scoring prompts:
    - `build_scoring_prompt_opening()`: forbidden_phrases parameter
    - `build_scoring_prompt_rebuttal()`: forbidden_phrases parameter
    - `build_scoring_prompt_summary()`: forbidden + new arguments
  - All 6 scoring nodes updated:
    - Detect violations before scoring
    - Pass violations to Judge LLM prompt
    - Store violations in turn metadata
  - Penalty structure:
    - -2 points per forbidden phrase violation
    - -5 points for new arguments in Summary

- **Character Showcase Enhancement**: Agent gallery with detail drawer (Phase 3.4)
  - shadcn/ui Sheet component integration
  - AgentGalleryCard: Click-focused card for gallery view
  - AgentDetailDrawer: Slide-out panel with full agent details
    - Persona and parameters display
    - Embedded preview panel with SSE streaming
    - Edit Agent and Use in Debate actions
  - Model filter badges: Click to filter by specific model
  - Enhanced showcase page with drawer integration
  - Barrel exports for agent components

- **Judge Fairness (Swap Test)**: Position bias detection system (Phase 3.6)
  - Backend API endpoints:
    - `POST /api/debate/runs/{id}/swap`: Create swap test from completed run
    - `GET /api/debate/runs/{id}/compare/{swap_id}`: Compare original and swapped results
  - Position bias analysis:
    - Detects if same position wins both debates (bias)
    - Detects if same agent wins both debates (no bias, skill difference)
    - Handles DRAW cases as inconclusive
  - Frontend components:
    - SwapTestButton: Trigger swap test from completed Arena page
    - SwapComparisonView: Visual comparison with bias analysis
  - Arena page integration with URL param `?original=` for comparison
  - Note: Consistency scoring excluded (individual debate variability is part of game nature)

- **Performance Optimization**: SSE and rendering optimizations (Phase 4.2)
  - Backend SSE keep-alive heartbeat (15s interval)
  - Frontend exponential backoff reconnection (1s, 2s, 4s, max 3 retries)
  - Token update batching with requestAnimationFrame
  - Incremental layout O(1) vs O(n^2) dagre recalculation

- **Testing Infrastructure**: Comprehensive test suite (Phase 4.1)
  - Backend tests (pytest + pytest-asyncio):
    - `pytest.ini`: Configuration with asyncio_mode=auto
    - `tests/conftest.py`: Shared fixtures (mock_db, sample_agent, sample_run, sample_turn)
    - `tests/services/test_agent_crud.py`: Agent CRUD tests (7 tests)
    - `tests/services/test_run_crud.py`: Run CRUD tests (8 tests) + get_turns_by_run_id, get_run_with_agents
    - `tests/services/test_ollama.py`: Ollama service tests (8 tests)
    - `tests/api/test_agents_api.py`: Agent API endpoint tests (9 tests)
    - `tests/api/test_debate_api.py`: Debate API endpoint tests (7 tests) + get_run_turns, compare_swap_test
    - Total: ~47 backend tests across 5 test files
  - Frontend tests (Vitest + React Testing Library):
    - `vitest.config.ts`: Configuration with jsdom environment
    - `tests/setup.ts`: Global mocks (next/navigation, sonner)
    - `tests/hooks/use-agents.test.tsx`: Agent hook tests (11 tests) + useUpdateAgent
    - `tests/hooks/use-debate.test.tsx`: Debate hook tests (13 tests) + useRunTurns
    - `tests/components/agent-card.test.tsx`: AgentCard tests (9 tests)
    - `tests/components/debate-setup-form.test.tsx`: Form tests (8 tests)
    - Total: 48 frontend tests across 4 test files
  - Test quality improvements:
    - Fixed fragile side_effect ordering with dict lookup patterns
    - Fixed weak assertions with full response verification
    - Fixed unsafe type casts by providing complete mock data
  - E2E tests deferred (requires real Ollama instance)

- **React Flow Visualization**: Complete graph-based debate visualization (Phase 2.1)
  - Flow types and TypeScript definitions
  - Custom node types:
    - TopicNode: Debate topic display
    - JudgeIntroNode: Judge introduction
    - OpeningNode: Opening arguments with position badge
    - RebuttalNode: Rebuttal arguments
    - SummaryNode: Summary arguments
    - ScoreNode: Score display with breakdown
    - VerdictNode: Final verdict with winner badge
  - Custom edge types:
    - SequenceEdge: Phase flow connection (smooth-step)
    - TargetEdge: Rebuttal target connection (dashed bezier)
  - BaseDebateNode: Shared component with agent-specific styling (Blue/Red/Purple)
  - Dagre auto-layout integration with layout.ts utility
  - Node factory utilities for graph generation
  - useDebateFlow hook for SSE stream integration
  - FlowProvider and DebateFlowCanvas components
  - Text/Flow view toggle in arena page
  - React Flow components: Background, Controls, MiniMap
  - Real-time graph updates from SSE events
- **Animation & UX Enhancements**: Real-time visual feedback system (Phase 2.2)
  - Typing effect component (StreamingText):
    - Character-by-character text reveal with requestAnimationFrame
    - Blinking cursor during streaming
    - Configurable speed (charsPerFrame parameter)
  - Node highlight animations:
    - Agent-specific glow effects (blue/red/purple)
    - Box-shadow pulsing animation during streaming
    - Enhanced visual feedback with colored rings
  - Edge flow animation:
    - Active edge tracking with isActive flag
    - Flowing yellow dash effect on incoming edges
    - Auto-clear animation on phase completion
  - Auto-scroll functionality:
    - Viewport follows active node with setCenter
    - Smooth 500ms transition animation
    - Smart fitView only for initial node
  - CSS keyframes:
    - blink: Typing cursor (0.8s infinite)
    - node-glow-blue/red/purple: Agent glows (1.5s ease-in-out)
    - edge-flow: Dash offset animation (1s linear)
- **Arena UI Components**: Enhanced debate arena with layout and side panel (Phase 2.3)
  - Arena components directory structure:
    - constants.ts: PHASE_ORDER, PHASE_LABELS, agentStyles, helper functions
    - arena-layout.tsx: Main layout wrapper with grid structure
    - turn-indicator.tsx: Current speaker and 14-phase progress display
    - arena-flow-view.tsx: Integrated Flow view with arena components
  - ActionSidePanel with three tabs:
    - ScoreDisplay: Agent A vs B score comparison with progress bars
      - Opening/Rebuttal/Summary scores
      - Total score with leading indicator
      - Real-time score updates
    - ProgressIndicator: Vertical stepper for all 14 phases
      - Completed phases with checkmarks
      - Current phase with spinner
      - Pending phases with empty circles
    - DebateLog: Phase-by-phase log with status and preview
      - Status icons (completed/in_progress/pending)
      - First 50 chars preview of content
      - Scrollable with max-height 400px
  - TurnIndicator features:
    - Agent avatars with initials (colored circles)
    - Segmented horizontal progress bar (14 phases)
    - Current phase label and count (e.g., "3/14")
    - Active speaker glow animation
    - Judge indicator when judge is active
  - Layout features:
    - 2-column layout (main content + collapsible side panel)
    - Collapsible side panel (80px width) with toggle button
    - LocalStorage persistence for panel state
    - Integrated with existing Text/Flow view toggle
  - shadcn/ui additions:
    - Tabs component for side panel navigation
  - Arena page refactored to use ArenaFlowView for Flow mode
- **Code Quality Improvements**: Validator-driven optimizations (Phase 2.3)
  - Extracted and memoized ScoreBar component
  - useMemo for score calculations
  - Exported all component prop interfaces
  - FlowProvider dependency comments
  - Flexible container heights
  - Error handling for localStorage access
- **Judging System Frontend**: Score and verdict visualization (Phase 2.5)
  - ScoreCard component:
    - Phase-by-phase score display with progress bars
    - Score categories: argumentation, rebuttal, delivery, strategy, total
    - Agent-colored themes (Blue/Red)
    - Streaming indicator during scoring
    - ScoreRow memoized subcomponent
  - VerdictPanel component:
    - Winner announcement with Trophy/Scale icons
    - ScoreComparisonBar: A vs B percentage visualization
    - Judge's Analysis section with whitespace-pre-wrap
    - Streaming state with "Deliberating..." indicator
  - VerdictDisplay component (for ActionSidePanel):
    - Compact verdict display from React Flow nodes
    - Final scores calculation from score nodes
    - Integrated into 4th tab of ActionSidePanel
  - DebateStreamView updates:
    - Score parsing with useMemo (opening/rebuttal/summary for A/B)
    - Verdict parsing to extract winner from text
    - VerdictPanel and ScoreCard integration

### Fixed
- **Phase 2.5 Code Cleanup**:
  - Removed unused PHASE_LABELS import from score-card.tsx
- **Phase 2.1 Critical Issues** (from code-validator agent):
  - SSE streaming integration: useDebateFlow now manages its own SSE connection
  - Edge components now use proper EdgeProps type instead of `any`
  - Dagre graph instantiation moved inside function to prevent shared mutable state
  - Removed unused phaseOrder array from node-factory.ts
  - Added phasesRef reset when run changes to prevent stale data

### Added (Continued)
- **Frontend Debate Setup Module**: Complete debate configuration and streaming UI (Phase 1.9)
  - Debate types: DebateStartRequest, DebateConfig, RubricConfig, Run, RunDetail, DebatePhase, DebateEventType
  - API functions: startDebate, getRuns, getRun
  - TanStack Query hooks: useStartDebate, useRuns, useRun
  - SSE streaming hook: useDebateStream with phase tracking, scores, and verdict
  - Debate components:
    - AgentSelector: Agent dropdown with model badge
    - PositionSelector: FOR/AGAINST selector with color distinction
    - DebateConfig: Collapsible rounds and max_tokens configuration
    - RubricEditor: Weight sliders for scoring criteria (argumentation, rebuttal, delivery, strategy)
    - DebateSetupForm: Main form with validation and error handling
    - DebateStreamView: Real-time streaming display with phase indicator
  - App Router pages:
    - `/debate` - Debate setup form
    - `/debate/arena/[runId]` - Live streaming arena
  - shadcn/ui components: accordion
  - Position validation: Ensures agents take opposite positions
  - Rubric total validation: Visual indicator for weight sum
- **Frontend Agent Module**: Complete agent management UI (Phase 1.8)
  - App Router pages: list, new, edit, showcase, loading
  - Components: AgentList, AgentCard, AgentEditor, ModelSelector, PersonaEditor, ParamsEditor, AgentPreviewPanel
  - TanStack Query v5 integration with hooks for CRUD operations
  - SSE streaming preview with fetch + ReadableStream
  - TypeScript type definitions matching backend schemas
  - API client with error handling
  - shadcn/ui components: select, slider, skeleton, badge
- Run management API endpoints:
  - `GET /api/debate/runs` - List all runs
  - `GET /api/debate/runs/{run_id}` - Get run details with agents
  - `GET /api/debate/runs/{run_id}/turns` - Get turns for replay
  - `DELETE /api/debate/runs/{run_id}` - Delete run (cascades to turns)
- `RunDetailResponse` schema with embedded agent information
- `get_turns_by_run_id()` function in run_crud service

### Fixed
- **Critical**: SSE event type mismatch in agent preview - frontend now correctly listens for "chunk" and "done" events matching backend
- **Critical**: Memory leak in useAgentPreview - added cleanup on unmount to abort streams
- Missing `created_at` and `updated_at` fields in agent dictionaries
- Invalid Next.js config (removed experimental.turbo and eslint keys)
- Tailwind darkMode config (changed from array to string)
- Hardcoded API URLs - now using NEXT_PUBLIC_API_URL environment variable

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

---

## Development Log

상세한 구현 기록과 관련 파일 목록입니다.

### 2025-12-15: Phase 0 프로젝트 초기 설정 완료

**목표 (Goal)**:
VS Arena 프로젝트의 기본 인프라 및 개발 환경 구축

**구현 내용 (Implementation)**:
1. **프로젝트 구조**: backend, frontend, docker, docs 디렉토리 구조 생성
2. **Backend 초기화**:
   - Python 3.12+ 환경
   - FastAPI 0.124.4, LangGraph 0.6.11, SQLAlchemy 2.0.45
   - 기본 API 라우터 구조 (app/api, app/core, app/db, app/models, app/services, app/graph)
   - CORS 미들웨어 설정
3. **Frontend 초기화**:
   - Next.js 16.0.10 with App Router
   - React 19.2.3, TypeScript 5.9.3
   - Tailwind CSS 4.1.18 with shadcn/ui (new-york style)
   - React Flow 12.10.0 (@xyflow/react), TanStack Query 5.90.12
   - 기본 UI 컴포넌트 (Button, Card, Input, Label, Textarea)
4. **Database**:
   - PostgreSQL 17 Docker Compose 설정
   - 초기 스키마 (agents, runs, turns 테이블)
   - UUID 확장, 인덱스, updated_at 트리거

**결과 (Result)**:
- 모든 패키지가 2025-12-15 기준 최신 버전으로 설정됨
- Backend: `uvicorn app.main:app --reload` 로 실행 가능
- Frontend: `npm run dev` (Turbopack 지원) 로 실행 가능
- Database: `docker-compose up -d` 로 PostgreSQL 컨테이너 실행 가능

**관련 파일 (Related Files)**:
- `/backend/pyproject.toml` - Backend 의존성
- `/backend/app/main.py` - FastAPI 애플리케이션
- `/frontend/package.json` - Frontend 의존성
- `/frontend/components.json` - shadcn/ui 설정
- `/docker-compose.yml` - PostgreSQL 컨테이너 설정
- `/docker/init.sql` - 데이터베이스 스키마
- `/README.md` - 프로젝트 문서

### 2025-12-15: Phase 1-M1 LangGraph 기본 플로우 완료

**목표 (Goal)**:
BP Lite 형식의 토론 오케스트레이션 시스템 구현 - LangGraph 기반 14노드 워크플로우와 SSE 실시간 스트리밍

**구현 내용 (Implementation)**:
1. **LangGraph 상태 정의**:
   - `DebateState` TypedDict - 전체 토론 상태 관리
   - `Turn` TypedDict - 개별 발언 턴 정의
   - 상태 필드: run_id, topic, positions, agents, config, rubric, turns, scores, winner, verdict

2. **14노드 토론 그래프**:
   - 6개 Debater 노드: `opening_a`, `opening_b`, `rebuttal_a`, `rebuttal_b`, `summary_a`, `summary_b`
   - 7개 Judge 노드: `judge_intro`, `score_opening_a`, `score_opening_b`, `score_rebuttal_a`, `score_rebuttal_b`, `score_summary_a`, `score_summary_b`
   - 1개 Verdict 노드: `judge_verdict`
   - StateGraph 순차 연결 및 컴파일

3. **SSE 스트리밍 아키텍처**:
   - `EventSourceResponse` 기반 실시간 스트리밍
   - 이벤트 타입: `phase_start`, `token`, `phase_end`, `score`, `verdict`, `run_complete`, `error`
   - Debater 노드: 토큰 단위 스트리밍
   - Judge 노드: 완료 후 일괄 전송

4. **Ollama 연동 및 오류 처리**:
   - Exponential backoff 재시도 로직 (최대 3회)
   - `stream_ollama_with_retry` - 스트리밍 호출
   - `call_ollama_with_retry` - 동기 호출
   - JSON 점수 파싱 (3-tier fallback: 전체 JSON -> JSON 블록 -> 기본값)

5. **프롬프트 템플릿**:
   - Debater 프롬프트: Opening, Rebuttal (상대 발언 컨텍스트), Summary (전체 토론)
   - Judge 프롬프트: Intro, Scoring (Opening/Rebuttal/Summary), Verdict
   - Persona 인젝션 지원

6. **데이터베이스 통합**:
   - Turn 즉시 영속화
   - Run 상태 업데이트 (pending -> running -> completed/failed)
   - Run CRUD 서비스 (create_run, get_run_with_agents, update_run_status)

7. **API 엔드포인트**:
   - `POST /api/debate/start` - 토론 시작 (Run 생성, 에이전트 검증)
   - `GET /api/debate/stream/{run_id}` - SSE 스트리밍 실행

**결과 (Result)**:
- BP Lite 형식의 완전한 토론 실행 가능
- 실시간 토큰 스트리밍으로 프론트엔드 연동 준비 완료
- 채점 시스템 기본 구조 완성 (가중치 적용, 총점 계산)
- 오류 발생 시 자동 재시도 및 상태 복구

**관련 파일 (Related Files)**:
- `/backend/app/graph/state.py` - DebateState, Turn TypedDicts
- `/backend/app/graph/graph.py` - StateGraph 정의 (14 nodes)
- `/backend/app/graph/executor.py` - SSE 스트리밍 실행기
- `/backend/app/graph/nodes/debater.py` - 6개 Debater 노드 함수
- `/backend/app/graph/nodes/judge.py` - 7개 Judge 노드 함수
- `/backend/app/graph/nodes/utils.py` - 재시도 로직, JSON 파싱
- `/backend/app/graph/prompts/debater_prompts.py` - Debater 프롬프트 템플릿
- `/backend/app/graph/prompts/judge_prompts.py` - Judge 프롬프트 템플릿
- `/backend/app/services/run_crud.py` - Run CRUD 연산
- `/backend/app/models/schemas.py` - DebateStartRequest, DebateStartResponse
- `/backend/app/api/endpoints/debate.py` - POST /start, GET /stream/{run_id}
- `/backend/app/models/turn.py` - metadata_json 필드 수정 (SQLAlchemy 충돌 해결)

**Commit**: 3c85257 Phase 1-M1: Core backend implementation complete

### 2025-12-15: Phase 1-M1 Run API 완료 - Backend 100% 완성

**목표 (Goal)**:
Run 관리 API 구현으로 Phase 1-M1 백엔드 완성

**구현 내용 (Implementation)**:
1. **Run API 엔드포인트 (4개)**:
   - `GET /api/debate/runs` - Run 목록 조회 (최신순 정렬)
   - `GET /api/debate/runs/{run_id}` - Run 상세 조회 (에이전트 정보 포함)
   - `GET /api/debate/runs/{run_id}/turns` - Turn 목록 조회 (리플레이용)
   - `DELETE /api/debate/runs/{run_id}` - Run 삭제 (Turn 캐스케이드 삭제)

2. **데이터베이스 쿼리**:
   - `get_turns_by_run_id()` - Run의 모든 Turn 조회 (시간순)
   - 기존 CRUD 함수 활용 (get_all_runs, get_run_with_agents, delete_run)

3. **스키마 업데이트**:
   - `TurnResponse` - Turn 모델 필드에 맞게 수정 (agent_id, phase, role, content, targets, metadata_json, created_at)
   - `RunDetailResponse` - 에이전트 정보 포함한 상세 응답 (AgentResponse 임베딩)
   - `RunResponse` - Run 모델 필드 업데이트 (result_json, finished_at 추가)

4. **오류 처리**:
   - 404 Not Found - Run/Turn이 존재하지 않을 때
   - 적절한 HTTP 상태 코드 (200, 204, 404)
   - 명확한 에러 메시지

5. **Validation 수정**:
   - **Critical Fix**: `get_run_with_agents()` 에이전트 딕셔너리에 `created_at`, `updated_at` 필드 추가
   - AgentResponse 스키마 요구사항 충족
   - Pydantic 검증 오류 해결

**결과 (Result)**:
- Phase 1-M1 백엔드 100% 완성
- 모든 CRUD 작업 지원 (Create, Read, Update, Delete)
- 리플레이 기능을 위한 Turn 조회 가능
- 프론트엔드 연동 준비 완료

**관련 파일 (Related Files)**:
- `/backend/app/services/run_crud.py` - get_turns_by_run_id() 추가, 에이전트 필드 수정
- `/backend/app/models/schemas.py` - TurnResponse, RunDetailResponse 업데이트
- `/backend/app/api/endpoints/debate.py` - 4개 Run API 엔드포인트 구현

**Commits**:
- 92fd661 Phase 1-M1: Run API completion
- 5930c2e Fix critical validation issue in get_run_with_agents

### 2025-12-15: Phase 1-M1.8 Frontend Agent Module 완료

**목표 (Goal)**:
Phase 1.8 Frontend Agent Module 구현 - Agent CRUD, Preview SSE 스트리밍, TanStack Query 통합

**구현 내용 (Implementation)**:
1. **Infrastructure Layer**:
   - TypeScript 타입 정의 (`lib/types.ts`) - Backend Pydantic 스키마와 매칭
   - API Client (`lib/api-client.ts`) - 에러 핸들링 포함 fetch 래퍼
   - TanStack Query Provider (`app/providers.tsx`) - 전역 상태 관리 설정

2. **shadcn/ui 컴포넌트 추가**:
   - Select, Slider, Skeleton, Badge 설치
   - Button, Card, Input, Label, Textarea (기존 설치됨)

3. **Custom Hooks**:
   - `useAgents`, `useAgent`, `useCreateAgent`, `useUpdateAgent`, `useDeleteAgent`, `useCloneAgent` - Agent CRUD
   - `useOllamaModels`, `useOllamaStatus` - Ollama 서버 연동
   - `useAgentPreview` - SSE 스트리밍 (fetch + ReadableStream, POST body 지원)

4. **Agent 컴포넌트**:
   - `ModelSelector` - Ollama 모델 드롭다운 + 상태 배지
   - `PersonaEditor` - JSON 에디터 (실시간 검증)
   - `ParamsEditor` - LLM 파라미터 (temperature, max_tokens, top_p)
   - `AgentPreviewPanel` - SSE 스트리밍 프리뷰 (타이핑 효과)
   - `AgentEditor` - 통합 생성/수정 폼 (2-column 레이아웃)
   - `AgentCard` - Agent 카드 (Edit/Clone/Delete 액션)
   - `AgentList` - Agent 그리드 (loading/empty 상태)

5. **Pages (App Router)**:
   - `/agent` - Agent 목록 페이지
   - `/agent/new` - Agent 생성 페이지
   - `/agent/[agentId]/edit` - Agent 편집 페이지
   - `/agent/showcase` - Character Showcase (검색/필터)
   - `/agent/loading.tsx` - Loading skeleton

6. **Build 설정 수정**:
   - `next.config.ts` - experimental.turbo 및 eslint 제거 (Next.js 16 호환)
   - `tailwind.config.ts` - darkMode 배열 → 문자열 변경

**결과 (Result)**:
- Phase 1-M1 Frontend 완성 (100%)
- Agent CRUD 전체 플로우 작동 (생성, 조회, 수정, 삭제, 복제)
- SSE 스트리밍 프리뷰 작동 (실시간 토큰 표시)
- Build 성공, Dev server 테스트 완료
- TanStack Query 캐시 관리로 최적화된 데이터 페칭

**관련 파일 (Related Files)**:
- `/frontend/lib/types.ts` - TypeScript 타입 정의
- `/frontend/lib/api-client.ts` - API fetch 래퍼
- `/frontend/app/providers.tsx` - TanStack Query Provider
- `/frontend/app/layout.tsx` - Providers 래핑 추가
- `/frontend/hooks/use-agents.ts` - Agent CRUD hooks
- `/frontend/hooks/use-ollama-models.ts` - Ollama hooks
- `/frontend/hooks/use-agent-preview.ts` - SSE streaming hook
- `/frontend/components/agent/model-selector.tsx` - Model dropdown
- `/frontend/components/agent/persona-editor.tsx` - JSON editor
- `/frontend/components/agent/params-editor.tsx` - LLM parameters
- `/frontend/components/agent/agent-preview-panel.tsx` - SSE preview
- `/frontend/components/agent/agent-editor.tsx` - Main form
- `/frontend/components/agent/agent-card.tsx` - Agent card
- `/frontend/components/agent/agent-list.tsx` - Agent grid
- `/frontend/app/agent/page.tsx` - Agent list page
- `/frontend/app/agent/new/page.tsx` - Create agent page
- `/frontend/app/agent/[agentId]/edit/page.tsx` - Edit agent page
- `/frontend/app/agent/showcase/page.tsx` - Showcase page
- `/frontend/app/agent/loading.tsx` - Loading skeleton
- `/frontend/components/ui/select.tsx` - shadcn Select
- `/frontend/components/ui/slider.tsx` - shadcn Slider
- `/frontend/components/ui/skeleton.tsx` - shadcn Skeleton
- `/frontend/components/ui/badge.tsx` - shadcn Badge
- `/frontend/next.config.ts` - Next.js 설정 수정
- `/frontend/tailwind.config.ts` - Tailwind 설정 수정

**Commit**: 6a3113a Phase 1-M1.8: Frontend Agent Module complete

### 2025-12-15: Code Validation 및 Critical Fix

**목표 (Goal)**:
code-validator agent를 통한 Phase 1.8 구현 검증 및 critical issues 수정

**발견된 Critical Issues**:
1. **SSE Event Type Mismatch**: Frontend가 "token", "phase_end" 이벤트를 기대했으나 Backend는 "chunk", "done" 이벤트를 전송
2. **Memory Leak**: useAgentPreview hook에서 컴포넌트 unmount 시 cleanup 누락으로 인한 메모리 누수 가능성

**수정 내용 (Fixes)**:
1. `use-agent-preview.ts` - SSE 이벤트 타입을 backend와 매칭되도록 수정 ("chunk", "done" 사용)
2. `use-agent-preview.ts` - useEffect cleanup 추가하여 unmount 시 AbortController 정리
3. `api-client.ts`, `use-agent-preview.ts` - API URL을 환경변수(NEXT_PUBLIC_API_URL)로 변경

**검증 결과 (Validation Result)**:
- Critical issues 해결로 SSE streaming preview 정상 작동 확인
- 메모리 누수 방지 로직 추가로 안정성 향상
- 환경변수 사용으로 배포 환경 유연성 확보

**관련 파일 (Related Files)**:
- `/frontend/hooks/use-agent-preview.ts` - SSE 이벤트 타입 수정, cleanup 추가
- `/frontend/lib/api-client.ts` - 환경변수 사용

**Commit**: ae9339e Fix critical issues from code validation

---

### 2025-12-15: Phase 2.3 Arena UI 완료

**목표 (Goal)**:
Arena UI 개선 - 레이아웃 컴포넌트, 턴 인디케이터, 사이드 패널을 통한 토론 진행 상황 시각화

**구현 내용 (Implementation)**:

1. **Arena 상수 및 유틸리티** (constants.ts):
   - PHASE_ORDER: 14단계 debate phase 배열
   - PHASE_LABELS: 사용자 친화적 phase 이름
   - agentStyles: Agent별 일관된 테마 (Blue/Red/Purple)
   - NODE_DIMENSIONS: 레이아웃 상수
   - Helper 함수: getPhaseAgent, getPhaseProgress, getCompletedPhases

2. **ArenaLayout 컴포넌트** (arena-layout.tsx):
   - 유연한 그리드 레이아웃
   - Header, TurnIndicator, Main Content, Side Panel 슬롯 구조
   - 반응형 2-column 레이아웃

3. **TurnIndicator 컴포넌트** (turn-indicator.tsx):
   - Agent 아바타 (이니셜 + 컬러 원형)
   - 수평 세그먼트 진행 바 (14단계)
   - 활성 스피커 glow 애니메이션
   - Phase 카운트 표시 (예: "3/14")
   - Judge 활성화 표시

4. **ActionSidePanel 컴포넌트** (action-side-panel/):
   - 탭 기반 컨테이너 (Scores, Progress, Log)
   - 접이식 패널 (토글 버튼)
   - LocalStorage 상태 저장

5. **ScoreDisplay 컴포넌트** (score-display.tsx):
   - Agent A vs B 점수 비교
   - Opening/Rebuttal/Summary 점수 진행 바
   - 총점 및 리딩 인디케이터
   - 실시간 업데이트, useMemo 최적화

6. **ProgressIndicator 컴포넌트** (progress-indicator.tsx):
   - 수직 스테퍼 (14단계)
   - 상태 아이콘: 완료(체크마크), 진행중(스피너), 대기(원형)
   - Agent별 컬러 인디케이터

7. **DebateLog 컴포넌트** (debate-log.tsx):
   - Phase별 로그 표시
   - 상태 아이콘 및 콘텐츠 미리보기 (50자)
   - 스크롤 가능 (max-height 400px)

8. **ArenaFlowView 컴포넌트** (arena-flow-view.tsx):
   - React Flow와 Arena UI 통합
   - useDebateFlow 훅 상태 관리
   - 유연한 높이 컨테이너
   - localStorage 접근 try-catch

9. **코드 품질 개선**:
   - 미사용 변수 제거
   - ScoreBar 컴포넌트 추출 및 메모이제이션
   - useMemo로 점수 계산 최적화
   - 모든 컴포넌트 prop 인터페이스 export
   - FlowProvider 의존성 주석 추가
   - 유연한 컨테이너 높이
   - localStorage 에러 핸들링

**결과 (Result)**:
- Phase 2.3 완료로 Phase 2 전체 진행률 75% 달성
- Arena UI가 실시간 토론 진행 상황을 시각적으로 표시
- Text/Flow 뷰 토글과 통합된 사이드 패널 제공
- 점수, 진행 상황, 로그를 탭으로 구분하여 효율적인 정보 제공
- 코드 품질 개선으로 유지보수성 향상

**관련 파일 (Related Files)**:
- `/frontend/components/arena/constants.ts` - 상수 및 유틸리티
- `/frontend/components/arena/arena-layout.tsx` - 메인 레이아웃
- `/frontend/components/arena/turn-indicator.tsx` - 턴 인디케이터
- `/frontend/components/arena/action-side-panel/index.tsx` - 사이드 패널 컨테이너
- `/frontend/components/arena/action-side-panel/score-display.tsx` - 점수 표시
- `/frontend/components/arena/action-side-panel/progress-indicator.tsx` - 진행 상황
- `/frontend/components/arena/action-side-panel/debate-log.tsx` - 토론 로그
- `/frontend/components/arena/arena-flow-view.tsx` - 통합 Flow 뷰
- `/frontend/components/arena/index.ts` - Barrel export
- `/frontend/app/debate/arena/[runId]/page.tsx` - Arena 페이지 리팩토링
- `/frontend/components/ui/tabs.tsx` - shadcn/ui Tabs 컴포넌트

**Commits**:
- `16827d7` Phase 2.3: Arena UI complete
- `bb4e8a8` Phase 2.3: Code quality improvements from validator
- `460052d` docs: Update documentation for Phase 2.3 completion

---

### 2025-12-15: Phase 2.5 Judging System Frontend 완료

**목표 (Goal)**:
Judging System Frontend 구현 - 점수 카드, 판정 패널, SSE 이벤트 처리

**구현 내용 (Implementation)**:

1. **ScoreCard 컴포넌트** (score-card.tsx):
   - Phase별 점수 표시 (opening, rebuttal, summary)
   - 점수 카테고리: argumentation, rebuttal, delivery, strategy, total
   - 프로그레스 바로 시각화
   - Agent별 컬러 테마 (Blue/Red)
   - 스트리밍 상태 표시
   - ScoreRow 메모이제이션

2. **VerdictPanel 컴포넌트** (verdict-panel.tsx):
   - 승자 발표 (Trophy/Scale 아이콘)
   - ScoreComparisonBar: A vs B 퍼센티지 시각화
   - 최종 점수 표시
   - Judge's Analysis 섹션
   - 스트리밍 상태 ("Deliberating...")

3. **VerdictDisplay 컴포넌트** (verdict-display.tsx):
   - ActionSidePanel용 컴팩트 판정 표시
   - React Flow 노드에서 verdict 데이터 추출
   - Score 노드에서 최종 점수 계산
   - 4번째 탭으로 ActionSidePanel에 통합

4. **DebateStreamView 업데이트** (debate-stream-view.tsx):
   - parsedScores: useMemo로 점수 파싱 (A/B별 opening/rebuttal/summary)
   - parsedVerdict: useMemo로 winner 추출 (텍스트 파싱)
   - VerdictPanel 및 ScoreCard 컴포넌트 통합
   - final_scores 처리

5. **ActionSidePanel 업데이트** (action-side-panel/index.tsx):
   - TabsList grid-cols-4로 변경
   - Verdict 탭 추가
   - VerdictDisplay 통합

6. **Barrel Export 업데이트** (arena/index.ts):
   - score-card, verdict-panel export 추가

**결과 (Result)**:
- Phase 2.5 완료로 Phase 2 (M2) 100% 달성
- 실시간 점수 및 판정 시각화 완성
- 두 가지 뷰 모드 모두에서 점수/판정 표시:
  - Text View: DebateStreamView의 ScoreCard/VerdictPanel
  - Flow View: ActionSidePanel의 VerdictDisplay
- TypeScript 빌드 성공

**관련 파일 (Related Files)**:
- `/frontend/components/arena/score-card.tsx` - 점수 카드 (신규)
- `/frontend/components/arena/verdict-panel.tsx` - 판정 패널 (신규)
- `/frontend/components/arena/action-side-panel/verdict-display.tsx` - 사이드패널 판정 (신규)
- `/frontend/components/arena/action-side-panel/index.tsx` - 4탭 구조로 수정
- `/frontend/components/arena/index.ts` - export 추가
- `/frontend/components/debate/debate-stream-view.tsx` - 점수/판정 파싱 및 통합

**Commits**:
- `2ec4701` Phase 2.5: Judging System Frontend complete
- `ad64c1c` fix: Remove unused PHASE_LABELS import from score-card

---

### 2025-12-15: Phase 3.3 Error Handling UI 완료

**목표 (Goal)**:
Toast notification 시스템 구현 - 사용자에게 명확한 에러 알림 제공

**구현 내용 (Implementation)**:

1. **Sonner 라이브러리 통합**:
   - sonner 패키지 설치 (`npm install sonner`)
   - shadcn/ui 권장 toast 라이브러리
   - 자동 닫힘, 스택형 알림, 닫기 가능한 UI
   - richColors 테마 적용

2. **Root Layout 설정** (app/layout.tsx):
   - Toaster 컴포넌트 추가
   - 위치: top-right
   - richColors prop으로 색상 코딩

3. **Toast Error Hooks**:
   - DebateStreamView (debate-stream-view.tsx):
     - SSE 스트리밍 에러 시 toast 표시
     - 기존 인라인 에러 표시 유지
   - ArenaFlowView (arena-flow-view.tsx):
     - 실시간 Flow 스트리밍 에러 시 toast 표시
     - Panel의 작은 텍스트보다 더 눈에 띄는 알림
   - AgentPreviewPanel (agent-preview-panel.tsx):
     - Preview 생성 실패 시 toast 표시
   - AgentEditor (agent-editor.tsx):
     - Create/Update mutation 실패 시 toast 표시
     - createMutation.error 및 updateMutation.error 모니터링

4. **일관된 에러 처리 패턴**:
   - 모든 컴포넌트에서 useEffect로 error 상태 감지
   - toast.error() 호출 시 5초 duration 설정
   - 인라인 에러 표시는 백업으로 유지

**결과 (Result)**:
- Phase 3.3 완료로 Phase 3 (M3) 42% 달성
- 모든 주요 컴포넌트에서 에러 발생 시 눈에 띄는 toast 알림 표시
- 사용자가 에러를 놓치지 않도록 개선
- 닫기 가능한 알림으로 사용자 경험 향상
- TypeScript 빌드 성공

**관련 파일 (Related Files)**:
- `/frontend/app/layout.tsx` - Toaster 컴포넌트 추가
- `/frontend/components/debate/debate-stream-view.tsx` - SSE 에러 toast
- `/frontend/components/arena/arena-flow-view.tsx` - Flow 에러 toast
- `/frontend/components/agent/agent-preview-panel.tsx` - Preview 에러 toast
- `/frontend/components/agent/agent-editor.tsx` - CRUD 에러 toast
- `/frontend/package.json` - sonner 의존성 추가

---

### 2025-12-15: Phase 2.1 React Flow Basic Integration 완료

**목표 (Goal)**:
React Flow를 사용한 debate 시각화 기본 구현 - 커스텀 노드/엣지, Dagre 레이아웃, SSE 스트리밍 연동

**구현 내용 (Implementation)**:
1. **Flow 타입 시스템** (flow-types.ts)
   - DebateFlowNode, DebateFlowEdge 유니온 타입 정의
   - 7개 노드 데이터 인터페이스 (TopicNodeData, DebateNodeData, ScoreNodeData, VerdictNodeData)
   - 14개 debate phase를 7개 노드 타입으로 매핑 (nodeTypeMap)
   - Record<string, unknown> 확장으로 React Flow 타입 호환성 보장

2. **레이아웃 유틸리티** (layout.ts)
   - @dagrejs/dagre 라이브러리 통합
   - getLayoutedElements() 함수로 자동 그래프 레이아웃
   - 설정 가능한 방향(TB/LR), 노드 크기, 간격

3. **노드 팩토리** (node-factory.ts)
   - createInitialNodes(): 초기 topic 노드 생성
   - createPhaseNode(): phase별 노드 동적 생성
   - createSequenceEdges(): 단계별 순차 엣지 생성
   - createTargetEdges(): 반박 타겟 엣지 생성

4. **베이스 노드 컴포넌트** (base-debate-node.tsx)
   - Agent별 색상 테마 (Blue: Agent A, Red: Agent B, Purple: Judge)
   - 스트리밍 애니메이션 (펄스 효과)
   - 완료 상태 표시
   - React Flow Handle (source/target) 통합

5. **7개 커스텀 노드**:
   - TopicNode: 토론 주제 표시
   - JudgeIntroNode: 심판 소개
   - OpeningNode: 입론 (포지션 배지 포함)
   - RebuttalNode: 반론
   - SummaryNode: 요약
   - ScoreNode: 점수 표시 (argumentation, rebuttal, delivery, strategy)
   - VerdictNode: 최종 판정 (승자 배지)

6. **2개 커스텀 엣지**:
   - SequenceEdge: 순차 연결 (smooth-step, solid)
   - TargetEdge: 반박 대상 (bezier, dashed, orange)

7. **useDebateFlow 훅** (use-debate-flow.ts)
   - React Flow 상태 관리 (useNodesState, useEdgesState)
   - SSE 이벤트 핸들러:
     * handlePhaseStart: 새 노드 생성 및 레이아웃 재계산
     * handleToken: 노드 콘텐츠 실시간 업데이트
     * handlePhaseEnd: 노드 완료 상태 마킹
     * handleScore: 점수 데이터 업데이트
     * handleVerdict: 승자 및 분석 업데이트
   - Type assertion으로 DebateFlowNode[] 타입 안정성 유지

8. **Flow 컴포넌트**:
   - FlowProvider: ReactFlowProvider 래퍼
   - DebateFlowCanvas: 메인 시각화 캔버스
     * Background, Controls, MiniMap 통합
     * 상태 패널 (Live/Completed, 현재 phase)
     * fitView 자동 조정

9. **Arena 페이지 통합**:
   - Text/Flow 뷰 전환 토글 (AlignLeft/LayoutGrid 아이콘)
   - useDebateStream 훅 연동
   - 조건부 렌더링

**TypeScript 타입 이슈 해결**:
- Node/Edge 데이터 인터페이스에 `extends Record<string, unknown>` 추가
- nodeTypes/edgeTypes 레지스트리에 `any` 타입 사용 (eslint-disable)
- 개별 노드 컴포넌트 prop 타입을 `{ data: T }` 형식으로 단순화
- 개별 엣지 컴포넌트 prop 타입을 `any`로 설정
- setNodes 콜백에 `as DebateFlowNode[]` 타입 assertion 추가

**결과 (Result)**:
- React Flow 기반 debate 시각화 완전 통합 (22 files)
- SSE 스트리밍과 실시간 그래프 업데이트 연동
- Text/Flow 뷰 전환으로 사용자 경험 향상
- TypeScript 빌드 성공적으로 완료
- Agent별 색상 테마로 가독성 향상

**관련 파일 (Related Files)**:
- `/frontend/components/flow/utils/flow-types.ts` - 타입 정의
- `/frontend/components/flow/utils/layout.ts` - Dagre 레이아웃
- `/frontend/components/flow/utils/node-factory.ts` - 노드/엣지 생성
- `/frontend/components/flow/nodes/base-debate-node.tsx` - 베이스 노드
- `/frontend/components/flow/nodes/{topic,judge-intro,opening,rebuttal,summary,score,verdict}-node.tsx` - 7개 노드
- `/frontend/components/flow/nodes/index.ts` - 노드 레지스트리
- `/frontend/components/flow/edges/{sequence,target}-edge.tsx` - 2개 엣지
- `/frontend/components/flow/edges/index.ts` - 엣지 레지스트리
- `/frontend/components/flow/flow-provider.tsx` - Provider
- `/frontend/components/flow/debate-flow-canvas.tsx` - 캔버스
- `/frontend/components/flow/index.ts` - Barrel export
- `/frontend/hooks/use-debate-flow.ts` - Flow 상태 훅
- `/frontend/app/debate/arena/[runId]/page.tsx` - 뷰 토글 통합
- `/frontend/app/globals.css` - React Flow 스타일
- `/frontend/package.json`, `/frontend/package-lock.json` - @dagrejs/dagre 추가

**Commit**: 5fc4e16 Phase 2.1: React Flow Basic Integration complete

---

### 2025-12-15: Phase 3.1 Replay Feature 완료

**목표 (Goal)**:
완료된 토론의 리플레이 기능 구현 - 재생 컨트롤, 속도 조절, 타임라인 네비게이션

**구현 내용 (Implementation)**:

1. **use-debate-replay 훅** (hooks/use-debate-replay.ts):
   - 핵심 리플레이 상태 관리 (playing, currentPhaseIndex, displayedContent)
   - 문자 단위 스트리밍 시뮬레이션 (requestAnimationFrame 기반)
   - 속도 조절 지원 (0.5x: 60ms, 1x: 30ms, 2x: 15ms 간격)
   - Turn 데이터로부터 그래프 상태 재구성
   - Phase 네비게이션: goToPhase, goToPrevious, goToNext
   - 자동 재생 및 수동 일시정지 기능

2. **ReplayControls 컴포넌트** (components/arena/replay-controls.tsx):
   - Play/Pause 토글 버튼 (Play/Pause 아이콘)
   - 속도 선택 드롭다운 (Select 컴포넌트)
   - Previous/Next 버튼 (ChevronLeft/ChevronRight 아이콘)
   - 경계 조건에 따른 버튼 비활성화
   - Phase 카운터 표시 (예: "3/14")

3. **ReplayTimeline 컴포넌트** (components/arena/replay-timeline.tsx):
   - 클릭 가능한 Phase 세그먼트
   - 완료/현재/대기 상태 시각화
   - Agent별 컬러 마커 (Blue/Red/Purple)
   - 호버 효과 및 커서 포인터

4. **ArenaReplayView 컴포넌트** (components/arena/arena-replay-view.tsx):
   - ReplayControls + ReplayTimeline 통합
   - React Flow 캔버스와 재구성된 그래프 상태 연동
   - 리플레이 상태에 따른 노드/엣지 업데이트

5. **Arena 페이지 업데이트** (app/debate/arena/[runId]/page.tsx):
   - Replay 모드 토글 (완료된 Run에서만 활성화)
   - useRunTurns 훅으로 Turn 데이터 로딩
   - TurnIndicator에 mode prop 추가 (live/replay)
   - 조건부 렌더링 (Live View vs Replay View)

6. **타입 정의 업데이트** (lib/types.ts):
   - ReplaySpeed 타입 추가: 0.5 | 1 | 2

7. **컴포넌트 Export 업데이트** (components/arena/index.ts):
   - ReplayControls, ReplayTimeline, ArenaReplayView export 추가

**결과 (Result)**:
- Phase 3.1 완료로 Phase 3 (M3) 진행률 20% 달성
- 완료된 토론을 원하는 속도로 다시 볼 수 있음
- 문자 단위 스트리밍으로 라이브 토론과 유사한 경험 제공
- 타임라인 클릭으로 특정 단계로 즉시 이동 가능
- TypeScript 빌드 성공

**관련 파일 (Related Files)**:
- `/frontend/hooks/use-debate-replay.ts` - 핵심 리플레이 훅 (신규)
- `/frontend/components/arena/replay-controls.tsx` - 재생 컨트롤 (신규)
- `/frontend/components/arena/replay-timeline.tsx` - 타임라인 (신규)
- `/frontend/components/arena/arena-replay-view.tsx` - 리플레이 뷰 (신규)
- `/frontend/app/debate/arena/[runId]/page.tsx` - 리플레이 모드 토글 추가
- `/frontend/components/arena/action-side-panel/index.tsx` - replayTimeline prop 추가
- `/frontend/components/arena/turn-indicator.tsx` - mode prop 추가
- `/frontend/components/arena/index.ts` - export 추가
- `/frontend/lib/types.ts` - ReplaySpeed 타입 추가

---

### 2025-12-15: Phase 3.6 Judge Fairness (Swap Test) 완료

**목표 (Goal)**:
Position 교체 테스트를 통한 Judge 공정성 검증 시스템 구현 (일관성 점수 제외)

**구현 내용 (Implementation)**:

1. **Backend API 엔드포인트** (backend/app/api/endpoints/debate.py):
   - `POST /runs/{id}/swap`: 완료된 Run의 Position 교체하여 새 토론 생성
   - `GET /runs/{id}/compare/{swap_id}`: 두 Run 비교 및 편향 분석
   - `_analyze_position_bias()`: Position 편향 감지 로직

2. **Frontend API Client 업데이트** (frontend/lib/api-client.ts):
   - `createSwapTest()`: Swap Test 생성 API 호출
   - `getSwapComparison()`: 비교 결과 조회
   - 타입 정의: `BiasAnalysis`, `RunComparison`, `SwapComparisonResponse`

3. **Hooks 추가** (frontend/hooks/use-debate.ts):
   - `useCreateSwapTest()`: Swap Test 생성 mutation
   - `useSwapComparison()`: 비교 결과 조회 query

4. **SwapTestButton 컴포넌트** (frontend/components/arena/swap-test-button.tsx):
   - 완료된 Run에서만 표시
   - 클릭 시 새 토론 생성 및 Arena 페이지로 이동
   - URL에 `?original=` 파라미터로 원본 Run ID 전달

5. **SwapComparisonView 컴포넌트** (frontend/components/arena/swap-comparison-view.tsx):
   - Original vs Swapped 결과 비교 그리드
   - Position 편향 분석 결과 표시 (bias/none/inconclusive)
   - 색상 코딩: 녹색(no bias), 노란색(bias), 회색(inconclusive)

6. **Arena 페이지 통합** (frontend/app/debate/arena/[runId]/page.tsx):
   - `useSearchParams`로 `?original=` 파라미터 처리
   - SwapTestButton 헤더에 추가
   - SwapComparisonView 페이지 하단에 조건부 표시

**편향 분석 로직**:
- 같은 Position이 두 번 다 승리 → Position 편향 감지
- 다른 Position이 승리 (같은 Agent 승리) → 편향 없음 (실력 차이)
- DRAW 포함 시 → 결론 불가

**제외 사항**:
- 일관성 점수 계산 (개별 토론의 가변성은 게임성의 일부로 유지)

**결과 (Result)**:
- Phase 3 (M3) 100% 완료
- Position 교체 후 재실행으로 Judge 공정성 검증 가능
- 시각적 비교 리포트로 편향 여부 즉시 확인
- TypeScript 빌드 성공

**관련 파일 (Related Files)**:
- `/backend/app/api/endpoints/debate.py` - Swap Test 및 Compare 엔드포인트 추가
- `/frontend/lib/api-client.ts` - API 함수 및 타입 추가
- `/frontend/hooks/use-debate.ts` - Hooks 추가
- `/frontend/components/arena/swap-test-button.tsx` - 신규
- `/frontend/components/arena/swap-comparison-view.tsx` - 신규
- `/frontend/app/debate/arena/[runId]/page.tsx` - 통합

---

### 2025-12-15: Phase 3.4 Character Showcase Enhancement 완료

**목표 (Goal)**:
Character Showcase 페이지 개선 - Agent 상세 정보 드로어 및 모델 필터 기능 추가

**구현 내용 (Implementation)**:

1. **shadcn/ui Sheet 컴포넌트 설치**:
   - `npx shadcn@latest add sheet`
   - Radix UI Dialog 기반 슬라이드 패널

2. **AgentGalleryCard 컴포넌트** (components/agent/agent-gallery-card.tsx):
   - 클릭 포커스 카드 (기존 AgentCard는 액션 포커스)
   - hover:shadow-lg, hover:border-primary/50 효과
   - Role, Style, Tone 미리보기 표시

3. **AgentDetailDrawer 컴포넌트** (components/agent/agent-detail-drawer.tsx):
   - Sheet 기반 슬라이드 아웃 패널 (540px width)
   - Persona 상세 정보 (2-column grid)
   - Parameters 상세 정보 (3-column grid)
   - AgentPreviewPanel 통합 (SSE 스트리밍 프리뷰)
   - 액션 버튼: Edit Agent, Use in Debate

4. **Showcase 페이지 업데이트** (app/agent/showcase/page.tsx):
   - AgentCard → AgentGalleryCard 교체
   - 카드 클릭 시 AgentDetailDrawer 열기
   - 모델 필터 Badge 추가 (All + 각 모델별)
   - 결과 카운트에 필터 정보 표시

5. **컴포넌트 Barrel Export** (components/agent/index.ts):
   - 모든 agent 컴포넌트 export 파일 생성

**결과 (Result)**:
- Phase 3.4 완료로 Phase 3 (M3) 진행률 80% 달성
- 에이전트 갤러리에서 클릭하여 상세 정보 확인 가능
- 드로어 내에서 바로 프리뷰 테스트 실행 가능
- 모델별 필터링으로 빠른 탐색 지원
- TypeScript 빌드 성공

**관련 파일 (Related Files)**:
- `/frontend/components/ui/sheet.tsx` - shadcn/ui Sheet (신규)
- `/frontend/components/agent/agent-gallery-card.tsx` - 갤러리 카드 (신규)
- `/frontend/components/agent/agent-detail-drawer.tsx` - 상세 드로어 (신규)
- `/frontend/components/agent/index.ts` - Barrel export (신규)
- `/frontend/app/agent/showcase/page.tsx` - 페이지 업데이트

---

### 2025-12-15: Phase 3.2 Rule Violation Detection 완료

**목표 (Goal)**:
BP Lite 토론 규칙 위반 감지 시스템 구현 - Forbidden Phrase 감지 및 Summary 새 논거 감지

**구현 내용 (Implementation)**:

1. **Hybrid Detection 접근법**:
   - Rule-based: 문자열 매칭으로 forbidden phrases 사전 감지
   - LLM-based: Summary에서 새 논거 감지는 Judge LLM에 위임
   - Scoring-time detection: 발언 후 채점 시점에 위반 검사

2. **detect_forbidden_phrases() 유틸리티** (backend/app/graph/nodes/utils.py):
   - 대소문자 무시 문자열 매칭
   - 위반 발견 시 전후 30자 컨텍스트 추출
   - 다중 발생 감지 (같은 phrase가 여러 번 등장할 경우 모두 기록)
   - 반환값: `[{"phrase": "...", "context": "...context..."}]`

3. **Judge 채점 프롬프트 업데이트** (backend/app/graph/prompts/judge_prompts.py):
   - `build_scoring_prompt_opening()`: forbidden_phrases, detected_violations 파라미터 추가
   - `build_scoring_prompt_rebuttal()`: 동일하게 업데이트
   - `build_scoring_prompt_summary()`: forbidden_phrases + 기존 new_arguments 감지 통합
   - JSON 응답 구조에 `forbidden_phrase_penalty`, `forbidden_phrases_detected` 필드 추가

4. **6개 채점 노드 업데이트** (backend/app/graph/nodes/judge.py):
   - `score_opening_a`, `score_opening_b`: forbidden phrases 감지 및 프롬프트 전달
   - `score_rebuttal_a`, `score_rebuttal_b`: 동일하게 업데이트
   - `score_summary_a`, `score_summary_b`: forbidden + new_arguments 모두 처리
   - 모든 노드에서 `turn["metadata"]["forbidden_phrases_detected"]`에 위반 저장

5. **페널티 구조**:
   - Forbidden phrase: -2점 per violation
   - New arguments in Summary: -5점 (기존 로직 유지)
   - 페널티는 Judge LLM이 total에 반영

**결과 (Result)**:
- Phase 3.2 완료로 Phase 3 (M3) 진행률 60% 달성
- Persona의 forbidden_phrases 필드가 실제로 채점에 영향을 미침
- Summary 단계에서 새 논거 제시 시 페널티 적용
- 위반 정보가 turn metadata에 저장되어 추후 UI 표시 가능
- Python 문법 검증 완료, 함수 테스트 성공

**관련 파일 (Related Files)**:
- `/backend/app/graph/nodes/utils.py` - detect_forbidden_phrases() 함수 추가
- `/backend/app/graph/prompts/judge_prompts.py` - 3개 채점 프롬프트 업데이트
- `/backend/app/graph/nodes/judge.py` - 6개 채점 노드 업데이트

---

### 2025-12-15: Phase 4.1 Testing Infrastructure 완료

**목표 (Goal)**:
프로젝트 품질 보증을 위한 포괄적인 테스트 인프라 구축 - Backend pytest, Frontend Vitest 기반

**구현 내용 (Implementation)**:

1. **Backend 테스트 인프라**:
   - `pytest.ini`: asyncio_mode=auto 설정으로 async 테스트 지원
   - `tests/conftest.py`: 공유 픽스처 정의
     * `mock_db`: AsyncSession 모킹
     * `sample_agent`: Agent 테스트 데이터
     * `sample_run`: Run 테스트 데이터
     * `sample_turn`: Turn 테스트 데이터 (수정 후 추가)

2. **Backend 서비스 테스트 (23 tests)**:
   - `test_agent_crud.py` (7 tests): create, get_all, get_by_id, update, delete, clone, not_found
   - `test_run_crud.py` (8 tests): create, get_all, get_by_id, get_with_agents, update_status, delete, get_turns_by_run_id
   - `test_ollama.py` (8 tests): get_models, get_status, call_ollama, stream_ollama, errors

3. **Backend API 테스트 (16 tests)**:
   - `test_agents_api.py` (9 tests): GET/POST/PUT/DELETE endpoints, clone, preview
   - `test_debate_api.py` (7 tests): start, stream, runs, run_detail, run_turns, compare_swap_test

4. **Frontend 테스트 인프라**:
   - `vitest.config.ts`: jsdom 환경, path aliases, setup file 설정
   - `tests/setup.ts`: 글로벌 모킹 (next/navigation, sonner)
   - Test scripts: `npm run test`, `npm run test:run`, `npm run test:coverage`

5. **Frontend Hook 테스트 (24 tests)**:
   - `use-agents.test.tsx` (11 tests): useAgents, useAgent, useCreateAgent, useUpdateAgent, useDeleteAgent, useCloneAgent
   - `use-debate.test.tsx` (13 tests): useStartDebate, useRuns, useRun, useRunTurns, useCreateSwapTest, useSwapComparison

6. **Frontend 컴포넌트 테스트 (17 tests)**:
   - `agent-card.test.tsx` (9 tests): rendering, actions, clone, delete
   - `debate-setup-form.test.tsx` (8 tests): rendering, validation, submission

7. **테스트 품질 개선** (commit 0fc0f04):
   - dict lookup 패턴으로 fragile side_effect 순서 의존성 제거
   - 전체 응답 검증으로 weak assertions 강화
   - 완전한 mock 데이터 제공으로 unsafe type cast 방지
   - Turn fixture 추가로 get_turns_by_run_id 테스트 가능

**결과 (Result)**:
- Backend: ~47 tests across 5 test files - All passing
- Frontend: 48 tests across 4 test files - All passing
- Build 검증 완료 (TypeScript 컴파일 에러 없음)
- 테스트 커버리지 기반으로 향후 리팩토링 안정성 확보

**관련 파일 (Related Files)**:
- `/backend/pytest.ini` - Pytest 설정
- `/backend/tests/conftest.py` - 공유 픽스처
- `/backend/tests/services/test_agent_crud.py` - Agent 서비스 테스트
- `/backend/tests/services/test_run_crud.py` - Run 서비스 테스트
- `/backend/tests/services/test_ollama.py` - Ollama 서비스 테스트
- `/backend/tests/api/test_agents_api.py` - Agent API 테스트
- `/backend/tests/api/test_debate_api.py` - Debate API 테스트
- `/frontend/vitest.config.ts` - Vitest 설정
- `/frontend/tests/setup.ts` - 테스트 셋업
- `/frontend/tests/hooks/use-agents.test.tsx` - Agent Hook 테스트
- `/frontend/tests/hooks/use-debate.test.tsx` - Debate Hook 테스트
- `/frontend/tests/components/agent-card.test.tsx` - AgentCard 테스트
- `/frontend/tests/components/debate-setup-form.test.tsx` - DebateSetupForm 테스트
- `/frontend/package.json` - 테스트 스크립트 추가

**Commits**:
- `2b20692` Phase 4.1: Testing Infrastructure complete
- `0fc0f04` fix: Improve Phase 4.1 test coverage and quality

---

### 2025-12-15: Phase 4.2 Performance Optimization 완료

**목표 (Goal)**:
장시간 토론(2-5분) 시 연결 안정성 및 렌더링 성능 최적화

**구현 내용 (Implementation)**:

1. **SSE Keep-Alive (Backend)**:
   - `backend/app/graph/executor.py`에 heartbeat 이벤트 추가
   - 15초 간격으로 `heartbeat` 이벤트 전송
   - Proxy/네트워크 타임아웃 방지 (긴 토론 중 연결 유지)
   - 이벤트 형식: `event: heartbeat\ndata: {"timestamp": "..."}\n\n`

2. **SSE Reconnection (Frontend)**:
   - `frontend/hooks/use-debate-stream.ts` 업데이트
   - Exponential backoff 재연결: 1초 → 2초 → 4초 (최대 3회)
   - Heartbeat 수신 시 연결 타임아웃 리셋
   - 재연결 상태 추적 및 에러 처리 개선

3. **Token Update Batching**:
   - `frontend/hooks/use-debate-flow.ts` 업데이트
   - requestAnimationFrame 기반 토큰 배치 처리
   - 렌더링 빈도 감소: 100+/sec → ~60/sec (frame-rate limited)
   - 연속 토큰을 단일 프레임에서 일괄 업데이트

4. **Incremental Layout**:
   - `frontend/components/flow/utils/layout.ts`에 `getIncrementalNodePosition()` 함수 추가
   - 새 노드 추가 시 O(1) 위치 계산 vs O(n^2) dagre 전체 재계산
   - 기존 노드 위치 기반 간단한 오프셋 계산
   - 대규모 그래프에서 성능 향상

**결과 (Result)**:
- Frontend: 48 tests passing (기존 테스트 영향 없음)
- Frontend build: Compiled successfully
- Backend CRUD tests: 17/17 passing
- 장시간 토론에서 연결 안정성 확보
- 실시간 스트리밍 시 부드러운 렌더링

**관련 파일 (Related Files)**:
- `/backend/app/graph/executor.py` - SSE heartbeat 구현
- `/frontend/hooks/use-debate-stream.ts` - 재연결 로직 및 heartbeat 처리
- `/frontend/hooks/use-debate-flow.ts` - 토큰 배치 처리
- `/frontend/components/flow/utils/layout.ts` - Incremental layout 함수

---

[Unreleased]: https://github.com/your-repo/vs-arena/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/your-repo/vs-arena/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/your-repo/vs-arena/releases/tag/v0.1.0

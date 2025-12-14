# Changelog

All notable changes to VS Arena project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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

### Fixed
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

[Unreleased]: https://github.com/your-repo/vs-arena/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/your-repo/vs-arena/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/your-repo/vs-arena/releases/tag/v0.1.0

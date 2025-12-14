# VS Arena - Development TODO

> PRD v1.4 기반 개발 실행 계획

---

## Progress Summary

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 0: Setup | **Completed** | 100% |
| Phase 1: M1 - Backend | **Completed** | 100% |
| Phase 1: M1 - Frontend | Not Started | 0% |
| Phase 2: M2 | Not Started | 0% |
| Phase 3: M3 | Not Started | 0% |
| Phase 4: Polish | Not Started | 0% |

---

## Phase 0: Project Setup [COMPLETED]

### 0.1 Environment Setup
- [x] 프로젝트 디렉토리 구조 (backend, frontend, docker, docs)
- [x] Backend: Python 3.12+, FastAPI 0.124.4, LangGraph 0.6.11, SQLAlchemy 2.0.45
- [x] Frontend: Next.js 16.0.10, React 19.2.3, TypeScript 5.9.3, Tailwind CSS 4.1.18
- [x] Database: PostgreSQL 17 Docker, agents/runs/turns 테이블
- [x] shadcn/ui, TanStack Query 5.90.12, React Flow 12.10.0

### 0.2 Development Tools
- [x] Docker Compose (PostgreSQL 17)
- [x] Hot reload (uvicorn --reload, next dev --turbopack)
- [ ] API 테스트 환경 (Bruno/Thunder Client)

---

## Phase 1: M1 - Core Foundation

### Backend [COMPLETED]

#### 1.1 Database Schema
- [x] Agents, Runs, Turns 테이블
- [x] 인덱스 (idx_turns_run_id, idx_turns_phase)

#### 1.2 Ollama Integration
- [x] `GET /api/ollama/models`, `GET /api/ollama/status`
- [x] `call_ollama()`, `stream_ollama()` 클라이언트

#### 1.3 Agent CRUD API
- [x] `GET/POST /api/agents`, `GET/PUT/DELETE /api/agents/{id}`
- [x] `POST /api/agents/{id}/clone`

#### 1.4 Agent Preview API
- [x] `POST /api/agents/preview` - SSE 스트리밍 1-Turn 테스트

#### 1.5 LangGraph Flow
- [x] 14노드 BP Lite StateGraph (6 debater, 7 judge, 1 verdict)
- [x] 프롬프트 템플릿 (Opening, Rebuttal, Summary, Judge)

#### 1.6 Debate API
- [x] `POST /api/debate/start`
- [x] `GET /api/debate/stream/{run_id}` - SSE 스트리밍
- [x] `GET /api/debate/runs`, `GET /api/debate/runs/{id}`
- [x] `GET /api/debate/runs/{id}/turns`, `DELETE /api/debate/runs/{id}`

#### 1.7 SSE Events
- [x] `phase_start`, `token`, `phase_end`, `score`, `verdict`, `run_complete`, `error`
- [ ] 연결 관리 (keep-alive, reconnect)

### Frontend [NOT STARTED]

#### 1.8 Agent Module
- [ ] `app/agent/page.tsx` - Agent 목록
- [ ] `app/agent/new/page.tsx` - Agent 생성
- [ ] `app/agent/[agentId]/edit/page.tsx` - Agent 편집
- [ ] AgentList, AgentCard, AgentEditor, AgentPreviewPanel 컴포넌트

#### 1.9 Debate Setup
- [ ] `app/debate/page.tsx` - Debate 설정
- [ ] `app/debate/arena/[runId]/page.tsx` - Arena
- [ ] DebateSetupForm, AgentPicker, Rubric 설정 UI

---

## Phase 2: M2 - Visualization & Judging

### 2.1 React Flow Integration
- [ ] DebateFlowCanvas, Custom Node/Edge 타입
- [ ] Auto-layout (dagre/elk)

### 2.2 Real-time Graph Update
- [ ] SSE 이벤트 핸들러, 애니메이션, Auto-scroll

### 2.3 Arena UI
- [ ] ArenaLayout, TurnIndicator, StreamingTextBlock, ActionSidePanel

### 2.4 Judging System
- [ ] 채점 노드, 점수 계산, Verdict 생성 (Backend - already implemented)
- [ ] ScoreCard, VerdictPanel (Frontend)

---

## Phase 3: M3 - Polish & Evaluation

### 3.1 Replay Feature
- [ ] Replay 모드 UI (재생/일시정지, 속도조절)

### 3.2 Rule Violation Detection
- [ ] Summary 새 논거 감지, Persona 금칙어 감지

### 3.3 Error Handling
- [ ] Ollama 연결/타임아웃 처리, 재시도 로직

### 3.4 Character Showcase
- [ ] `/agent/showcase` 라우팅, AgentGallery

### 3.5 Agent Clone (Backend complete)
- [ ] Clone 버튼 UI

### 3.6 Judge Fairness (Swap Test)
- [ ] Swap Test API, Position 교체 후 재실행

---

## Phase 4: Quality & Polish

### 4.1 Testing
- [ ] Backend/Frontend 단위 테스트, E2E 테스트

### 4.2 Performance
- [ ] SSE/React Flow 최적화

### 4.3 UX Polish
- [ ] 로딩 상태, 에러 메시지, 반응형, 키보드 단축키

### 4.4 Documentation
- [ ] API 문서 (OpenAPI), 사용자 가이드

---

## Work Log

### 2025-12-15
- **Phase 0**: 프로젝트 초기 설정 완료
- **Phase 1-M1 Backend**:
  - LangGraph 14노드 토론 플로우
  - SSE 실시간 스트리밍
  - Agent/Run CRUD API 전체 구현
  - Commits: `3c85257`, `92fd661`, `5930c2e`

---

## Tech Stack

| Category | Stack |
|----------|-------|
| Backend | Python 3.12+, FastAPI 0.124.4, LangGraph 0.6.11, SQLAlchemy 2.0.45 |
| Frontend | Next.js 16.0.10, React 19.2.3, TypeScript 5.9.3, Tailwind CSS 4.1.18 |
| Database | PostgreSQL 17+ |
| LLM | Ollama 0.6.1 |
| Streaming | SSE-Starlette 3.0.3 |
| State | TanStack Query 5.90.12 |

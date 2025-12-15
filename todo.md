# VS Arena - Development TODO

> PRD v1.4 기반 개발 실행 계획
> 최종 업데이트: 2025-12-15

---

## Phase 0: Project Setup

### 0.1 Environment Setup
- [x] 프로젝트 디렉토리 구조 생성
  ```
  vs-arena/
  ├── backend/          # Python 3.12+ (FastAPI + LangGraph)
  ├── frontend/         # Next.js 15+ (React 19 + TypeScript)
  ├── docker/           # Docker 설정
  └── docs/             # 문서
  ```
- [x] Backend 환경 설정 (최신 버전)
  - [x] Python 3.12+ 가상환경 생성
  - [x] FastAPI 0.124.4, LangGraph 0.6.11, Ollama 0.6.1 SDK 설치
  - [x] pyproject.toml 작성
  - [x] SQLAlchemy 2.0.45, Pydantic 2.12.5 설정
  - [x] 기본 API 라우터 구조 설정
- [x] Frontend 환경 설정 (최신 버전)
  - [x] Next.js 16.0.10 (App Router) 프로젝트 생성
  - [x] TypeScript 5.9.3 설정
  - [x] React Flow 12.10.0 (@xyflow/react) 설치
  - [x] Tailwind CSS 4.1.18 설치
  - [x] ESLint 9.39.2 설정
  - [x] shadcn/ui 컴포넌트 통합 (Button, Card, Input, Label, Textarea)
  - [x] TanStack Query 5.90.12 설치
- [x] Database 설정
  - [x] PostgreSQL 17+ Docker 설정
  - [x] 초기 마이그레이션 스크립트 작성 (docker/init.sql)
  - [x] Agents, Runs, Turns 테이블 생성 완료

### 0.2 Development Tools
- [x] Docker Compose 설정 (PostgreSQL 17 컨테이너)
- [x] Hot reload 설정 (Backend: uvicorn --reload, Frontend: next dev --turbopack)
- [ ] API 테스트 환경 (Bruno 또는 Thunder Client)

---

## Phase 1: M1 - Core Foundation

### 1.1 Database Schema
- [x] Agents 테이블 생성
  ```sql
  CREATE TABLE agents (
    agent_id UUID PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    persona_json JSONB NOT NULL DEFAULT '{}',
    params_json JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [x] Runs 테이블 생성
- [x] Turns 테이블 생성
- [x] 인덱스 생성 (idx_turns_run_id, idx_turns_phase)

### 1.2 Ollama Integration
- [x] Ollama 로컬 설치 및 모델 다운로드 (llama3, qwen2.5 등)
- [x] `GET /api/ollama/models` - 모델 목록 조회
- [x] `GET /api/ollama/status` - 서버 상태 확인
- [x] Ollama 클라이언트 래퍼 구현
  - [x] `call_ollama(model, prompt, params)` - 동기 호출
  - [x] `stream_ollama(model, prompt, params)` - 스트리밍 호출

### 1.3 Agent CRUD API
- [x] `GET /api/agents` - 목록 조회
- [x] `POST /api/agents` - 생성
- [x] `GET /api/agents/{id}` - 상세 조회
- [x] `PUT /api/agents/{id}` - 수정
- [x] `DELETE /api/agents/{id}` - 삭제
- [x] `POST /api/agents/{id}/clone` - 에이전트 복제
- [x] Request/Response DTO 정의
- [x] Validation (name 길이, model 존재 여부 등)

### 1.4 Agent Preview API
- [x] `POST /api/agents/preview` - 1-Turn 테스트
- [x] SSE 스트리밍 응답 구현
- [x] Opening 프롬프트 템플릿 작성
- [x] 저장된 Agent 또는 임시 config 지원

### 1.5 LangGraph Basic Flow
- [x] DebateState TypedDict 정의
- [x] Turn TypedDict 정의
- [x] 기본 노드 구현 (14 nodes - BP Lite format)
  - [x] `judge_intro` - Judge 소개
  - [x] `opening_a` - Agent A 입론
  - [x] `opening_b` - Agent B 입론
  - [x] `rebuttal_a` - Agent A 반론
  - [x] `rebuttal_b` - Agent B 반론
  - [x] `summary_a` - Agent A 요약
  - [x] `summary_b` - Agent B 요약
  - [x] `judge_verdict` - 최종 판정
  - [x] `score_opening_a` / `score_opening_b` - 입론 채점
  - [x] `score_rebuttal_a` / `score_rebuttal_b` - 반론 채점
  - [x] `score_summary_a` / `score_summary_b` - 요약 채점
- [x] StateGraph 구성 및 엣지 연결
- [x] 프롬프트 템플릿 작성
  - [x] Opening 프롬프트
  - [x] Rebuttal 프롬프트 (상대 발언 컨텍스트 포함)
  - [x] Summary 프롬프트 (전체 토론 컨텍스트)
  - [x] Judge Intro 프롬프트
  - [x] Verdict 프롬프트
  - [x] Scoring 프롬프트 (Opening/Rebuttal/Summary)

### 1.6 Debate API
- [x] `POST /api/debate/start` - 토론 시작 (Run 생성)
- [x] `GET /api/debate/runs` - Run 목록 조회
- [x] `GET /api/debate/runs/{id}` - Run 상세 조회 (에이전트 정보 포함)
- [x] `GET /api/debate/runs/{id}/turns` - Turn 목록 조회 (리플레이용)
- [x] `DELETE /api/debate/runs/{id}` - Run 삭제

### 1.7 SSE Streaming
- [x] `GET /api/debate/stream/{runId}` - 토론 스트리밍
- [x] SSE 이벤트 타입 구현
  - [x] `phase_start` - 단계 시작
  - [x] `token` - 토큰 스트리밍
  - [x] `phase_end` - 단계 종료
  - [x] `error` - 에러 발생
  - [x] `run_complete` - 토론 완료
  - [x] `score` - 채점 결과
  - [x] `verdict` - 최종 판정
- [ ] 연결 관리 (keep-alive, reconnect)

### 1.8 Frontend - Agent Module (Next.js App Router)
- [x] App Router 라우팅 설정
  - [x] `app/agent/page.tsx` - Agent 목록
  - [x] `app/agent/new/page.tsx` - Agent 생성
  - [x] `app/agent/[agentId]/edit/page.tsx` - Agent 편집
  - [x] `app/agent/showcase/page.tsx` - Character Showcase
  - [x] `app/agent/loading.tsx` - Loading skeleton
- [x] 컴포넌트 구현
  - [x] AgentList (Client Component)
  - [x] AgentCard (Client Component)
  - [x] AgentEditor (Client Component)
    - [x] ModelSelector (Ollama 모델 목록)
    - [x] PersonaEditor (JSON 에디터)
    - [x] ParamsEditor (슬라이더/입력)
  - [x] AgentPreviewPanel (Client Component)
    - [x] Topic/Position 입력
    - [x] SSE 스트리밍 텍스트 표시
- [x] API 연동 (TanStack Query v5)
  - [x] TanStack Query Provider 설정
  - [x] Agent CRUD hooks (useAgents, useCreateAgent, useUpdateAgent, useDeleteAgent, useCloneAgent)
  - [x] Ollama hooks (useOllamaModels, useOllamaStatus)
  - [x] SSE streaming hook (useAgentPreview)
- [x] Tailwind CSS 스타일링
- [x] TypeScript 타입 정의 (lib/types.ts)
- [x] API Client 구현 (lib/api-client.ts)
- [x] Build 및 테스트 완료

### 1.9 Frontend - Debate Setup (Next.js App Router)
- [x] App Router 라우팅 설정
  - [x] `app/debate/page.tsx` - Debate 설정
  - [x] `app/debate/arena/[runId]/page.tsx` - Arena
- [x] 컴포넌트 구현
  - [x] DebateSetupForm (Client Component)
    - [x] TopicInput (Textarea)
    - [x] PositionSelector (FOR/AGAINST)
    - [x] AgentSelector (A / B / Judge)
    - [x] DebateConfig (Collapsible: Rounds, Max Tokens)
  - [x] RubricEditor (가중치 슬라이더: argumentation, rebuttal, delivery, strategy)
  - [x] DebateStreamView (SSE streaming display with phase indicator)
- [x] Start Debate 버튼 및 API 연동
  - [x] useStartDebate hook
  - [x] useDebateStream hook (SSE: phase_start, token, phase_end, score, verdict)
  - [x] Position validation (opposite positions required)
  - [x] Navigation to arena on success

---

## Phase 2: M2 - Visualization & Judging

### 2.1 React Flow Integration
- [x] DebateFlowCanvas 컴포넌트 (React Flow 래퍼)
- [x] Custom Node 타입 정의
  - [x] TopicNode
  - [x] JudgeIntroNode
  - [x] OpeningNode (A/B 구분)
  - [x] RebuttalNode (A/B 구분)
  - [x] SummaryNode (A/B 구분)
  - [x] VerdictNode
  - [x] ScoreNode (추가)
- [x] Custom Edge 타입 정의
  - [x] SequenceEdge (순서 연결)
  - [x] TargetEdge (반박 대상 연결)
- [x] Node 스타일링
  - [x] Agent A 색상 테마 (Blue)
  - [x] Agent B 색상 테마 (Red)
  - [x] Judge 색상 테마 (Purple)
- [x] Auto-layout 구현 (dagre)
- [x] Text/Flow 뷰 전환 토글
- [x] SSE 스트리밍 연동 (useDebateFlow hook)

### 2.2 Real-time Graph Update
- [x] SSE 이벤트 핸들러 (Phase 2.1에서 구현 완료)
  - [x] `phase_start` → 새 노드 생성
  - [x] `token` → 노드 콘텐츠 업데이트
  - [x] `phase_end` → 노드 완료 상태
  - [x] `score` → 점수 표시
- [x] 애니메이션 효과
  - [x] 타이핑 효과 (스트리밍 텍스트) - StreamingText 컴포넌트
  - [x] 노드 하이라이트 (현재 발언자) - Agent-colored glow animations
  - [x] 엣지 애니메이션 (반박 연결) - Flowing dash effect
- [x] Auto-scroll (활성 노드로 뷰포트 이동) - setCenter with 500ms transition

### 2.3 Arena UI
- [x] ArenaLayout 컴포넌트
- [x] TurnIndicator (현재 발언자, 진행 단계)
- [x] ActionSidePanel
  - [x] ScoreDisplay (Agent A vs B 점수 비교)
  - [x] DebateLog (단계별 로그와 미리보기)
  - [x] ProgressIndicator (14단계 진행 상태)
- [x] ArenaFlowView (통합 Flow 뷰 컴포넌트)
- [x] Arena 페이지 리팩토링 및 통합

### 2.4 Judging System - Backend (Phase 1.5에서 구현 완료)
- [x] 채점 노드 구현
  - [x] `score_opening_a` / `score_opening_b`
  - [x] `score_rebuttal_a` / `score_rebuttal_b`
  - [x] `score_summary_a` / `score_summary_b`
- [x] 채점 프롬프트 템플릿
  - [x] Opening 채점 기준
  - [x] Rebuttal 채점 기준
  - [x] Summary 채점 기준
- [x] 점수 계산 로직
  - [x] 가중치 적용
  - [ ] 페널티 적용
  - [x] 총점 계산
- [x] Verdict 생성
  - [x] 승자 결정
  - [x] 상세 분석 생성
  - [ ] 개선 제안 생성

### 2.5 Judging System - Frontend
- [x] ScoreCard 컴포넌트 (단계별 점수)
- [x] VerdictPanel 컴포넌트
  - [x] 승자 표시
  - [x] 점수 비교 차트
  - [x] 상세 분석 텍스트
- [x] SSE `score` 이벤트 처리
- [x] SSE `verdict` 이벤트 처리

---

## Phase 3: M3 - Polish & Evaluation

### 3.1 Replay Feature
- [x] `GET /api/debate/runs/{id}/turns` API (Phase 1.6에서 구현 완료)
- [x] Replay 모드 UI
  - [x] 재생/일시정지 컨트롤
  - [x] 속도 조절 (0.5x, 1x, 2x)
  - [x] 단계별 이동 (Previous/Next)
  - [x] 클릭 가능한 타임라인 (단계별 직접 이동)
- [x] 그래프 상태 복원 (Turn 데이터 기반)
- [x] 문자 단위 스트리밍 시뮬레이션
- [x] 완료된 Run에서만 Replay 모드 활성화

### 3.2 Rule Violation Detection
- [x] Summary 새 논거 감지
  - [x] 이전 발언에서 언급되지 않은 주장 추출 (LLM 기반)
  - [x] Judge 프롬프트에 위반 여부 포함
  - [x] 페널티 자동 적용 (-5 points)
- [x] Persona 금칙어 감지
  - [x] forbidden_phrases 매칭 (Rule-based + Hybrid)
  - [x] 위반 시 페널티 (-2 per phrase)

### 3.3 Error Handling
- [x] Ollama 연결 실패 처리
- [x] LLM 타임아웃 처리
- [x] 재시도 로직 (exponential backoff)
- [x] Run 실패 상태 관리
- [x] 사용자 알림 UI (Sonner toast notifications)

### 3.4 Character Showcase
- [x] 라우팅 설정 (`/agent/showcase`) - 기존 구현 완료
- [x] AgentGalleryCard 컴포넌트
- [x] AgentDetailDrawer 컴포넌트
  - [x] 상세 정보 표시 (Persona, Parameters)
  - [x] Preview 실행 버튼 (AgentPreviewPanel 통합)
  - [x] Edit Agent, Use in Debate 액션
- [x] 필터/정렬 기능 (모델별 Badge 필터, 이름/날짜/모델 정렬)

### 3.5 Agent Clone
- [x] `POST /api/agents/{id}/clone` API (Phase 1.3에서 구현 완료)
- [x] Clone 버튼 UI (AgentCard에 구현 완료 - Phase 1.8)

### 3.6 Judge Fairness (Swap Test)
- [ ] Swap Test 실행 API
- [ ] Position 교체 후 재실행
- [ ] 결과 비교 리포트
- [ ] 일관성 점수 계산

---

## Phase 4: Quality & Polish

### 4.1 Testing
- [ ] Backend 단위 테스트
  - [ ] Agent CRUD
  - [ ] Ollama 연동
  - [ ] LangGraph 플로우
- [ ] Frontend 컴포넌트 테스트
- [ ] E2E 테스트 (전체 토론 플로우)

### 4.2 Performance
- [ ] SSE 연결 최적화
- [ ] React Flow 렌더링 최적화
- [ ] 대용량 텍스트 처리

### 4.3 UX Polish
- [ ] 로딩 상태 표시
- [ ] 에러 메시지 개선
- [ ] 반응형 레이아웃
- [ ] 키보드 단축키

### 4.4 Documentation
- [ ] API 문서 (OpenAPI/Swagger)
- [ ] 컴포넌트 문서 (Storybook - optional)
- [ ] 사용자 가이드

---

## Progress Tracking

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 0: Setup | **Completed** | 95% |
| Phase 1: M1 | **Completed** | 100% (Backend + Frontend Agent Module) |
| Phase 2: M2 | **Completed** | 100% (2.1, 2.2, 2.3, 2.4, 2.5 완료) |
| Phase 3: M3 | **In Progress** | 83% (3.1-3.5 완료, 3.6 남음) |
| Phase 4: Polish | Not Started | 0% |

---

## Notes

### 기술 스택 요약 (최신 버전 - 2025-12-15)
- **Backend**: Python 3.12+, FastAPI 0.124.4, LangGraph 0.6.11, SQLAlchemy 2.0.45, Pydantic 2.12.5
- **Frontend**: Next.js 16.0.10, React 19.2.3, TypeScript 5.9.3, React Flow 12.10.0, Tailwind CSS 4.1.18
- **Database**: PostgreSQL 17+
- **LLM**: Ollama 0.6.1 (local)
- **Streaming**: Server-Sent Events (SSE 3.0.3)
- **State Management**: TanStack Query 5.90.12

### 우선순위 원칙
1. 핵심 플로우 먼저 (Agent → Debate → Arena)
2. 시각화는 기본 기능 완성 후
3. 채점은 단순 버전 → 상세 버전
4. Polish는 마지막

### 참고 문서
- [PRD v1.3](./prd.md)
- [LangGraph Docs](https://langchain-ai.github.io/langgraph/)
- [React Flow Docs](https://reactflow.dev/)
- [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md)

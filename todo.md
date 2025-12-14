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
- [ ] Agents 테이블 생성
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
- [ ] Runs 테이블 생성
- [ ] Turns 테이블 생성
- [ ] 인덱스 생성 (idx_turns_run_id, idx_turns_phase)

### 1.2 Ollama Integration
- [ ] Ollama 로컬 설치 및 모델 다운로드 (llama3, qwen2.5 등)
- [ ] `GET /api/ollama/models` - 모델 목록 조회
- [ ] `GET /api/ollama/status` - 서버 상태 확인
- [ ] Ollama 클라이언트 래퍼 구현
  - [ ] `call_ollama(model, prompt, params)` - 동기 호출
  - [ ] `stream_ollama(model, prompt, params)` - 스트리밍 호출

### 1.3 Agent CRUD API
- [ ] `GET /api/agents` - 목록 조회
- [ ] `POST /api/agents` - 생성
- [ ] `GET /api/agents/{id}` - 상세 조회
- [ ] `PUT /api/agents/{id}` - 수정
- [ ] `DELETE /api/agents/{id}` - 삭제
- [ ] Request/Response DTO 정의
- [ ] Validation (name 길이, model 존재 여부 등)

### 1.4 Agent Preview API
- [ ] `POST /api/agents/preview` - 1-Turn 테스트
- [ ] SSE 스트리밍 응답 구현
- [ ] Opening 프롬프트 템플릿 작성
- [ ] 저장된 Agent 또는 임시 config 지원

### 1.5 LangGraph Basic Flow
- [ ] DebateState TypedDict 정의
- [ ] Turn TypedDict 정의
- [ ] 기본 노드 구현
  - [ ] `judge_intro` - Judge 소개
  - [ ] `opening_a` - Agent A 입론
  - [ ] `opening_b` - Agent B 입론
  - [ ] `rebuttal_a` - Agent A 반론
  - [ ] `rebuttal_b` - Agent B 반론
  - [ ] `summary_a` - Agent A 요약
  - [ ] `summary_b` - Agent B 요약
  - [ ] `judge_verdict` - 최종 판정
- [ ] StateGraph 구성 및 엣지 연결
- [ ] 프롬프트 템플릿 작성
  - [ ] Opening 프롬프트
  - [ ] Rebuttal 프롬프트 (상대 발언 컨텍스트 포함)
  - [ ] Summary 프롬프트 (전체 토론 컨텍스트)
  - [ ] Judge Intro 프롬프트
  - [ ] Verdict 프롬프트

### 1.6 Debate API
- [ ] `POST /api/debate/start` - 토론 시작 (Run 생성)
- [ ] `GET /api/runs` - Run 목록 조회
- [ ] `GET /api/runs/{id}` - Run 상세 조회
- [ ] `GET /api/runs/{id}/turns` - Turn 목록 조회
- [ ] `DELETE /api/runs/{id}` - Run 삭제

### 1.7 SSE Streaming
- [ ] `GET /api/debate/stream/{runId}` - 토론 스트리밍
- [ ] SSE 이벤트 타입 구현
  - [ ] `phase_start` - 단계 시작
  - [ ] `token` - 토큰 스트리밍
  - [ ] `phase_end` - 단계 종료
  - [ ] `error` - 에러 발생
  - [ ] `run_complete` - 토론 완료
- [ ] 연결 관리 (keep-alive, reconnect)

### 1.8 Frontend - Agent Module (Next.js App Router)
- [ ] App Router 라우팅 설정
  - [ ] `app/agent/page.tsx` - Agent 목록
  - [ ] `app/agent/new/page.tsx` - Agent 생성
  - [ ] `app/agent/[agentId]/edit/page.tsx` - Agent 편집
  - [ ] `app/agent/showcase/page.tsx` - Character Showcase
- [ ] 컴포넌트 구현
  - [ ] AgentList (Server Component)
  - [ ] AgentCard (Client Component)
  - [ ] AgentEditor (Client Component)
    - [ ] ModelSelector (Ollama 모델 목록)
    - [ ] PersonaEditor (JSON 에디터)
    - [ ] ParamsEditor (슬라이더/입력)
  - [ ] AgentPreviewPanel (Client Component)
    - [ ] Topic/Position 입력
    - [ ] SSE 스트리밍 텍스트 표시
- [ ] API 연동 (TanStack Query v5)
- [ ] Tailwind CSS 스타일링

### 1.9 Frontend - Debate Setup (Next.js App Router)
- [ ] App Router 라우팅 설정
  - [ ] `app/debate/page.tsx` - Debate 설정
  - [ ] `app/debate/arena/[runId]/page.tsx` - Arena
- [ ] 컴포넌트 구현
  - [ ] DebateSetupForm (Client Component)
    - [ ] TopicInput
    - [ ] PositionInputA / PositionInputB
    - [ ] AgentPicker (A / B / Judge)
    - [ ] DebateConfigPanel (Rounds, Limits)
  - [ ] Rubric 설정 UI (가중치 조절)
- [ ] Start Debate 버튼 및 API 연동

---

## Phase 2: M2 - Visualization & Judging

### 2.1 React Flow Integration
- [ ] DebateFlowCanvas 컴포넌트 (React Flow 래퍼)
- [ ] Custom Node 타입 정의
  - [ ] TopicNode
  - [ ] JudgeIntroNode
  - [ ] OpeningNode (A/B 구분)
  - [ ] RebuttalNode (A/B 구분)
  - [ ] SummaryNode (A/B 구분)
  - [ ] VerdictNode
- [ ] Custom Edge 타입 정의
  - [ ] SequenceEdge (순서 연결)
  - [ ] TargetEdge (반박 대상 연결)
- [ ] Node 스타일링
  - [ ] Agent A 색상 테마
  - [ ] Agent B 색상 테마
  - [ ] Judge 색상 테마
- [ ] Auto-layout 구현 (dagre 또는 elk)

### 2.2 Real-time Graph Update
- [ ] SSE 이벤트 핸들러
  - [ ] `phase_start` → 새 노드 생성
  - [ ] `token` → 노드 콘텐츠 업데이트
  - [ ] `phase_end` → 노드 완료 상태
  - [ ] `score` → 점수 표시
- [ ] 애니메이션 효과
  - [ ] 타이핑 효과 (스트리밍 텍스트)
  - [ ] 노드 하이라이트 (현재 발언자)
  - [ ] 엣지 애니메이션 (반박 연결)
- [ ] Auto-scroll (활성 노드로 뷰포트 이동)

### 2.3 Arena UI
- [ ] ArenaLayout 컴포넌트
- [ ] TurnIndicator (현재 발언자, 진행 단계)
- [ ] StreamingTextBlock (실시간 텍스트)
- [ ] ActionSidePanel
  - [ ] Judge Score 표시
  - [ ] 토론 로그
  - [ ] 진행률 표시

### 2.4 Judging System - Backend
- [ ] 채점 노드 구현
  - [ ] `score_opening_a` / `score_opening_b`
  - [ ] `score_rebuttal_a` / `score_rebuttal_b`
  - [ ] `score_summary_a` / `score_summary_b`
- [ ] 채점 프롬프트 템플릿
  - [ ] Opening 채점 기준
  - [ ] Rebuttal 채점 기준
  - [ ] Summary 채점 기준
- [ ] 점수 계산 로직
  - [ ] 가중치 적용
  - [ ] 페널티 적용
  - [ ] 총점 계산
- [ ] Verdict 생성
  - [ ] 승자 결정
  - [ ] 상세 분석 생성
  - [ ] 개선 제안 생성

### 2.5 Judging System - Frontend
- [ ] ScoreCard 컴포넌트 (단계별 점수)
- [ ] VerdictPanel 컴포넌트
  - [ ] 승자 표시
  - [ ] 점수 비교 차트
  - [ ] 상세 분석 텍스트
- [ ] SSE `score` 이벤트 처리
- [ ] SSE `verdict` 이벤트 처리

---

## Phase 3: M3 - Polish & Evaluation

### 3.1 Replay Feature
- [ ] `GET /api/runs/{id}/turns` 활용
- [ ] Replay 모드 UI
  - [ ] 재생/일시정지 컨트롤
  - [ ] 속도 조절 (0.5x, 1x, 2x)
  - [ ] 단계별 이동
- [ ] 그래프 상태 복원

### 3.2 Rule Violation Detection
- [ ] Summary 새 논거 감지
  - [ ] 이전 발언에서 언급되지 않은 주장 추출
  - [ ] Judge 프롬프트에 위반 여부 포함
  - [ ] 페널티 자동 적용
- [ ] Persona 금칙어 감지
  - [ ] forbidden_phrases 매칭
  - [ ] 위반 시 페널티

### 3.3 Error Handling
- [ ] Ollama 연결 실패 처리
- [ ] LLM 타임아웃 처리
- [ ] 재시도 로직 (exponential backoff)
- [ ] Run 실패 상태 관리
- [ ] 사용자 알림 UI

### 3.4 Character Showcase
- [ ] 라우팅 설정 (`/agent/showcase`)
- [ ] AgentGallery 컴포넌트
- [ ] AgentGalleryCard 컴포넌트
- [ ] AgentDetailDrawer 컴포넌트
  - [ ] 상세 정보 표시
  - [ ] Preview 실행 버튼
- [ ] 필터/정렬 기능 (모델별, 이름순)

### 3.5 Agent Clone
- [ ] `POST /api/agents/{id}/clone` API
- [ ] Clone 버튼 UI

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
| Phase 1: M1 | Not Started | 0% |
| Phase 2: M2 | Not Started | 0% |
| Phase 3: M3 | Not Started | 0% |
| Phase 4: Polish | Not Started | 0% |

---

## Completed Work Log

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

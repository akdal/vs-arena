# Product Requirements Document (PRD): VS Arena

| 문서 버전         | v1.4 (Complete)                                           |
| ------------- | --------------------------------------------------------- |
| **프로젝트명**     | VS Arena (AI Debate Agent Platform)                     |
| **작성일**       | 2025-12-14                                                |
| **최종 수정**    | 2025-12-15                                                |
| **상태**        | Dev‑Ready                                                 |
| **Backend**    | Python 3.12+, FastAPI 0.124.4, LangGraph 0.6.11, SQLAlchemy 2.0.45 |
| **Frontend**   | Next.js 16.0.10, React 19.2.3, React Flow 12.10.0, Tailwind CSS 4.1.18 |
| **Streaming**  | SSE (Server-Sent Events)                                  |
| **LLM 실행 환경** | Local Ollama 0.6.1 (전용)                                  |
| **인증**        | 없음 (Single User Mode)                                    |

---

## 0. 용어 및 개념 정리 (Terminology & Concepts)

본 문서는 **Agent 중심 설계**를 채택한다. 모든 관리·저장·선택의 주체는 Agent이며, 다른 개념은 Agent 또는 Run의 하위 개념이다.

### 0.1 핵심 개념 정의 (최종)

- **Model**

  - LLM 자체 (예: `llama3`, `qwen2.5`, `gpt-4o`)
  - 순수한 추론 엔진으로, 말투·가치관·성향을 포함하지 않는다.

- **Agent** ⭐ (관리의 1급 객체)

  - 실제 토론을 수행하는 **관리 및 실행의 기본 단위**
  - 정의:
    > **Agent = Model + Persona + Runtime + Params**
  - 사용자는 다수의 Agent를 생성·저장·관리할 수 있다.

- **Persona**

  - Agent 내부에 포함된 **행동 규약(Behavior Spec)**
  - 말투, 가치관, 사고 프레임, 금칙어 등을 정의한다.
  - Persona는 독립적으로 관리되지 않으며, 항상 Agent에 귀속된다.

- **Role**

  - 토론 Run에서 Agent에게 부여되는 **기능적 역할**
  - 고정 타입:
    - `Debater`
    - `Judge`

- **Position**

  - 특정 토론 Run에서 `Debater` Role을 가진 Agent가 취하는 **논지/목표/전략**
  - Run 단위 입력값이며, Agent의 Persona와는 무관하다.

> 핵심 원칙
>
> - **Agent가 관리의 주체**이다.
> - Persona는 Agent의 내부 속성이다.
> - Role은 Run에서 부여되며, Position은 Debater Role의 하위 개념이다.
> - Setup에서는 Agent를 선택하고, Debater에 대해서만 Position을 입력한다.

---

## 1. 개요

### 1.1 제품 목적

사용자가 선택한 **Agent 조합(A/B/J)** 과 **Position(A vs B)** 을 기반으로, 두 Debater Agent가 구조화된 라운드(BP Lite)로 토론을 수행하고, Judge Agent가 **채점·판정·총평**을 제공하는 **시각화 중심 AI 토론 플랫폼**을 구축한다.

### 1.2 핵심 가치

- **Structured Logic**: 자유 대화가 아닌, 규칙 기반 토론을 시스템이 강제
- **Visualized Flow**: React Flow로 주장·반박·타겟 관계를 시각화
- **Agent‑Centric**: Model+Persona 조합을 하나의 자산(Agent)으로 관리

### 1.3 성공 지표 (Success Metrics)

- Run 완료율 ≥ 98%
- 규칙 위반율(Whip 단계 새 논거) ≤ 5%
- Judge 판정 일관성(Swap Test) ≥ 85%
- **Latency:** 노드 간 턴 전환 지연 시간 ≤ 2초

---

## 2. 사용자 경험 (User Flow)

### 2.1 주요 플로우

0. **Agent 모듈** (`/agent`)
- Agent 생성 / 편집 / 복제 / 삭제
- Agent = Model + Persona + Params
- Preview(1-turn)로 빠른 검증
- **Character Showcase**에서 Agent 탐색/비교

1. **Debate 설정 화면** (`/debate` 또는 `/debate/setup`)
- Topic 입력
- Debater A Position 입력
- Debater B Position 입력
- Judge 성향 및 채점 기준 선택
- 라운드 수 / 발언 길이 설정
- **Agent A / B / Judge 선택**

2. **Arena 화면** (`/debate/arena/:runId`)
- Judge Intro → A Opening → B Opening → A Rebuttal → B Rebuttal → A Summary → B Summary → Judge Verdict
- SSE 기반 실시간 스트리밍
- React Flow 노드/엣지 생성

3. **Result**
- 승자, 점수표, 판정 근거 제공
- 전체 토론 Replay
- 결과 공유 링크

---

## 3. 기능 명세 (Functional Specifications)

### 3.0 최소 컴포넌트 목록 (Frontend)

cookie.fun UI를 참고하되, VS Arena 목적에 맞게 **필수 최소 단위만 정의**한다.

#### A. 공통 레이아웃
- `AppShell`
  - Top Navigation Bar
  - Route Switch (`/agent`, `/debate`)
- `TopNav`
  - 서비스 로고
  - Agent / Debate 메뉴
  - 상태 표시(Online / Streaming 등)

#### B. Agent 모듈 (`/agent`)

**1) Agent 설정 화면**
- `AgentList`
- `AgentCard`
- `AgentEditor`
  - `ModelSelector`
  - `PersonaEditor` (JSON Editor)
  - `ParamsEditor`
- `AgentPreviewPanel`

**2) Character Showcase 화면**
- `AgentGallery`
- `AgentGalleryCard`
- `AgentDetailDrawer`

#### C. Debate 모듈 (`/debate`)

**1) Debate 설정 화면**
- `DebateSetupForm`
  - `TopicInput`
  - `PositionInputA / PositionInputB`
  - `AgentPicker` (A / B / Judge)
  - `DebateConfigPanel` (Rounds, Limits)

**2) Arena 화면**
- `ArenaLayout`
- `DebateFlowCanvas` (React Flow Wrapper)
- `DebateNode` (Custom Node)
- `DebateEdge`
- `TurnIndicator`
- `StreamingTextBlock`
- `ActionSidePanel` (Judge Score, Logs)

> 설계 원칙
> - 컴포넌트는 **Agent / Debate 도메인 기준으로 분리**
> - Arena는 상태(State) 중심, Setup은 입력(Form) 중심

---

### 3.1 Agent 모듈 (Frontend - Next.js App Router)

- 루트: `/agent`
- 화면 구성 (App Router 기준)
  - **Agent 목록/관리**: `/agent` → `app/agent/page.tsx`
  - **Agent 생성**: `/agent/new` → `app/agent/new/page.tsx`
  - **Agent 편집**: `/agent/[agentId]/edit` → `app/agent/[agentId]/edit/page.tsx`
  - **Character Showcase**: `/agent/showcase` → `app/agent/showcase/page.tsx`

#### 3.1.1 Agent 관리 화면

- **AgentList**: 저장된 Agent 카드 목록
- **AgentCard**: Agent 요약 정보 (이름, 모델, Persona 요약)
- **CRUD 액션**: 생성 / 편집 / 복제 / 삭제

#### 3.1.2 Agent Editor

- **ModelSelector**: Ollama에서 사용 가능한 모델 목록 선택
  - `GET /api/ollama/models` 호출하여 동적 목록 표시
- **PersonaEditor**: Persona JSON 편집기
  ```json
  {
    "name": "논리적 분석가",
    "tone": "formal",
    "values": ["논리", "증거 기반", "객관성"],
    "thinking_style": "analytical",
    "speaking_style": "structured",
    "forbidden_phrases": ["~인 것 같아요", "아마도"],
    "system_prompt_override": "당신은 논리적이고 체계적인 토론자입니다..."
  }
  ```
- **ParamsEditor**: LLM 파라미터 설정
  ```json
  {
    "temperature": 0.7,
    "top_p": 0.9,
    "max_tokens": 1024,
    "repeat_penalty": 1.1
  }
  ```

#### 3.1.3 Agent Preview (1-Turn 검증)

사용자가 Agent 설정 후 빠르게 동작을 검증하는 기능

- **입력**
  - Topic: 테스트 주제 (예: "AI 개발 일시 중단")
  - Position: 테스트 입장 (예: "찬성 - 안전을 위해 중단해야 한다")
- **출력**
  - Agent가 해당 Topic + Position에 대해 Opening 스타일의 주장을 1회 생성
  - 스트리밍으로 실시간 표시
- **목적**
  - Persona가 의도대로 반영되는지 확인
  - 말투, 논증 스타일, 금칙어 준수 여부 검증

#### 3.1.4 Character Showcase

- **AgentGallery**: 전체 Agent를 카드 그리드로 표시
- **AgentGalleryCard**: 아바타, 이름, 모델, Persona 요약
- **AgentDetailDrawer**: 선택 시 상세 정보 + Preview 실행 가능

---

### 3.2 Debate 모듈 (Frontend - Next.js App Router)

- 루트: `/debate`
- 화면 구성 (App Router 기준)
  - **설정 화면**: `/debate` → `app/debate/page.tsx`
  - **Arena 화면**: `/debate/arena/[runId]` → `app/debate/arena/[runId]/page.tsx`

#### 3.2.1 Debate 설정 화면 (Setup)
- 입력 항목
  - Topic
  - Position A / Position B
  - Judge Style
  - Rubric
  - Rounds / Limits
- Agent 선택
  - Agent A (Role: Debater)
  - Agent B (Role: Debater)
  - Agent J (Role: Judge)

#### 3.2.2 Arena 화면 (Run)
- SSE 스트리밍으로 발언 텍스트 실시간 표시
- React Flow 그래프 업데이트(노드 생성/엣지 연결)
- Active Turn 표시(현재 발언자, 진행 단계)

---

### 3.3 Interactive Graph (React Flow)

- Node Types
  - topic, judge_intro
  - opening_A/B
  - rebuttal_A/B
  - summary_A/B
  - judge_verdict

- Edge Types
  - sequence
  - targets

> 구현 포인트
> - Custom Node: 아바타, Agent 이름, 스트리밍 텍스트
> - Auto-scroll: 활성 노드로 뷰포트 이동

---

## 4. Backend 설계 (LangGraph)

### 4.1 Role Orchestration

- Debater: Opening → Rebuttal → Summary
- Judge: Intro → (각 Phase별 채점) → Verdict

### 4.2 Rule Enforcement (BP Lite)

- Opening: 정의 + 핵심 주장(2~3개)
- Rebuttal: 상대 Opening/주장에 대한 직접 반박
- Summary: **새 논거 금지**, 비교(Weighing)만 허용

> 위반 감지 시 Judge 프롬프트에서 감점 또는 즉시 플래그

### 4.3 LangGraph State Schema

```python
from typing import TypedDict, Literal, Optional
from langgraph.graph import StateGraph

class Turn(TypedDict):
    turn_id: str
    agent_id: str
    phase: str
    role: Literal["debater", "judge"]
    content: str
    targets: list[str]  # 반박 대상 turn_id
    scores: Optional[dict]  # Judge가 부여한 점수

class DebateState(TypedDict):
    # Run 메타데이터
    run_id: str
    topic: str
    position_a: str
    position_b: str

    # Agent 정보
    agent_a: dict  # Agent 전체 정보
    agent_b: dict
    agent_j: dict

    # 설정
    config: dict  # rounds, max_tokens 등
    rubric: dict  # 채점 기준

    # 진행 상태
    current_phase: str
    turns: list[Turn]

    # 채점 결과
    scores_a: dict  # Agent A 누적 점수
    scores_b: dict  # Agent B 누적 점수

    # 최종 결과
    winner: Optional[Literal["A", "B", "DRAW"]]
    verdict: Optional[str]
    status: Literal["pending", "running", "judging", "completed", "failed"]
```

### 4.4 Graph Flow

```
[START]
    ↓
[judge_intro] ─────────────────────────────────────┐
    ↓                                              │
[opening_a] → [score_opening_a] ──────────────────┤
    ↓                                              │
[opening_b] → [score_opening_b] ──────────────────┤
    ↓                                              │
[rebuttal_a] → [score_rebuttal_a] ────────────────┤
    ↓                                              │
[rebuttal_b] → [score_rebuttal_b] ────────────────┤
    ↓                                              │
[summary_a] → [score_summary_a] ──────────────────┤
    ↓                                              │
[summary_b] → [score_summary_b] ──────────────────┤
    ↓                                              │
[judge_verdict] ← ─────────────────────────────────┘
    ↓
[END]
```

### 4.5 Node 구현 개요

```python
# 각 노드는 state를 받아 업데이트된 state를 반환
def opening_a(state: DebateState) -> DebateState:
    """Agent A의 Opening 생성"""
    prompt = build_opening_prompt(
        topic=state["topic"],
        position=state["position_a"],
        persona=state["agent_a"]["persona"]
    )
    content = call_ollama(
        model=state["agent_a"]["model"],
        prompt=prompt,
        params=state["agent_a"]["params"]
    )
    turn = Turn(
        turn_id=uuid4(),
        agent_id=state["agent_a"]["agent_id"],
        phase="opening_a",
        role="debater",
        content=content,
        targets=[]
    )
    return {**state, "turns": state["turns"] + [turn]}

def score_opening_a(state: DebateState) -> DebateState:
    """Judge가 Opening A 채점"""
    prompt = build_scoring_prompt(
        rubric=state["rubric"],
        turn=state["turns"][-1],
        context=state["turns"]
    )
    scores = call_ollama_json(
        model=state["agent_j"]["model"],
        prompt=prompt
    )
    # 점수 누적
    updated_scores = merge_scores(state["scores_a"], scores)
    return {**state, "scores_a": updated_scores}
```

---

## 5. 데이터 모델

### 5.1 Agents

| 필드 | 타입 | 설명 |
|------|------|------|
| agent_id | UUID (PK) | 고유 식별자 |
| name | VARCHAR(50) | Agent 표시 이름 |
| model | VARCHAR(50) | Ollama 모델명 (예: `llama3`, `qwen2.5`) |
| persona_json | JSONB | Persona 설정 |
| params_json | JSONB | LLM 파라미터 |
| created_at | TIMESTAMP | 생성 시각 |
| updated_at | TIMESTAMP | 수정 시각 |

**Persona JSON Schema**
```json
{
  "name": "string",
  "tone": "formal | casual | academic | aggressive",
  "values": ["string"],
  "thinking_style": "analytical | creative | pragmatic | idealistic",
  "speaking_style": "structured | narrative | socratic | rhetorical",
  "forbidden_phrases": ["string"],
  "system_prompt_override": "string (optional)"
}
```

**Params JSON Schema**
```json
{
  "temperature": 0.7,
  "top_p": 0.9,
  "max_tokens": 1024,
  "repeat_penalty": 1.1
}
```

**DDL**
```sql
CREATE TABLE agents (
  agent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  persona_json JSONB NOT NULL DEFAULT '{}',
  params_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 5.2 Runs

| 필드 | 타입 | 설명 |
|------|------|------|
| run_id | UUID (PK) | 고유 식별자 |
| topic | TEXT | 토론 주제 |
| agent_a_id | UUID (FK) | Debater A Agent |
| agent_b_id | UUID (FK) | Debater B Agent |
| agent_j_id | UUID (FK) | Judge Agent |
| position_a | TEXT | A의 입장/논지 |
| position_b | TEXT | B의 입장/논지 |
| config_json | JSONB | 토론 설정 (라운드 수 등) |
| rubric_json | JSONB | 채점 기준 |
| result_json | JSONB | 최종 판정 결과 |
| status | VARCHAR(20) | 상태 |
| created_at | TIMESTAMP | 생성 시각 |
| finished_at | TIMESTAMP | 완료 시각 |

**Status 값**
- `pending`: 생성됨, 시작 전
- `running`: 토론 진행 중
- `judging`: 판정 중
- `completed`: 완료
- `failed`: 실패

**Config JSON Schema**
```json
{
  "rounds": 3,
  "max_tokens_per_turn": 1024,
  "time_limit_per_turn": null
}
```

**DDL**
```sql
CREATE TABLE runs (
  run_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  agent_a_id UUID NOT NULL REFERENCES agents(agent_id),
  agent_b_id UUID NOT NULL REFERENCES agents(agent_id),
  agent_j_id UUID NOT NULL REFERENCES agents(agent_id),
  position_a TEXT NOT NULL,
  position_b TEXT NOT NULL,
  config_json JSONB NOT NULL DEFAULT '{"rounds": 3}',
  rubric_json JSONB NOT NULL DEFAULT '{}',
  result_json JSONB,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  finished_at TIMESTAMP
);
```

---

### 5.3 Turns

토론 중 각 발언을 저장하는 테이블

| 필드 | 타입 | 설명 |
|------|------|------|
| turn_id | UUID (PK) | 고유 식별자 |
| run_id | UUID (FK) | 소속 Run |
| agent_id | UUID (FK) | 발언 Agent |
| phase | VARCHAR(30) | 토론 단계 |
| role | VARCHAR(20) | 역할 (debater/judge) |
| content | TEXT | 발언 내용 |
| targets | JSONB | 반박 대상 turn_id 목록 |
| metadata | JSONB | 추가 메타데이터 |
| created_at | TIMESTAMP | 생성 시각 |

**Phase 값**
- `judge_intro`: Judge 소개/규칙 안내
- `opening_a`, `opening_b`: 입론
- `rebuttal_a`, `rebuttal_b`: 반론
- `summary_a`, `summary_b`: 요약/최종변론
- `judge_verdict`: 최종 판정

**DDL**
```sql
CREATE TABLE turns (
  turn_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(run_id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(agent_id),
  phase VARCHAR(30) NOT NULL,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  targets JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_turns_run_id ON turns(run_id);
CREATE INDEX idx_turns_phase ON turns(phase);
```

---

## 6. API

### 6.1 Agent API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/agents` | Agent 목록 조회 |
| POST | `/api/agents` | Agent 생성 |
| GET | `/api/agents/{id}` | Agent 상세 조회 |
| PUT | `/api/agents/{id}` | Agent 수정 |
| DELETE | `/api/agents/{id}` | Agent 삭제 |
| POST | `/api/agents/{id}/clone` | Agent 복제 |

**POST /api/agents Request**
```json
{
  "name": "논리적 분석가",
  "model": "llama3",
  "persona": {
    "name": "논리적 분석가",
    "tone": "formal",
    "values": ["논리", "증거 기반"],
    "thinking_style": "analytical",
    "speaking_style": "structured",
    "forbidden_phrases": []
  },
  "params": {
    "temperature": 0.7,
    "top_p": 0.9,
    "max_tokens": 1024
  }
}
```

---

### 6.2 Agent Preview API

**POST /api/agents/preview**

Agent 설정으로 1-Turn 테스트 실행 (SSE 스트리밍)

```json
{
  "agent_id": "uuid (optional, 저장된 Agent 사용 시)",
  "agent_config": {
    "model": "llama3",
    "persona": { ... },
    "params": { ... }
  },
  "topic": "AI 개발 일시 중단",
  "position": "찬성 - 안전을 위해 중단해야 한다"
}
```

**Response**: SSE Stream
```
event: token
data: {"content": "저는"}

event: token
data: {"content": " AI 개발"}

event: done
data: {"total_tokens": 256}
```

---

### 6.3 Ollama API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/ollama/models` | 사용 가능한 Ollama 모델 목록 |
| GET | `/api/ollama/status` | Ollama 서버 상태 확인 |

**GET /api/ollama/models Response**
```json
{
  "models": [
    { "name": "llama3", "size": "4.7GB", "quantization": "Q4_0" },
    { "name": "qwen2.5", "size": "4.4GB", "quantization": "Q4_K_M" }
  ]
}
```

---

### 6.4 Debate API

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/debate/start` | 토론 시작 (Run 생성) |
| GET | `/api/runs` | Run 목록 조회 |
| GET | `/api/runs/{id}` | Run 상세 조회 |
| GET | `/api/runs/{id}/turns` | Run의 전체 Turn 조회 (Replay용) |
| DELETE | `/api/runs/{id}` | Run 삭제 |

**POST /api/debate/start Request**
```json
{
  "topic": "AI development pause",
  "agents": {
    "A": "uuid-1",
    "B": "uuid-2",
    "J": "uuid-3"
  },
  "positions": {
    "A": "Pro-safety, pause immediately",
    "B": "Pro-innovation, keep developing"
  },
  "config": {
    "rounds": 3,
    "max_tokens_per_turn": 1024
  },
  "rubric": {
    "argumentation_weight": 35,
    "rebuttal_weight": 30,
    "delivery_weight": 20,
    "strategy_weight": 15
  }
}
```

**POST /api/debate/start Response**
```json
{
  "run_id": "uuid",
  "status": "pending",
  "stream_url": "/api/debate/stream/uuid"
}
```

---

### 6.5 Debate Stream API (SSE)

**GET /api/debate/stream/{runId}**

토론 진행 상황을 실시간 스트리밍

**SSE Events**

```
event: phase_start
data: {"phase": "judge_intro", "agent_id": "uuid-j"}

event: token
data: {"content": "안녕하세요"}

event: phase_end
data: {"phase": "judge_intro", "turn_id": "uuid"}

event: phase_start
data: {"phase": "opening_a", "agent_id": "uuid-a"}

event: token
data: {"content": "저는"}

event: score
data: {"phase": "opening_a", "scores": {"argumentation": 28, "delivery": 17}}

event: phase_end
data: {"phase": "opening_a", "turn_id": "uuid"}

event: verdict
data: {"winner": "A", "final_scores": {...}, "reasoning": "..."}

event: run_complete
data: {"run_id": "uuid", "status": "completed"}

event: error
data: {"code": "LLM_TIMEOUT", "message": "Ollama 응답 시간 초과", "phase": "rebuttal_a"}
```

---

### 6.6 에러 처리

**에러 응답 형식**
```json
{
  "error": {
    "code": "AGENT_NOT_FOUND",
    "message": "Agent를 찾을 수 없습니다",
    "details": { "agent_id": "uuid" }
  }
}
```

**에러 코드**
| 코드 | HTTP | 설명 |
|------|------|------|
| `AGENT_NOT_FOUND` | 404 | Agent 없음 |
| `RUN_NOT_FOUND` | 404 | Run 없음 |
| `OLLAMA_UNAVAILABLE` | 503 | Ollama 서버 연결 실패 |
| `LLM_TIMEOUT` | 504 | LLM 응답 시간 초과 |
| `LLM_ERROR` | 500 | LLM 생성 오류 |
| `INVALID_REQUEST` | 400 | 잘못된 요청 |

**재시도 정책**
- LLM 호출 실패 시 최대 2회 재시도 (exponential backoff: 1s, 3s)
- 3회 연속 실패 시 Run 상태를 `failed`로 변경
- SSE로 `error` 이벤트 전송 후 연결 유지 (클라이언트가 재시도 결정)

---

## 7. 채점 시스템 (Judging System)

### 7.1 채점 원칙

VS Arena는 영국 의회식(BP) 토론의 채점 원칙을 **2-Agent 대결 구조**에 맞게 단순화하여 적용한다.

#### 기본 원칙
- **상대 평가**: Agent A와 Agent B의 기여도를 직접 비교
- **단계별 채점**: 각 Phase(Opening, Rebuttal, Summary) 종료 시 Judge가 실시간 채점
- **누적 점수제**: 모든 Phase의 점수를 합산하여 최종 승자 결정
- **절대 기준 + 상대 비교**: 각 항목은 절대 기준(0-10)으로 평가하되, 최종 판정은 총점 비교

### 7.2 평가 항목 (Rubric)

| 항목 | 가중치 | 평가 기준 |
|------|--------|----------|
| **논증 (Argumentation)** | 35% | 논리적 타당성, 독창성/깊이, 증거/예시의 적절성 |
| **반론 (Rebuttal)** | 30% | 상대 핵심 논리 파악, 반박의 효과성, 자기 주장으로의 재구성 |
| **전달력 (Delivery)** | 20% | 명확성, 구조화, 어휘/표현의 적절성 |
| **전략 (Strategy)** | 15% | Position 일관성, 역할 수행, 시간/분량 활용 |

### 7.3 단계별 채점 방식

#### Opening 단계
```json
{
  "phase": "opening",
  "criteria": {
    "argumentation": {
      "logic": "0-10: 주장의 논리적 구조",
      "originality": "0-10: 관점의 독창성과 깊이",
      "evidence": "0-10: 근거와 예시의 설득력"
    },
    "delivery": {
      "clarity": "0-10: 표현의 명확성",
      "structure": "0-10: 발언 구조화"
    },
    "strategy": {
      "position_setup": "0-10: Position 정립의 명확성"
    }
  }
}
```

#### Rebuttal 단계
```json
{
  "phase": "rebuttal",
  "criteria": {
    "rebuttal": {
      "targeting": "0-10: 상대 핵심 논리 파악 정확도",
      "effectiveness": "0-10: 반박의 효과성",
      "reconstruction": "0-10: 자기 주장으로 재구성"
    },
    "argumentation": {
      "consistency": "0-10: 기존 주장과의 일관성"
    },
    "delivery": {
      "clarity": "0-10: 반박 논리의 명확성"
    }
  }
}
```

#### Summary 단계
```json
{
  "phase": "summary",
  "criteria": {
    "strategy": {
      "weighing": "0-10: 비교/비중 분석의 설득력",
      "no_new_argument": "-5 페널티: 새 논거 제시 시 감점"
    },
    "argumentation": {
      "synthesis": "0-10: 전체 논증 종합력"
    },
    "delivery": {
      "impact": "0-10: 마무리 임팩트"
    }
  }
}
```

### 7.4 Rubric JSON Schema

```json
{
  "argumentation_weight": 35,
  "rebuttal_weight": 30,
  "delivery_weight": 20,
  "strategy_weight": 15,
  "penalties": {
    "new_argument_in_summary": -5,
    "off_topic": -3,
    "forbidden_phrase": -2
  },
  "judge_style": "strict | balanced | lenient",
  "focus_areas": ["논리적 일관성", "증거 기반 주장"]
}
```

### 7.5 최종 판정 (Verdict)

Judge는 모든 Phase 종료 후 최종 판정을 생성한다.

**Result JSON Schema**
```json
{
  "winner": "A | B | DRAW",
  "final_scores": {
    "A": {
      "argumentation": 28,
      "rebuttal": 24,
      "delivery": 16,
      "strategy": 12,
      "penalties": -2,
      "total": 78
    },
    "B": {
      "argumentation": 30,
      "rebuttal": 22,
      "delivery": 18,
      "strategy": 14,
      "penalties": 0,
      "total": 84
    }
  },
  "margin": 6,
  "verdict_summary": "Agent B가 더 강력한 논증과 명확한 전달력으로 승리했습니다.",
  "detailed_reasoning": {
    "key_moments": [
      "B의 Opening에서 제시한 경제적 근거가 결정적이었습니다",
      "A의 Rebuttal이 B의 핵심 주장을 효과적으로 반박하지 못했습니다"
    ],
    "improvement_suggestions": {
      "A": "증거 기반 주장을 강화하고, 상대 논리의 핵심을 더 정확히 파악할 필요가 있습니다",
      "B": "Summary에서 비교 분석을 더 체계적으로 제시하면 좋겠습니다"
    }
  }
}
```

### 7.6 Judge Fairness 검증

- **Swap Test**: Position A/B를 교체하여 동일 Agent로 재실행 시 판정 일관성 ≥ 85%
- **Bias Detection**: 특정 Agent/Model에 대한 편향 모니터링

---

## 8. Evals (평가 체계)

### 8.1 구조적 평가 (Structural)
- BP Lite 규칙 준수율
- Summary 단계 새 논거 감지율

### 8.2 논리적 평가 (Logical)
- 반박 커버리지 (상대 주장 대응률)
- 주장 일관성 검증

### 8.3 Persona 준수 (Persona Adherence)
- 금칙어 사용 여부
- 말투/스타일 일관성
- 설정된 가치관 반영도

### 8.4 Judge 공정성 (Judge Fairness)
- Swap Test 일관성
- Position 편향 검사

---

## 9. 수용 기준 (Acceptance Criteria)

### 필수 (Must Have)
- [ ] Agent CRUD 정상 동작
- [ ] Agent Preview (1-Turn 검증) 정상 동작
- [ ] Ollama 모델 목록 조회 및 선택 가능
- [ ] Run 생성 및 Agent A/B/J 할당 가능
- [ ] 모든 토론 Phase가 순서대로 실행됨
- [ ] SSE 스트리밍으로 실시간 텍스트 표시
- [ ] React Flow로 노드/엣지 시각화
- [ ] Judge가 각 Phase별 채점 수행
- [ ] 최종 판정(Verdict) 생성 및 표시
- [ ] Run 히스토리 조회 및 Replay 가능

### 권장 (Should Have)
- [ ] Summary 단계 새 논거 감지 및 페널티
- [ ] Persona 금칙어 위반 감지
- [ ] 에러 발생 시 재시도 처리

### 선택 (Nice to Have)
- [ ] 결과 공유 링크 생성
- [ ] Swap Test 자동화
- [ ] Agent 복제 기능

---

## 10. 마일스톤

### M1: Core Foundation
**목표**: Agent 관리 + 기본 토론 워크플로우

| 항목 | 상세 |
|------|------|
| Agent CRUD | 생성, 조회, 수정, 삭제 |
| Agent Preview | 1-Turn 테스트 |
| Ollama 연동 | 모델 목록 조회, 상태 확인 |
| LangGraph 기본 플로우 | BP Lite 단계별 실행 |
| SSE 스트리밍 | 토큰 단위 실시간 전송 |
| DB 스키마 | Agents, Runs, Turns 테이블 |

### M2: Visualization & Judging
**목표**: React Flow 시각화 + 채점 시스템

| 항목 | 상세 |
|------|------|
| React Flow 통합 | Custom Node/Edge, Auto-layout |
| 실시간 그래프 업데이트 | SSE 이벤트 기반 노드 생성 |
| Phase별 채점 | Opening, Rebuttal, Summary 채점 |
| Verdict 생성 | 최종 판정 및 상세 분석 |
| Arena UI | 토론 진행 화면 완성 |

### M3: Polish & Evaluation
**목표**: 안정화 + 평가 체계

| 항목 | 상세 |
|------|------|
| Replay 기능 | 완료된 Run 재생 |
| 규칙 위반 감지 | 새 논거, 금칙어 등 |
| 에러 처리 | 재시도, 실패 상태 관리 |
| Character Showcase | Agent 갤러리 |
| Swap Test | Judge 공정성 검증 |


# CLAUDE.md

VS Arena 프로젝트의 Claude Code 가이드라인입니다.

## Documentation Principles

### TODO.md
- **목적**: 앞으로 해야 할 작업 계획 및 체크리스트
- **내용**: Phase별 작업 목록, 체크박스, Progress Tracking, Notes
- **규칙**: 완료된 작업 상세 기록은 여기에 두지 않음

### CHANGELOG.md
- **목적**: 버전별 변경사항 + 상세 구현 기록
- **구조**:
  - `## [Unreleased]` - 아직 릴리스되지 않은 변경사항
  - `## [x.y.z] - YYYY-MM-DD` - 버전별 변경사항 (Added, Changed, Fixed, Removed)
  - `## Development Log` - 상세 구현 기록 (목표, 구현 내용, 결과, 관련 파일, Commits)
- **형식**: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) 준수

### 작업 완료 시
1. TODO.md에서 해당 항목 체크 `[x]`
2. CHANGELOG.md의 `[Unreleased]` 또는 `Development Log`에 상세 기록 추가
3. 코드와 문서를 함께 커밋

## Commit Message Format

VS Arena 프로젝트의 모든 커밋은 다음 형식을 따릅니다:

### 제목 (Title)
```
Phase X.Y: [Feature name] [status]
```

예시:
- `Phase 1.8: Frontend Agent Module complete`
- `Phase 1.9: Frontend Debate Setup complete`
- `Code validation fixes - Address critical issues`

### 본문 (Body)

```
[한 줄 요약 - 무엇을 구현했는지 간단히 설명]

Added:
- [추가된 기능 1]
  * [상세 내용]
  * [상세 내용]
- [추가된 기능 2]
- ...

Changed:
- [변경된 내용]

Fixed:
- [수정된 버그/이슈]

Files:
- [수정된 파일 경로] - [변경 내용]
- [생성된 파일 경로] - [설명]
- ...

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### 규칙
1. **제목**: 50자 이내, Phase 번호 포함 (해당하는 경우)
2. **본문**:
   - 첫 줄에 간단한 요약 (무엇을, 왜)
   - Added/Changed/Fixed 섹션으로 구분
   - bullet points 사용, 상세 내용은 `*`로 하위 항목 표시
3. **Files 섹션**: 주요 변경 파일 목록과 설명
4. **서명**: Claude Code 생성 표시 + Co-Authored-By 포함
5. **HEREDOC 사용**: 여러 줄 커밋 메시지는 `cat <<'EOF'`로 작성

### 예시

<details>
<summary>Phase 완료 커밋 예시</summary>

```bash
git commit -m "$(cat <<'EOF'
Phase 1.9: Frontend Debate Setup complete

Implemented complete debate configuration and streaming UI with all components,
hooks, and pages for setting up and watching debates in real-time.

Added:
- Debate types (DebateStartRequest, DebateConfig, RubricConfig, Run, RunDetail, DebatePhase)
- API functions (startDebate, getRuns, getRun)
- TanStack Query hooks (useStartDebate, useRuns, useRun)
- SSE streaming hook (useDebateStream) with phase tracking, scores, and verdict
- Debate components:
  * AgentSelector - Agent dropdown with model badge
  * PositionSelector - FOR/AGAINST selector with color distinction
  * DebateConfig - Collapsible configuration
  * RubricEditor - Weight sliders for scoring
  * DebateSetupForm - Main form with validation
  * DebateStreamView - Real-time streaming display
- App Router pages:
  * /debate - Debate setup form
  * /debate/arena/[runId] - Live streaming arena
- Position validation and rubric total validation

Files:
- frontend/lib/types.ts - Added debate types
- frontend/lib/api-client.ts - Added debate API functions
- frontend/hooks/use-debate.ts - Debate CRUD hooks
- frontend/hooks/use-debate-stream.ts - SSE streaming
- frontend/components/debate/* - 6 debate components
- frontend/app/debate/page.tsx - Updated with form
- frontend/app/debate/arena/[runId]/page.tsx - Arena page
- CHANGELOG.md - Updated with Phase 1.9
- todo.md - Marked Phase 1.9 complete

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```
</details>

<details>
<summary>버그 수정 커밋 예시</summary>

```bash
git commit -m "$(cat <<'EOF'
Code validation fixes - Address critical issues

Fixed SSE event type mismatch and memory leak in agent preview hook.

Fixed:
- SSE event type mismatch in useAgentPreview
  * Changed from "token"/"phase_end" to "chunk"/"done"
  * Matches backend SSE event names
- Memory leak in useAgentPreview hook
  * Added cleanup on unmount with AbortController
  * Prevents dangling streams
- Hardcoded API URLs replaced with NEXT_PUBLIC_API_URL

Files:
- frontend/hooks/use-agent-preview.ts - Fixed event types and cleanup
- frontend/lib/api-client.ts - Use environment variable

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```
</details>

## Tech Stack

- **Backend**: Python 3.12+, FastAPI, LangGraph, SQLAlchemy, Pydantic
- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **Database**: PostgreSQL 17+
- **LLM**: Ollama (local)
- **Streaming**: SSE (Server-Sent Events)

## Development Commands

```bash
# Backend
cd backend && uvicorn app.main:app --reload

# Frontend
cd frontend && npm run dev

# Database
docker-compose up -d
```

## Project Structure

```
vs-arena/
├── backend/          # FastAPI + LangGraph
├── frontend/         # Next.js + React
├── docker/           # Docker configurations
├── docs/             # Documentation
├── CHANGELOG.md      # Version history + Development log
└── todo.md           # Task checklist
```

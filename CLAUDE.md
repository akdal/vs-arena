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

```
Phase X.Y: [Feature name] complete

[한 줄 요약]

Added/Changed/Fixed:
- [변경 내용]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <model> <noreply@anthropic.com>
```

**규칙:**
- 제목: Phase 번호 + 기능명 (50자 이내)
- 본문: Added/Changed/Fixed 섹션으로 구분, bullet points 사용
- 서명: Claude Code 표시 + Co-Authored-By 필수

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

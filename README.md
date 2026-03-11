# Trend to Video Studio

An automation-first content pipeline for:
- discovering trending video topics
- extracting reusable structure from public examples
- generating original prompts/storyboards
- producing original AI videos
- preparing uploads for YouTube scheduling

## Scope
This project is designed for original content generation and publishing workflows.
It does **not** implement watermark removal, DRM bypass, or direct cloning of protected media.

## MVP Modules
1. Trend discovery
2. Source analysis
3. Screenshot / keyframe extraction
4. Prompt generation
5. AI video generation adapter
6. Asset packaging
7. YouTube upload + scheduling
8. Job orchestration dashboard

## Stack (planned)
- Next.js / TypeScript
- Node job runners
- Supabase or SQLite/Postgres for jobs + metadata
- YouTube Data API
- Pluggable video generation providers

## Status
Phase 4 operator workflow MVP in progress on 2026-03-11.
- shared local repository added for cross-process state
- web API and worker now read/write the same project snapshot file
- dashboard actions added for candidate intake and pipeline steps
- worker now supports command modes for batch run / single run / dry run
- repository abstraction baseline added via `ProjectRepository`
- pipeline event log added for operator debugging
- YouTube URL validation + normalization added for watch, shorts, and youtu.be formats
- video provider registry added for generation routing
- baseline analysis provider added for provider-based source analysis output
- prompt drafts now generate from analysis artifact counts and types instead of fixed mock text
- SQLite snapshot store support added behind env-selectable driver
- next milestone: richer analysis adapters with extracted content summaries, real generation/upload integrations, and enabling native SQLite on host

## Monorepo Layout
- `apps/web` — Next.js app router web UI
- `apps/worker` — TypeScript worker runtime
- `packages/core` — shared types, repository, validation, and event log
- `packages/providers` — provider interfaces and mock adapter

## Commands
- `pnpm dev:web`
- `pnpm dev:worker`
- `pnpm build`
- `pnpm typecheck`

## Data Storage
Default repository driver:
- `json`

Default snapshot paths:
- SQLite: `.data/project-snapshot.sqlite`
- JSON fallback: `.data/project-snapshot.json`

Override with environment variables:
- `TREND_TO_VIDEO_REPOSITORY_DRIVER=sqlite|json`
- `TREND_TO_VIDEO_SQLITE_FILE=/absolute/path/to/project-snapshot.sqlite`
- `TREND_TO_VIDEO_DATA_FILE=/absolute/path/to/project-snapshot.json`

When `sqlite` is active, the app auto-migrates the existing JSON snapshot into SQLite on first read if a SQLite snapshot does not exist yet.

## API Notes
`POST /api/trend-candidates` accepts:
- `topic`
- `sourceUrl`
- `sourcePlatform` (`youtube` | `shorts` | `manual`)

For non-manual inputs, the backend validates and normalizes supported YouTube URLs before persistence.

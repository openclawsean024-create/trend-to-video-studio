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
Phase 3 local persistent MVP in progress on 2026-03-11.
- shared local JSON repository added for cross-process state
- web API and worker now read/write the same project snapshot file
- next milestone: interactive dashboard actions and real provider/storage integrations

## Monorepo Layout
- `apps/web` — Next.js app router web UI
- `apps/worker` — TypeScript worker runtime
- `packages/core` — shared types and schemas
- `packages/providers` — provider interfaces and mock adapter

## Commands
- `pnpm dev:web`
- `pnpm dev:worker`
- `pnpm build`
- `pnpm typecheck`

# Project Plan — Trend to Video Studio

## Product Goal
Build a semi/fully automated pipeline that converts trending topic signals into original short-form video outputs and scheduled YouTube uploads.

## User Outcome
A single operator can:
1. collect trend inputs
2. approve or auto-filter candidate topics
3. generate original prompts/storyboards
4. trigger AI video generation
5. package title/description/tags/thumbnail assets
6. schedule uploads to YouTube automatically

## Compliance Boundary
Allowed:
- trend discovery
- public metadata analysis
- keyframe extraction from user-provided or approved sources
- original prompt generation
- original video generation
- automated publishing

Not included:
- watermark removal
- copying or republishing protected media
- bypassing platform restrictions
- direct cloning of other creators' media assets

## MVP Architecture

### 1. Trend Discovery Service
Inputs:
- YouTube trending / search result URLs
- curated keyword sets
- user-provided source links

Outputs:
- ranked trend candidates
- topic metadata
- reusable theme clusters

### 2. Analysis Service
Inputs:
- source URLs or uploaded reference media
Outputs:
- transcript / summary
- scene/keyframe timeline
- visual motifs
- prompt ingredients

### 3. Prompt Studio
Outputs:
- video prompt
- image prompt
- shot list
- thumbnail prompt
- title variants
- description / tags

### 4. Video Generation Adapter
Supports provider abstraction for:
- Sora-compatible workflow later
- other generation backends first if needed

### 5. Publishing Service
- YouTube upload
- scheduling
- metadata writeback
- run log

### 6. Admin Dashboard
Views:
- jobs
- trend candidates
- approved concepts
- generated assets
- publish queue

## Suggested Initial Folder Layout
- /apps/web
- /apps/worker
- /packages/core
- /packages/providers
- /docs

## P0 Build Sequence
1. repo scaffold
2. trend candidate schema
3. URL ingestion
4. screenshot/keyframe pipeline
5. prompt generator
6. publish queue model
7. YouTube scheduler integration

## P1 Extensions
- multi-channel support
- A/B title testing
- thumbnail testing
- analytics feedback loop
- auto-retry / quota monitor

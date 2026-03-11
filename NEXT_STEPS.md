# Next Steps

## Immediate
- add dashboard forms/actions for creating candidates and triggering pipeline steps
- add worker command modes: process-all / process-one / dry-run
- add repository abstraction so local JSON can later swap to SQLite or Supabase
- add validation helpers for source URLs and scheduled timestamps

## Recommended MVP choices
- Name: trend-to-video-studio
- Storage: local JSON now, repository abstraction next, SQLite after that
- Sources: YouTube first
- Generation: provider adapter stub first, real backend second
- Upload: YouTube scheduling first

## Current status
1. monorepo scaffold complete
2. schemas for TrendCandidate / PromptDraft / VideoJob / UploadJob complete
3. trend URL intake endpoint complete
4. analysis / prompt / video / upload mock pipeline complete
5. shared persistent snapshot storage complete
6. next focus: usable operator dashboard + commandable worker

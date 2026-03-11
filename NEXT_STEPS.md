# Next Steps

## Immediate
- add repository abstraction so local JSON can later swap to SQLite or Supabase
- add explicit pipeline action log / event history for operator debugging
- add worker command modes to package scripts and docs
- add source-specific validation for YouTube URLs and platform inference

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
6. operator dashboard actions complete
7. worker CLI modes complete
8. repository abstraction baseline complete via ProjectRepository + JSON implementation
9. pipeline event history complete for operator debugging
10. YouTube watch / shorts / youtu.be validation + normalization complete
11. SQLite support added with JSON auto-migration path + env-selectable driver (kept non-default until native build is enabled on host)
12. next focus: enable native SQLite build on host, then switch default driver; after that, real analysis adapter, real generation/upload integrations, and structured relational schema beyond snapshot-blob mode

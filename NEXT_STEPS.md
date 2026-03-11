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
8. next focus: repository abstraction + richer validation + real integrations

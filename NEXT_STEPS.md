# Next Steps

## Immediate
- confirm project name
- choose storage: Supabase vs local SQLite first
- choose first trend source: YouTube only vs multi-source
- choose first video provider integration

## Recommended MVP choices
- Name: trend-to-video-studio
- Storage: SQLite first, abstract repository layer
- Sources: YouTube only
- Generation: provider adapter stub first, real backend second
- Upload: YouTube scheduling first

## First implementation tasks
1. create monorepo app scaffold
2. define schemas for TrendCandidate / ContentJob / UploadJob
3. implement trend URL intake endpoint
4. implement screenshot extraction worker
5. implement prompt generation templates
6. implement YouTube upload config flow

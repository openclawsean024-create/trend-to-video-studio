export type JobStatus = 'draft' | 'queued' | 'processing' | 'completed' | 'failed';

export type TrendCandidate = {
  id: string;
  topic: string;
  sourceUrl: string;
  sourcePlatform: 'youtube' | 'shorts' | 'manual';
  discoveredAt: string;
  status: JobStatus;
};

export type CreateTrendCandidateInput = {
  topic: string;
  sourceUrl: string;
  sourcePlatform: TrendCandidate['sourcePlatform'];
};

export type SourceAsset = {
  id: string;
  trendCandidateId: string;
  assetType: 'url' | 'screenshot' | 'transcript' | 'metadata';
  uri: string;
  createdAt: string;
};

export type PromptDraft = {
  id: string;
  trendCandidateId: string;
  title: string;
  videoPrompt: string;
  thumbnailPrompt: string;
  createdAt: string;
  status: JobStatus;
};

export type VideoJob = {
  id: string;
  promptDraftId: string;
  provider: string;
  status: JobStatus;
  createdAt: string;
};

export type UploadJob = {
  id: string;
  videoJobId: string;
  platform: 'youtube';
  scheduledFor: string;
  status: JobStatus;
};

export type ProjectSnapshot = {
  trendCandidates: TrendCandidate[];
  sourceAssets: SourceAsset[];
  promptDrafts: PromptDraft[];
  videoJobs: VideoJob[];
  uploadJobs: UploadJob[];
};

export const exampleTrendCandidate: TrendCandidate = {
  id: 'trend_001',
  topic: 'AI generated short-form storytelling',
  sourceUrl: 'https://www.youtube.com/watch?v=example123',
  sourcePlatform: 'youtube',
  discoveredAt: new Date('2026-03-11T10:00:00Z').toISOString(),
  status: 'queued',
};

export const examplePromptDraft: PromptDraft = {
  id: 'prompt_001',
  trendCandidateId: 'trend_001',
  title: 'AI Storytelling Shorts Concept',
  videoPrompt: 'Create a fast-paced short-form original AI storytelling trailer with cinematic pacing.',
  thumbnailPrompt: 'Cinematic AI storyteller, neon lighting, high contrast, short-form content cover art.',
  createdAt: new Date('2026-03-11T10:10:00Z').toISOString(),
  status: 'draft',
};

export const exampleVideoJob: VideoJob = {
  id: 'video_001',
  promptDraftId: 'prompt_001',
  provider: 'mock-sora-adapter',
  status: 'queued',
  createdAt: new Date('2026-03-11T10:15:00Z').toISOString(),
};

export const exampleUploadJob: UploadJob = {
  id: 'upload_001',
  videoJobId: 'video_001',
  platform: 'youtube',
  scheduledFor: new Date('2026-03-12T10:00:00Z').toISOString(),
  status: 'draft',
};

const inMemoryTrendCandidates: TrendCandidate[] = [exampleTrendCandidate];
const inMemorySourceAssets: SourceAsset[] = [
  {
    id: 'asset_001',
    trendCandidateId: 'trend_001',
    assetType: 'metadata',
    uri: 'memory://trend_001/metadata.json',
    createdAt: new Date('2026-03-11T10:02:00Z').toISOString(),
  },
];

export const exampleSnapshot: ProjectSnapshot = {
  trendCandidates: [exampleTrendCandidate],
  sourceAssets: [...inMemorySourceAssets],
  promptDrafts: [examplePromptDraft],
  videoJobs: [exampleVideoJob],
  uploadJobs: [exampleUploadJob],
};

export function listTrendCandidates(): TrendCandidate[] {
  return [...inMemoryTrendCandidates].sort((a, b) => b.discoveredAt.localeCompare(a.discoveredAt));
}

export function createTrendCandidate(input: CreateTrendCandidateInput): TrendCandidate {
  const created: TrendCandidate = {
    id: `trend_${Date.now()}`,
    topic: input.topic,
    sourceUrl: input.sourceUrl,
    sourcePlatform: input.sourcePlatform,
    discoveredAt: new Date().toISOString(),
    status: 'queued',
  };

  inMemoryTrendCandidates.unshift(created);
  return created;
}

export function listQueuedTrendCandidates(): TrendCandidate[] {
  return inMemoryTrendCandidates.filter((candidate) => candidate.status === 'queued');
}

export function listSourceAssets(): SourceAsset[] {
  return [...inMemorySourceAssets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listSourceAssetsByTrendCandidate(trendCandidateId: string): SourceAsset[] {
  return inMemorySourceAssets.filter((asset) => asset.trendCandidateId === trendCandidateId);
}

export function createMockAnalysisArtifacts(trendCandidateId: string): SourceAsset[] {
  const createdAt = new Date().toISOString();
  const artifacts: SourceAsset[] = [
    {
      id: `asset_meta_${Date.now()}`,
      trendCandidateId,
      assetType: 'metadata',
      uri: `memory://${trendCandidateId}/metadata.json`,
      createdAt,
    },
    {
      id: `asset_shot_${Date.now()}`,
      trendCandidateId,
      assetType: 'screenshot',
      uri: `memory://${trendCandidateId}/shot-001.png`,
      createdAt,
    },
  ];

  inMemorySourceAssets.unshift(...artifacts);
  return artifacts;
}

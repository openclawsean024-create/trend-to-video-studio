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
  outputUrl?: string;
  status: JobStatus;
  createdAt: string;
};

export type UploadJob = {
  id: string;
  videoJobId: string;
  platform: 'youtube';
  scheduledFor: string;
  createdAt: string;
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

const inMemoryPromptDrafts: PromptDraft[] = [];
const inMemoryVideoJobs: VideoJob[] = [];
const inMemoryUploadJobs: UploadJob[] = [];

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
  outputUrl: 'memory://video/output.mp4',
  status: 'queued',
  createdAt: new Date('2026-03-11T10:15:00Z').toISOString(),
};

export const exampleUploadJob: UploadJob = {
  id: 'upload_001',
  videoJobId: 'video_001',
  platform: 'youtube',
  scheduledFor: new Date('2026-03-12T10:00:00Z').toISOString(),
  createdAt: new Date('2026-03-11T10:20:00Z').toISOString(),
  status: 'draft',
};

inMemoryPromptDrafts.push(examplePromptDraft);
inMemoryVideoJobs.push(exampleVideoJob);
inMemoryUploadJobs.push(exampleUploadJob);

export const exampleSnapshot: ProjectSnapshot = {
  trendCandidates: [...inMemoryTrendCandidates],
  sourceAssets: [...inMemorySourceAssets],
  promptDrafts: [...inMemoryPromptDrafts],
  videoJobs: [...inMemoryVideoJobs],
  uploadJobs: [...inMemoryUploadJobs],
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

export function listPromptDrafts(): PromptDraft[] {
  return [...inMemoryPromptDrafts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listPromptDraftsByTrendCandidate(trendCandidateId: string): PromptDraft[] {
  return inMemoryPromptDrafts.filter((draft) => draft.trendCandidateId === trendCandidateId);
}

export function createMockPromptDraft(trendCandidateId: string): PromptDraft {
  const trendCandidate = inMemoryTrendCandidates.find((candidate) => candidate.id === trendCandidateId);
  const sourceAssets = listSourceAssetsByTrendCandidate(trendCandidateId);
  const topic = trendCandidate?.topic ?? 'Untitled trend';
  const created: PromptDraft = {
    id: `prompt_${Date.now()}`,
    trendCandidateId,
    title: `${topic} Prompt Draft`,
    videoPrompt: `Create an original short-form video inspired by ${topic}. Use ${sourceAssets.length} analyzed source assets as structural inspiration only, not as direct copies.`,
    thumbnailPrompt: `Create a high-contrast thumbnail for ${topic} with a clear focal subject and bold text space.`,
    createdAt: new Date().toISOString(),
    status: 'draft',
  };

  inMemoryPromptDrafts.unshift(created);
  return created;
}

export function listVideoJobs(): VideoJob[] {
  return [...inMemoryVideoJobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createVideoJob(promptDraftId: string, provider = 'mock-sora-adapter'): VideoJob {
  const created: VideoJob = {
    id: `video_${Date.now()}`,
    promptDraftId,
    provider,
    status: 'queued',
    createdAt: new Date().toISOString(),
  };

  inMemoryVideoJobs.unshift(created);
  return created;
}

export function updateVideoJobResult(videoJobId: string, outputUrl: string, status: JobStatus = 'completed'): VideoJob | undefined {
  const job = inMemoryVideoJobs.find((item) => item.id === videoJobId);
  if (!job) return undefined;

  job.outputUrl = outputUrl;
  job.status = status;
  return job;
}

export function listUploadJobs(): UploadJob[] {
  return [...inMemoryUploadJobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export type JobStatus = 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
export type SourcePlatform = 'youtube' | 'shorts' | 'manual';

export type TrendCandidate = {
  id: string;
  topic: string;
  sourceUrl: string;
  sourcePlatform: SourcePlatform;
  discoveredAt: string;
  status: JobStatus;
};

export type CreateTrendCandidateInput = {
  topic: string;
  sourceUrl: string;
  sourcePlatform: SourcePlatform;
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

const DEFAULT_DATA_FILE = resolve(process.cwd(), '.data', 'project-snapshot.json');
const dataFile = process.env.TREND_TO_VIDEO_DATA_FILE
  ? resolve(process.env.TREND_TO_VIDEO_DATA_FILE)
  : DEFAULT_DATA_FILE;

const exampleTrendCandidate: TrendCandidate = {
  id: 'trend_001',
  topic: 'AI generated short-form storytelling',
  sourceUrl: 'https://www.youtube.com/watch?v=example123',
  sourcePlatform: 'youtube',
  discoveredAt: new Date('2026-03-11T10:00:00Z').toISOString(),
  status: 'queued',
};

const examplePromptDraft: PromptDraft = {
  id: 'prompt_001',
  trendCandidateId: 'trend_001',
  title: 'AI Storytelling Shorts Concept',
  videoPrompt: 'Create a fast-paced short-form original AI storytelling trailer with cinematic pacing.',
  thumbnailPrompt: 'Cinematic AI storyteller, neon lighting, high contrast, short-form content cover art.',
  createdAt: new Date('2026-03-11T10:10:00Z').toISOString(),
  status: 'draft',
};

const exampleVideoJob: VideoJob = {
  id: 'video_001',
  promptDraftId: 'prompt_001',
  provider: 'mock-sora-adapter',
  outputUrl: 'memory://video/output.mp4',
  status: 'completed',
  createdAt: new Date('2026-03-11T10:15:00Z').toISOString(),
};

const exampleUploadJob: UploadJob = {
  id: 'upload_001',
  videoJobId: 'video_001',
  platform: 'youtube',
  scheduledFor: new Date('2026-03-12T10:00:00Z').toISOString(),
  createdAt: new Date('2026-03-11T10:20:00Z').toISOString(),
  status: 'draft',
};

const initialSnapshot: ProjectSnapshot = {
  trendCandidates: [exampleTrendCandidate],
  sourceAssets: [
    {
      id: 'asset_001',
      trendCandidateId: 'trend_001',
      assetType: 'metadata',
      uri: 'memory://trend_001/metadata.json',
      createdAt: new Date('2026-03-11T10:02:00Z').toISOString(),
    },
  ],
  promptDrafts: [examplePromptDraft],
  videoJobs: [exampleVideoJob],
  uploadJobs: [exampleUploadJob],
};

function ensureDataFile() {
  const folder = dirname(dataFile);
  if (!existsSync(folder)) {
    mkdirSync(folder, { recursive: true });
  }

  if (!existsSync(dataFile)) {
    writeFileSync(dataFile, JSON.stringify(initialSnapshot, null, 2), 'utf8');
  }
}

function readSnapshot(): ProjectSnapshot {
  ensureDataFile();

  try {
    const raw = readFileSync(dataFile, 'utf8');
    const parsed = JSON.parse(raw) as Partial<ProjectSnapshot>;

    return {
      trendCandidates: parsed.trendCandidates ?? [],
      sourceAssets: parsed.sourceAssets ?? [],
      promptDrafts: parsed.promptDrafts ?? [],
      videoJobs: parsed.videoJobs ?? [],
      uploadJobs: parsed.uploadJobs ?? [],
    };
  } catch {
    writeSnapshot(initialSnapshot);
    return structuredClone(initialSnapshot);
  }
}

function writeSnapshot(snapshot: ProjectSnapshot) {
  ensureDataFile();
  writeFileSync(dataFile, JSON.stringify(snapshot, null, 2), 'utf8');
}

function mutateSnapshot<T>(mutator: (snapshot: ProjectSnapshot) => T): T {
  const snapshot = readSnapshot();
  const result = mutator(snapshot);
  writeSnapshot(snapshot);
  return result;
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getDataFilePath() {
  ensureDataFile();
  return dataFile;
}

export function getProjectSnapshot(): ProjectSnapshot {
  return readSnapshot();
}

export function normalizeSourcePlatform(value: string | undefined | null): SourcePlatform {
  if (value === 'shorts') return 'shorts';
  if (value === 'manual') return 'manual';
  return 'youtube';
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidIsoDateTime(value: string): boolean {
  if (!value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

export function validateTrendCandidateInput(input: CreateTrendCandidateInput): string[] {
  const errors: string[] = [];

  if (!input.topic.trim()) {
    errors.push('topic is required');
  }

  if (!input.sourceUrl.trim()) {
    errors.push('sourceUrl is required');
  } else if (!isValidUrl(input.sourceUrl)) {
    errors.push('sourceUrl must be a valid http or https URL');
  }

  return errors;
}

export function listTrendCandidates(): TrendCandidate[] {
  return [...readSnapshot().trendCandidates].sort((a, b) => b.discoveredAt.localeCompare(a.discoveredAt));
}

export function getTrendCandidateById(trendCandidateId: string): TrendCandidate | undefined {
  return readSnapshot().trendCandidates.find((item) => item.id === trendCandidateId);
}

export function createTrendCandidate(input: CreateTrendCandidateInput): TrendCandidate {
  return mutateSnapshot((snapshot) => {
    const created: TrendCandidate = {
      id: createId('trend'),
      topic: input.topic.trim(),
      sourceUrl: input.sourceUrl.trim(),
      sourcePlatform: input.sourcePlatform,
      discoveredAt: new Date().toISOString(),
      status: 'queued',
    };

    snapshot.trendCandidates.unshift(created);
    return created;
  });
}

export function listQueuedTrendCandidates(): TrendCandidate[] {
  return readSnapshot().trendCandidates.filter((candidate) => candidate.status === 'queued');
}

export function updateTrendCandidateStatus(trendCandidateId: string, status: JobStatus): TrendCandidate | undefined {
  return mutateSnapshot((snapshot) => {
    const candidate = snapshot.trendCandidates.find((item) => item.id === trendCandidateId);
    if (!candidate) return undefined;
    candidate.status = status;
    return candidate;
  });
}

export function listSourceAssets(): SourceAsset[] {
  return [...readSnapshot().sourceAssets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listSourceAssetsByTrendCandidate(trendCandidateId: string): SourceAsset[] {
  return readSnapshot().sourceAssets.filter((asset) => asset.trendCandidateId === trendCandidateId);
}

export function createMockAnalysisArtifacts(trendCandidateId: string): SourceAsset[] {
  return mutateSnapshot((snapshot) => {
    const createdAt = new Date().toISOString();
    const artifacts: SourceAsset[] = [
      {
        id: createId('asset_meta'),
        trendCandidateId,
        assetType: 'metadata',
        uri: `memory://${trendCandidateId}/metadata.json`,
        createdAt,
      },
      {
        id: createId('asset_shot'),
        trendCandidateId,
        assetType: 'screenshot',
        uri: `memory://${trendCandidateId}/shot-001.png`,
        createdAt,
      },
    ];

    snapshot.sourceAssets.unshift(...artifacts);
    return artifacts;
  });
}

export function listPromptDrafts(): PromptDraft[] {
  return [...readSnapshot().promptDrafts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function listPromptDraftsByTrendCandidate(trendCandidateId: string): PromptDraft[] {
  return readSnapshot().promptDrafts.filter((draft) => draft.trendCandidateId === trendCandidateId);
}

export function getPromptDraftById(promptDraftId: string): PromptDraft | undefined {
  return readSnapshot().promptDrafts.find((draft) => draft.id === promptDraftId);
}

export function createMockPromptDraft(trendCandidateId: string): PromptDraft {
  return mutateSnapshot((snapshot) => {
    const trendCandidate = snapshot.trendCandidates.find((candidate) => candidate.id === trendCandidateId);
    const sourceAssets = snapshot.sourceAssets.filter((asset) => asset.trendCandidateId === trendCandidateId);
    const topic = trendCandidate?.topic ?? 'Untitled trend';
    const created: PromptDraft = {
      id: createId('prompt'),
      trendCandidateId,
      title: `${topic} Prompt Draft`,
      videoPrompt: `Create an original short-form video inspired by ${topic}. Use ${sourceAssets.length} analyzed source assets as structural inspiration only, not as direct copies.`,
      thumbnailPrompt: `Create a high-contrast thumbnail for ${topic} with a clear focal subject and bold text space.`,
      createdAt: new Date().toISOString(),
      status: 'draft',
    };

    snapshot.promptDrafts.unshift(created);
    return created;
  });
}

export function listVideoJobs(): VideoJob[] {
  return [...readSnapshot().videoJobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getVideoJobById(videoJobId: string): VideoJob | undefined {
  return readSnapshot().videoJobs.find((job) => job.id === videoJobId);
}

export function createVideoJob(promptDraftId: string, provider = 'mock-sora-adapter'): VideoJob {
  return mutateSnapshot((snapshot) => {
    const created: VideoJob = {
      id: createId('video'),
      promptDraftId,
      provider,
      status: 'queued',
      createdAt: new Date().toISOString(),
    };

    snapshot.videoJobs.unshift(created);
    return created;
  });
}

export function updateVideoJobResult(videoJobId: string, outputUrl: string, status: JobStatus = 'completed'): VideoJob | undefined {
  return mutateSnapshot((snapshot) => {
    const job = snapshot.videoJobs.find((item) => item.id === videoJobId);
    if (!job) return undefined;

    job.outputUrl = outputUrl;
    job.status = status;
    return job;
  });
}

export function listUploadJobs(): UploadJob[] {
  return [...readSnapshot().uploadJobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createUploadJob(videoJobId: string, scheduledFor: string): UploadJob {
  return mutateSnapshot((snapshot) => {
    const created: UploadJob = {
      id: createId('upload'),
      videoJobId,
      platform: 'youtube',
      scheduledFor,
      createdAt: new Date().toISOString(),
      status: 'queued',
    };

    snapshot.uploadJobs.unshift(created);
    return created;
  });
}

export function completeUploadJob(uploadJobId: string): UploadJob | undefined {
  return mutateSnapshot((snapshot) => {
    const job = snapshot.uploadJobs.find((item) => item.id === uploadJobId);
    if (!job) return undefined;

    job.status = 'completed';
    return job;
  });
}

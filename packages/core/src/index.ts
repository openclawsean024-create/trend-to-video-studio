import Database from 'better-sqlite3';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export type JobStatus = 'draft' | 'queued' | 'processing' | 'completed' | 'failed';
export type SourcePlatform = 'youtube' | 'shorts' | 'manual';
export type PipelineEventType =
  | 'trend_candidate_created'
  | 'trend_candidate_status_updated'
  | 'analysis_artifacts_created'
  | 'prompt_draft_created'
  | 'video_job_created'
  | 'video_job_updated'
  | 'upload_job_created'
  | 'upload_job_completed';

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

export type CreateSourceAssetInput = {
  trendCandidateId: string;
  assetType: SourceAsset['assetType'];
  uri: string;
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

export type CreatePromptDraftInput = {
  trendCandidateId: string;
  title: string;
  videoPrompt: string;
  thumbnailPrompt: string;
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

export type PipelineEvent = {
  id: string;
  type: PipelineEventType;
  entityType: 'trendCandidate' | 'sourceAsset' | 'promptDraft' | 'videoJob' | 'uploadJob' | 'system';
  entityId: string;
  message: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type ProjectSnapshot = {
  trendCandidates: TrendCandidate[];
  sourceAssets: SourceAsset[];
  promptDrafts: PromptDraft[];
  videoJobs: VideoJob[];
  uploadJobs: UploadJob[];
  pipelineEvents: PipelineEvent[];
};

export type YouTubeUrlDetails = {
  kind: 'watch' | 'shorts' | 'youtu.be';
  normalizedUrl: string;
  inferredPlatform: Extract<SourcePlatform, 'youtube' | 'shorts'>;
  videoId: string;
};

export type TrendCandidateValidationResult = {
  errors: string[];
  normalizedSourceUrl: string;
  inferredSourcePlatform: SourcePlatform;
  youtube?: YouTubeUrlDetails;
};

const DEFAULT_DATA_DIR = resolve(process.cwd(), '.data');
const DEFAULT_JSON_DATA_FILE = resolve(DEFAULT_DATA_DIR, 'project-snapshot.json');
const DEFAULT_SQLITE_DATA_FILE = resolve(DEFAULT_DATA_DIR, 'project-snapshot.sqlite');
const dataFile = process.env.TREND_TO_VIDEO_DATA_FILE
  ? resolve(process.env.TREND_TO_VIDEO_DATA_FILE)
  : DEFAULT_JSON_DATA_FILE;
const sqliteFile = process.env.TREND_TO_VIDEO_SQLITE_FILE
  ? resolve(process.env.TREND_TO_VIDEO_SQLITE_FILE)
  : DEFAULT_SQLITE_DATA_FILE;
const repositoryDriver = (process.env.TREND_TO_VIDEO_REPOSITORY_DRIVER ?? 'json').toLowerCase();

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
  pipelineEvents: [
    {
      id: 'event_001',
      type: 'trend_candidate_created',
      entityType: 'trendCandidate',
      entityId: 'trend_001',
      message: 'Seed trend candidate created',
      createdAt: new Date('2026-03-11T10:00:00Z').toISOString(),
      metadata: {
        topic: exampleTrendCandidate.topic,
        sourcePlatform: exampleTrendCandidate.sourcePlatform,
      },
    },
  ],
};

function ensureParentDirectory(targetPath: string) {
  const folder = dirname(targetPath);
  if (!existsSync(folder)) {
    mkdirSync(folder, { recursive: true });
  }
}

function normalizeSnapshot(parsed: Partial<ProjectSnapshot>): ProjectSnapshot {
  return {
    trendCandidates: parsed.trendCandidates ?? [],
    sourceAssets: parsed.sourceAssets ?? [],
    promptDrafts: parsed.promptDrafts ?? [],
    videoJobs: parsed.videoJobs ?? [],
    uploadJobs: parsed.uploadJobs ?? [],
    pipelineEvents: parsed.pipelineEvents ?? [],
  };
}

function ensureJsonDataFile() {
  ensureParentDirectory(dataFile);

  if (!existsSync(dataFile)) {
    writeFileSync(dataFile, JSON.stringify(initialSnapshot, null, 2), 'utf8');
  }
}

function readSnapshotFromJsonDisk(): ProjectSnapshot {
  ensureJsonDataFile();

  try {
    const raw = readFileSync(dataFile, 'utf8');
    const parsed = JSON.parse(raw) as Partial<ProjectSnapshot>;
    return normalizeSnapshot(parsed);
  } catch {
    writeSnapshotToJsonDisk(initialSnapshot);
    return structuredClone(initialSnapshot);
  }
}

function writeSnapshotToJsonDisk(snapshot: ProjectSnapshot) {
  ensureJsonDataFile();
  writeFileSync(dataFile, JSON.stringify(snapshot, null, 2), 'utf8');
}

function ensureSqliteDatabaseFile() {
  ensureParentDirectory(sqliteFile);
}

function createSqliteDatabaseConnection() {
  ensureSqliteDatabaseFile();
  const database = new Database(sqliteFile);
  database.pragma('journal_mode = WAL');
  database.exec(`
    CREATE TABLE IF NOT EXISTS project_snapshot (
      key TEXT PRIMARY KEY,
      json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  return database;
}

function writeSnapshotToSqlite(snapshot: ProjectSnapshot): void {
  const database = createSqliteDatabaseConnection();
  const json = JSON.stringify(snapshot);
  const updatedAt = new Date().toISOString();

  database
    .prepare(
      `
        INSERT INTO project_snapshot (key, json, updated_at)
        VALUES ('default', ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          json = excluded.json,
          updated_at = excluded.updated_at
      `,
    )
    .run(json, updatedAt);

  database.close();
}

function migrateJsonSnapshotToSqliteIfNeeded(database: Database.Database): void {
  const row = database
    .prepare('SELECT json FROM project_snapshot WHERE key = ?')
    .get('default') as { json: string } | undefined;

  if (row?.json) {
    return;
  }

  const seedSnapshot = existsSync(dataFile) ? readSnapshotFromJsonDisk() : structuredClone(initialSnapshot);
  database
    .prepare('INSERT INTO project_snapshot (key, json, updated_at) VALUES (?, ?, ?)')
    .run('default', JSON.stringify(seedSnapshot), new Date().toISOString());
}

function readSnapshotFromSqlite(): ProjectSnapshot {
  const database = createSqliteDatabaseConnection();
  migrateJsonSnapshotToSqliteIfNeeded(database);

  try {
    const row = database
      .prepare('SELECT json FROM project_snapshot WHERE key = ?')
      .get('default') as { json: string } | undefined;

    if (!row?.json) {
      writeSnapshotToSqlite(initialSnapshot);
      return structuredClone(initialSnapshot);
    }

    return normalizeSnapshot(JSON.parse(row.json) as Partial<ProjectSnapshot>);
  } catch {
    writeSnapshotToSqlite(initialSnapshot);
    return structuredClone(initialSnapshot);
  } finally {
    database.close();
  }
}

function getActiveDataDriver(): 'json' | 'sqlite' {
  return repositoryDriver === 'json' ? 'json' : 'sqlite';
}

function readSnapshotFromDisk(): ProjectSnapshot {
  return getActiveDataDriver() === 'sqlite' ? readSnapshotFromSqlite() : readSnapshotFromJsonDisk();
}

function writeSnapshotToDisk(snapshot: ProjectSnapshot) {
  if (getActiveDataDriver() === 'sqlite') {
    writeSnapshotToSqlite(snapshot);
    return;
  }

  writeSnapshotToJsonDisk(snapshot);
}

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function recordEvent(
  snapshot: ProjectSnapshot,
  event: Omit<PipelineEvent, 'id' | 'createdAt'> & { createdAt?: string },
): PipelineEvent {
  const created: PipelineEvent = {
    id: createId('event'),
    createdAt: event.createdAt ?? new Date().toISOString(),
    ...event,
  };

  snapshot.pipelineEvents.unshift(created);
  return created;
}

export interface SnapshotStore {
  read(): ProjectSnapshot;
  write(snapshot: ProjectSnapshot): void;
  getLabel(): string;
}

export class JsonFileSnapshotStore implements SnapshotStore {
  read(): ProjectSnapshot {
    return readSnapshotFromJsonDisk();
  }

  write(snapshot: ProjectSnapshot): void {
    writeSnapshotToJsonDisk(snapshot);
  }

  getLabel(): string {
    return dataFile;
  }
}

export class SqliteSnapshotStore implements SnapshotStore {
  read(): ProjectSnapshot {
    return readSnapshotFromSqlite();
  }

  write(snapshot: ProjectSnapshot): void {
    writeSnapshotToSqlite(snapshot);
  }

  getLabel(): string {
    return sqliteFile;
  }
}

export class MemorySnapshotStore implements SnapshotStore {
  private snapshot: ProjectSnapshot;
  private readonly label: string;

  constructor(seed?: Partial<ProjectSnapshot>, label = 'memory://project-snapshot') {
    this.snapshot = normalizeSnapshot(seed ?? structuredClone(initialSnapshot));
    this.label = label;
  }

  read(): ProjectSnapshot {
    return structuredClone(this.snapshot);
  }

  write(snapshot: ProjectSnapshot): void {
    this.snapshot = structuredClone(snapshot);
  }

  getLabel(): string {
    return this.label;
  }
}

export interface ProjectRepository {
  getSnapshot(): ProjectSnapshot;
  listTrendCandidates(): TrendCandidate[];
  getTrendCandidateById(trendCandidateId: string): TrendCandidate | undefined;
  createTrendCandidate(input: CreateTrendCandidateInput): TrendCandidate;
  listQueuedTrendCandidates(): TrendCandidate[];
  updateTrendCandidateStatus(trendCandidateId: string, status: JobStatus): TrendCandidate | undefined;
  listSourceAssets(): SourceAsset[];
  listSourceAssetsByTrendCandidate(trendCandidateId: string): SourceAsset[];
  createSourceAssets(inputs: CreateSourceAssetInput[]): SourceAsset[];
  createMockAnalysisArtifacts(trendCandidateId: string): SourceAsset[];
  listPromptDrafts(): PromptDraft[];
  listPromptDraftsByTrendCandidate(trendCandidateId: string): PromptDraft[];
  getPromptDraftById(promptDraftId: string): PromptDraft | undefined;
  createPromptDraft(input: CreatePromptDraftInput): PromptDraft;
  createGeneratedPromptDraft(trendCandidateId: string): PromptDraft;
  createMockPromptDraft(trendCandidateId: string): PromptDraft;
  listVideoJobs(): VideoJob[];
  getVideoJobById(videoJobId: string): VideoJob | undefined;
  createVideoJob(promptDraftId: string, provider?: string): VideoJob;
  updateVideoJobResult(videoJobId: string, outputUrl: string, status?: JobStatus): VideoJob | undefined;
  listUploadJobs(): UploadJob[];
  createUploadJob(videoJobId: string, scheduledFor: string): UploadJob;
  completeUploadJob(uploadJobId: string): UploadJob | undefined;
  listPipelineEvents(limit?: number): PipelineEvent[];
}

export class SnapshotProjectRepository implements ProjectRepository {
  constructor(private readonly store: SnapshotStore) {}

  private mutate<T>(mutator: (snapshot: ProjectSnapshot) => T): T {
    const snapshot = this.store.read();
    const result = mutator(snapshot);
    this.store.write(snapshot);
    return result;
  }

  getSnapshot(): ProjectSnapshot {
    return this.store.read();
  }

  listTrendCandidates(): TrendCandidate[] {
    return [...this.store.read().trendCandidates].sort((a, b) => b.discoveredAt.localeCompare(a.discoveredAt));
  }

  getTrendCandidateById(trendCandidateId: string): TrendCandidate | undefined {
    return this.store.read().trendCandidates.find((item) => item.id === trendCandidateId);
  }

  createTrendCandidate(input: CreateTrendCandidateInput): TrendCandidate {
    return this.mutate((snapshot) => {
      const created: TrendCandidate = {
        id: createId('trend'),
        topic: input.topic.trim(),
        sourceUrl: input.sourceUrl.trim(),
        sourcePlatform: input.sourcePlatform,
        discoveredAt: new Date().toISOString(),
        status: 'queued',
      };

      snapshot.trendCandidates.unshift(created);
      recordEvent(snapshot, {
        type: 'trend_candidate_created',
        entityType: 'trendCandidate',
        entityId: created.id,
        message: `Trend candidate created for ${created.topic}`,
        metadata: {
          topic: created.topic,
          sourceUrl: created.sourceUrl,
          sourcePlatform: created.sourcePlatform,
        },
      });
      return created;
    });
  }

  listQueuedTrendCandidates(): TrendCandidate[] {
    return this.store.read().trendCandidates.filter((candidate) => candidate.status === 'queued');
  }

  updateTrendCandidateStatus(trendCandidateId: string, status: JobStatus): TrendCandidate | undefined {
    return this.mutate((snapshot) => {
      const candidate = snapshot.trendCandidates.find((item) => item.id === trendCandidateId);
      if (!candidate) return undefined;
      candidate.status = status;
      recordEvent(snapshot, {
        type: 'trend_candidate_status_updated',
        entityType: 'trendCandidate',
        entityId: candidate.id,
        message: `Trend candidate status updated to ${status}`,
        metadata: { status },
      });
      return candidate;
    });
  }

  listSourceAssets(): SourceAsset[] {
    return [...this.store.read().sourceAssets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listSourceAssetsByTrendCandidate(trendCandidateId: string): SourceAsset[] {
    return this.store.read().sourceAssets.filter((asset) => asset.trendCandidateId === trendCandidateId);
  }

  createSourceAssets(inputs: CreateSourceAssetInput[]): SourceAsset[] {
    return this.mutate((snapshot) => {
      const createdAt = new Date().toISOString();
      const artifacts: SourceAsset[] = inputs.map((input) => ({
        id: createId(`asset_${input.assetType}`),
        trendCandidateId: input.trendCandidateId,
        assetType: input.assetType,
        uri: input.uri.trim(),
        createdAt,
      }));

      snapshot.sourceAssets.unshift(...artifacts);

      const primaryTrendCandidateId = inputs[0]?.trendCandidateId ?? 'unknown';
      recordEvent(snapshot, {
        type: 'analysis_artifacts_created',
        entityType: 'sourceAsset',
        entityId: primaryTrendCandidateId,
        message: `Created ${artifacts.length} analysis artifacts`,
        metadata: {
          trendCandidateId: primaryTrendCandidateId,
          assetIds: artifacts.map((asset) => asset.id),
          assetTypes: artifacts.map((asset) => asset.assetType),
          assetUris: artifacts.map((asset) => asset.uri),
        },
      });
      return artifacts;
    });
  }

  createMockAnalysisArtifacts(trendCandidateId: string): SourceAsset[] {
    return this.createSourceAssets([
      {
        trendCandidateId,
        assetType: 'metadata',
        uri: `memory://${trendCandidateId}/metadata.json`,
      },
      {
        trendCandidateId,
        assetType: 'screenshot',
        uri: `memory://${trendCandidateId}/shot-001.png`,
      },
    ]);
  }

  listPromptDrafts(): PromptDraft[] {
    return [...this.store.read().promptDrafts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  listPromptDraftsByTrendCandidate(trendCandidateId: string): PromptDraft[] {
    return this.store.read().promptDrafts.filter((draft) => draft.trendCandidateId === trendCandidateId);
  }

  getPromptDraftById(promptDraftId: string): PromptDraft | undefined {
    return this.store.read().promptDrafts.find((draft) => draft.id === promptDraftId);
  }

  createPromptDraft(input: CreatePromptDraftInput): PromptDraft {
    return this.mutate((snapshot) => {
      const created: PromptDraft = {
        id: createId('prompt'),
        trendCandidateId: input.trendCandidateId,
        title: input.title.trim(),
        videoPrompt: input.videoPrompt.trim(),
        thumbnailPrompt: input.thumbnailPrompt.trim(),
        createdAt: new Date().toISOString(),
        status: 'draft',
      };

      snapshot.promptDrafts.unshift(created);
      recordEvent(snapshot, {
        type: 'prompt_draft_created',
        entityType: 'promptDraft',
        entityId: created.id,
        message: `Prompt draft created for trend candidate ${input.trendCandidateId}`,
        metadata: {
          trendCandidateId: input.trendCandidateId,
          title: created.title,
        },
      });
      return created;
    });
  }

  createGeneratedPromptDraft(trendCandidateId: string): PromptDraft {
    const trendCandidate = this.getTrendCandidateById(trendCandidateId);
    const sourceAssets = this.listSourceAssetsByTrendCandidate(trendCandidateId);
    const topic = trendCandidate?.topic ?? 'Untitled trend';
    const transcriptAssets = sourceAssets.filter((asset) => asset.assetType === 'transcript');
    const screenshotAssets = sourceAssets.filter((asset) => asset.assetType === 'screenshot');
    const metadataAssets = sourceAssets.filter((asset) => asset.assetType === 'metadata');

    const narrativeSignals = [
      transcriptAssets.length > 0 ? `${transcriptAssets.length} transcript-derived structure cue(s)` : 'no transcript cues yet',
      screenshotAssets.length > 0 ? `${screenshotAssets.length} visual keyframe reference(s)` : 'no keyframe references yet',
      metadataAssets.length > 0 ? `${metadataAssets.length} metadata summary artifact(s)` : 'no metadata summaries yet',
    ].join(', ');

    return this.createPromptDraft({
      trendCandidateId,
      title: `${topic} Prompt Draft`,
      videoPrompt: `Create an original short-form video about ${topic}. Base the pacing, hook, and scene order on the available analysis artifacts (${narrativeSignals}). Preserve only reusable structure and topic framing from analysis; do not copy source wording, shots, branding, or creator identity. Deliver a 30-45 second video with a strong first-2-second hook, 3-5 escalating beats, and a decisive ending CTA or payoff.`,
      thumbnailPrompt: `Design a thumbnail for ${topic} using the analyzed visual motifs from ${screenshotAssets.length} screenshot artifact(s) and ${metadataAssets.length} metadata artifact(s). Keep it original, bold, high-contrast, and readable on mobile, with one dominant focal subject and clear text-safe space.`,
    });
  }

  createMockPromptDraft(trendCandidateId: string): PromptDraft {
    return this.createGeneratedPromptDraft(trendCandidateId);
  }

  listVideoJobs(): VideoJob[] {
    return [...this.store.read().videoJobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getVideoJobById(videoJobId: string): VideoJob | undefined {
    return this.store.read().videoJobs.find((job) => job.id === videoJobId);
  }

  createVideoJob(promptDraftId: string, provider = 'mock-sora-adapter'): VideoJob {
    return this.mutate((snapshot) => {
      const created: VideoJob = {
        id: createId('video'),
        promptDraftId,
        provider,
        status: 'queued',
        createdAt: new Date().toISOString(),
      };

      snapshot.videoJobs.unshift(created);
      recordEvent(snapshot, {
        type: 'video_job_created',
        entityType: 'videoJob',
        entityId: created.id,
        message: `Video job created with provider ${provider}`,
        metadata: {
          promptDraftId,
          provider,
        },
      });
      return created;
    });
  }

  updateVideoJobResult(videoJobId: string, outputUrl: string, status: JobStatus = 'completed'): VideoJob | undefined {
    return this.mutate((snapshot) => {
      const job = snapshot.videoJobs.find((item) => item.id === videoJobId);
      if (!job) return undefined;

      job.outputUrl = outputUrl;
      job.status = status;
      recordEvent(snapshot, {
        type: 'video_job_updated',
        entityType: 'videoJob',
        entityId: job.id,
        message: `Video job updated to ${status}`,
        metadata: {
          outputUrl,
          status,
        },
      });
      return job;
    });
  }

  listUploadJobs(): UploadJob[] {
    return [...this.store.read().uploadJobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  createUploadJob(videoJobId: string, scheduledFor: string): UploadJob {
    return this.mutate((snapshot) => {
      const created: UploadJob = {
        id: createId('upload'),
        videoJobId,
        platform: 'youtube',
        scheduledFor,
        createdAt: new Date().toISOString(),
        status: 'queued',
      };

      snapshot.uploadJobs.unshift(created);
      recordEvent(snapshot, {
        type: 'upload_job_created',
        entityType: 'uploadJob',
        entityId: created.id,
        message: 'Upload job created',
        metadata: {
          videoJobId,
          scheduledFor,
          platform: created.platform,
        },
      });
      return created;
    });
  }

  completeUploadJob(uploadJobId: string): UploadJob | undefined {
    return this.mutate((snapshot) => {
      const job = snapshot.uploadJobs.find((item) => item.id === uploadJobId);
      if (!job) return undefined;

      job.status = 'completed';
      recordEvent(snapshot, {
        type: 'upload_job_completed',
        entityType: 'uploadJob',
        entityId: job.id,
        message: 'Upload job marked completed',
        metadata: {
          status: job.status,
          videoJobId: job.videoJobId,
        },
      });
      return job;
    });
  }

  listPipelineEvents(limit = 50): PipelineEvent[] {
    return [...this.store.read().pipelineEvents]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }
}

function createDefaultSnapshotStore(): SnapshotStore {
  return getActiveDataDriver() === 'sqlite' ? new SqliteSnapshotStore() : new JsonFileSnapshotStore();
}

const defaultStore = createDefaultSnapshotStore();
const defaultRepository = new SnapshotProjectRepository(defaultStore);

export function createProjectRepository(store: SnapshotStore = defaultStore): ProjectRepository {
  return new SnapshotProjectRepository(store);
}

export function getProjectRepository(): ProjectRepository {
  return defaultRepository;
}

export function getDataFilePath() {
  if (getActiveDataDriver() === 'sqlite') {
    ensureSqliteDatabaseFile();
    return sqliteFile;
  }

  ensureJsonDataFile();
  return dataFile;
}

export function getSnapshotStoreLabel(): string {
  return `${getActiveDataDriver()}:${defaultStore.getLabel()}`;
}

export function getProjectSnapshot(): ProjectSnapshot {
  return defaultRepository.getSnapshot();
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

export function parseYouTubeUrl(value: string): YouTubeUrlDetails | undefined {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const path = url.pathname;

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (path === '/watch') {
        const videoId = url.searchParams.get('v')?.trim();
        if (!videoId) return undefined;
        return {
          kind: 'watch',
          normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
          inferredPlatform: 'youtube',
          videoId,
        };
      }

      if (path.startsWith('/shorts/')) {
        const videoId = path.split('/')[2]?.trim();
        if (!videoId) return undefined;
        return {
          kind: 'shorts',
          normalizedUrl: `https://www.youtube.com/shorts/${videoId}`,
          inferredPlatform: 'shorts',
          videoId,
        };
      }
    }

    if (host === 'youtu.be') {
      const videoId = path.replace(/^\//, '').split('/')[0]?.trim();
      if (!videoId) return undefined;
      return {
        kind: 'youtu.be',
        normalizedUrl: `https://www.youtube.com/watch?v=${videoId}`,
        inferredPlatform: 'youtube',
        videoId,
      };
    }

    return undefined;
  } catch {
    return undefined;
  }
}

export function validateTrendCandidateInput(input: CreateTrendCandidateInput): string[] {
  return validateTrendCandidateInputDetailed(input).errors;
}

export function validateTrendCandidateInputDetailed(input: CreateTrendCandidateInput): TrendCandidateValidationResult {
  const errors: string[] = [];
  const topic = input.topic.trim();
  const sourceUrl = input.sourceUrl.trim();
  let normalizedSourceUrl = sourceUrl;
  let inferredSourcePlatform = input.sourcePlatform;
  let youtube: YouTubeUrlDetails | undefined;

  if (!topic) {
    errors.push('topic is required');
  }

  if (!sourceUrl) {
    errors.push('sourceUrl is required');
  } else if (!isValidUrl(sourceUrl)) {
    errors.push('sourceUrl must be a valid http or https URL');
  } else if (input.sourcePlatform === 'manual') {
    normalizedSourceUrl = sourceUrl;
  } else {
    youtube = parseYouTubeUrl(sourceUrl);
    if (!youtube) {
      errors.push('sourceUrl must be a supported YouTube watch, shorts, or youtu.be URL');
    } else {
      normalizedSourceUrl = youtube.normalizedUrl;
      inferredSourcePlatform = youtube.inferredPlatform;
    }
  }

  return {
    errors,
    normalizedSourceUrl,
    inferredSourcePlatform,
    youtube,
  };
}

export function listTrendCandidates(): TrendCandidate[] {
  return defaultRepository.listTrendCandidates();
}

export function getTrendCandidateById(trendCandidateId: string): TrendCandidate | undefined {
  return defaultRepository.getTrendCandidateById(trendCandidateId);
}

export function createTrendCandidate(input: CreateTrendCandidateInput): TrendCandidate {
  return defaultRepository.createTrendCandidate(input);
}

export function listQueuedTrendCandidates(): TrendCandidate[] {
  return defaultRepository.listQueuedTrendCandidates();
}

export function updateTrendCandidateStatus(trendCandidateId: string, status: JobStatus): TrendCandidate | undefined {
  return defaultRepository.updateTrendCandidateStatus(trendCandidateId, status);
}

export function listSourceAssets(): SourceAsset[] {
  return defaultRepository.listSourceAssets();
}

export function listSourceAssetsByTrendCandidate(trendCandidateId: string): SourceAsset[] {
  return defaultRepository.listSourceAssetsByTrendCandidate(trendCandidateId);
}

export function createSourceAssets(inputs: CreateSourceAssetInput[]): SourceAsset[] {
  return defaultRepository.createSourceAssets(inputs);
}

export function createMockAnalysisArtifacts(trendCandidateId: string): SourceAsset[] {
  return defaultRepository.createMockAnalysisArtifacts(trendCandidateId);
}

export function listPromptDrafts(): PromptDraft[] {
  return defaultRepository.listPromptDrafts();
}

export function listPromptDraftsByTrendCandidate(trendCandidateId: string): PromptDraft[] {
  return defaultRepository.listPromptDraftsByTrendCandidate(trendCandidateId);
}

export function getPromptDraftById(promptDraftId: string): PromptDraft | undefined {
  return defaultRepository.getPromptDraftById(promptDraftId);
}

export function createPromptDraft(input: CreatePromptDraftInput): PromptDraft {
  return defaultRepository.createPromptDraft(input);
}

export function createGeneratedPromptDraft(trendCandidateId: string): PromptDraft {
  return defaultRepository.createGeneratedPromptDraft(trendCandidateId);
}

export function createMockPromptDraft(trendCandidateId: string): PromptDraft {
  return defaultRepository.createMockPromptDraft(trendCandidateId);
}

export function listVideoJobs(): VideoJob[] {
  return defaultRepository.listVideoJobs();
}

export function getVideoJobById(videoJobId: string): VideoJob | undefined {
  return defaultRepository.getVideoJobById(videoJobId);
}

export function createVideoJob(promptDraftId: string, provider = 'mock-sora-adapter'): VideoJob {
  return defaultRepository.createVideoJob(promptDraftId, provider);
}

export function updateVideoJobResult(videoJobId: string, outputUrl: string, status: JobStatus = 'completed'): VideoJob | undefined {
  return defaultRepository.updateVideoJobResult(videoJobId, outputUrl, status);
}

export function listUploadJobs(): UploadJob[] {
  return defaultRepository.listUploadJobs();
}

export function createUploadJob(videoJobId: string, scheduledFor: string): UploadJob {
  return defaultRepository.createUploadJob(videoJobId, scheduledFor);
}

export function completeUploadJob(uploadJobId: string): UploadJob | undefined {
  return defaultRepository.completeUploadJob(uploadJobId);
}

export function listPipelineEvents(limit?: number): PipelineEvent[] {
  return defaultRepository.listPipelineEvents(limit);
}

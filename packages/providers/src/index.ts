declare const process: {
  env: Record<string, string | undefined>;
};

export type GenerateVideoInput = {
  prompt: string;
};

export type GenerateVideoResult = {
  jobId: string;
  status: 'queued' | 'completed';
  provider: string;
  outputUrl?: string;
};

export type AnalyzeTrendInput = {
  trendCandidateId: string;
  topic: string;
  sourceUrl: string;
  sourcePlatform: 'youtube' | 'shorts' | 'manual';
};

export type AnalysisArtifactDraft = {
  assetType: 'url' | 'screenshot' | 'transcript' | 'metadata';
  uri: string;
  content?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
};

export type AnalyzeTrendResult = {
  provider: string;
  summary: string;
  artifacts: AnalysisArtifactDraft[];
};

export type UploadVideoInput = {
  videoUrl: string;
  title: string;
  description: string;
  scheduledFor?: string;
};

export type UploadVideoResult = {
  jobId: string;
  status: 'queued' | 'completed';
  provider: string;
  platform: 'youtube';
  remoteUrl?: string;
};

export interface VideoProvider {
  readonly name: string;
  generateVideo(input: GenerateVideoInput): Promise<GenerateVideoResult>;
}

export interface AnalysisProvider {
  readonly name: string;
  analyzeTrend(input: AnalyzeTrendInput): Promise<AnalyzeTrendResult>;
}

export interface UploadProvider {
  readonly name: string;
  uploadVideo(input: UploadVideoInput): Promise<UploadVideoResult>;
}

function getJsonHeaders(apiKey?: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  };
}

async function postJson<T>(endpoint: string, body: unknown, apiKey?: string): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: getJsonHeaders(apiKey),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Provider request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export class MockSoraVideoProvider implements VideoProvider {
  readonly name = 'mock-sora-adapter';

  async generateVideo(): Promise<GenerateVideoResult> {
    return {
      jobId: `mock_job_${Date.now()}`,
      status: 'queued',
      provider: this.name,
      outputUrl: 'memory://video/output.mp4',
    };
  }
}

export class MockVeoVideoProvider implements VideoProvider {
  readonly name = 'mock-veo-adapter';

  async generateVideo(): Promise<GenerateVideoResult> {
    return {
      jobId: `mock_job_${Date.now()}`,
      status: 'queued',
      provider: this.name,
      outputUrl: 'memory://video/veo-output.mp4',
    };
  }
}

export class EnvWebhookVideoProvider implements VideoProvider {
  readonly name = 'env-webhook-video';

  async generateVideo(input: GenerateVideoInput): Promise<GenerateVideoResult> {
    const endpoint = process.env.TREND_TO_VIDEO_GENERATION_ENDPOINT;
    if (!endpoint) {
      throw new Error('TREND_TO_VIDEO_GENERATION_ENDPOINT is required for env-webhook-video provider');
    }

    const apiKey = process.env.TREND_TO_VIDEO_GENERATION_API_KEY;
    const payload = await postJson<{
      jobId?: string;
      status?: 'queued' | 'completed';
      outputUrl?: string;
      videoUrl?: string;
    }>(endpoint, { prompt: input.prompt }, apiKey);

    return {
      jobId: payload.jobId ?? `env_generation_${Date.now()}`,
      status: payload.status ?? (payload.outputUrl || payload.videoUrl ? 'completed' : 'queued'),
      provider: this.name,
      outputUrl: payload.outputUrl ?? payload.videoUrl,
    };
  }
}

export class InferenceShVideoProvider implements VideoProvider {
  readonly name = 'inference-sh-video';

  async generateVideo(input: GenerateVideoInput): Promise<GenerateVideoResult> {
    const endpoint = process.env.TREND_TO_VIDEO_INFERENCE_SH_ENDPOINT;
    if (!endpoint) {
      throw new Error('TREND_TO_VIDEO_INFERENCE_SH_ENDPOINT is required for inference-sh-video provider');
    }

    const apiKey = process.env.TREND_TO_VIDEO_INFERENCE_SH_API_KEY;
    const model = process.env.TREND_TO_VIDEO_INFERENCE_SH_MODEL || 'veo3';
    const payload = await postJson<{
      id?: string;
      status?: 'queued' | 'completed';
      output?: { url?: string };
      outputUrl?: string;
      videoUrl?: string;
    }>(
      endpoint,
      {
        model,
        prompt: input.prompt,
      },
      apiKey,
    );

    return {
      jobId: payload.id ?? `inference_sh_${Date.now()}`,
      status: payload.status ?? (payload.output?.url || payload.outputUrl || payload.videoUrl ? 'completed' : 'queued'),
      provider: this.name,
      outputUrl: payload.output?.url ?? payload.outputUrl ?? payload.videoUrl,
    };
  }
}

export class MockYouTubeUploadProvider implements UploadProvider {
  readonly name = 'mock-youtube-upload';

  async uploadVideo(input: UploadVideoInput): Promise<UploadVideoResult> {
    return {
      jobId: `mock_upload_${Date.now()}`,
      status: 'completed',
      provider: this.name,
      platform: 'youtube',
      remoteUrl: `memory://youtube/${encodeURIComponent(input.title)}`,
    };
  }
}

export class EnvWebhookUploadProvider implements UploadProvider {
  readonly name = 'env-webhook-upload';

  async uploadVideo(input: UploadVideoInput): Promise<UploadVideoResult> {
    const endpoint = process.env.TREND_TO_VIDEO_UPLOAD_ENDPOINT;
    if (!endpoint) {
      throw new Error('TREND_TO_VIDEO_UPLOAD_ENDPOINT is required for env-webhook-upload provider');
    }

    const apiKey = process.env.TREND_TO_VIDEO_UPLOAD_API_KEY;
    const payload = await postJson<{
      jobId?: string;
      status?: 'queued' | 'completed';
      remoteUrl?: string;
      uploadUrl?: string;
    }>(
      endpoint,
      {
        videoUrl: input.videoUrl,
        title: input.title,
        description: input.description,
        scheduledFor: input.scheduledFor,
        platform: 'youtube',
      },
      apiKey,
    );

    return {
      jobId: payload.jobId ?? `env_upload_${Date.now()}`,
      status: payload.status ?? 'completed',
      provider: this.name,
      platform: 'youtube',
      remoteUrl: payload.remoteUrl ?? payload.uploadUrl,
    };
  }
}

export class YouTubeStudioWebhookUploadProvider implements UploadProvider {
  readonly name = 'youtube-studio-webhook';

  async uploadVideo(input: UploadVideoInput): Promise<UploadVideoResult> {
    const endpoint = process.env.TREND_TO_VIDEO_YOUTUBE_STUDIO_ENDPOINT;
    if (!endpoint) {
      throw new Error('TREND_TO_VIDEO_YOUTUBE_STUDIO_ENDPOINT is required for youtube-studio-webhook provider');
    }

    const apiKey = process.env.TREND_TO_VIDEO_YOUTUBE_STUDIO_API_KEY;
    const visibility = process.env.TREND_TO_VIDEO_YOUTUBE_VISIBILITY || 'private';
    const payload = await postJson<{
      jobId?: string;
      status?: 'queued' | 'completed';
      remoteUrl?: string;
      watchUrl?: string;
    }>(
      endpoint,
      {
        platform: 'youtube',
        videoUrl: input.videoUrl,
        title: input.title,
        description: input.description,
        scheduledFor: input.scheduledFor,
        visibility,
      },
      apiKey,
    );

    return {
      jobId: payload.jobId ?? `youtube_upload_${Date.now()}`,
      status: payload.status ?? 'completed',
      provider: this.name,
      platform: 'youtube',
      remoteUrl: payload.remoteUrl ?? payload.watchUrl,
    };
  }
}

export class BaselineAnalysisProvider implements AnalysisProvider {
  readonly name = 'baseline-analysis';

  async analyzeTrend(input: AnalyzeTrendInput): Promise<AnalyzeTrendResult> {
    const safeTopic = input.topic.trim() || 'Untitled trend';
    const stem = `memory://${input.trendCandidateId}`;

    return {
      provider: this.name,
      summary: `Structured analysis prepared for ${safeTopic} from ${input.sourcePlatform} source ${input.sourceUrl}.`,
      artifacts: [
        {
          assetType: 'metadata',
          uri: `${stem}/analysis-metadata.json`,
          summary: `Trend topic centers on ${safeTopic} with short-form hook-first storytelling mechanics.`,
          metadata: {
            hookPattern: 'open with a bold curiosity gap in the first 2 seconds',
            pacing: 'fast escalation across 3 to 5 compact beats',
            endingStyle: 'close with a decisive reveal or CTA payoff',
          },
        },
        {
          assetType: 'transcript',
          uri: `${stem}/analysis-transcript.txt`,
          content: `Hook: Why is ${safeTopic} suddenly everywhere? Beat 1 introduces the premise. Beat 2 escalates with contrast. Beat 3 reveals a useful takeaway. Ending closes with a decisive final line.`,
          summary: `Transcript structure suggests hook -> escalation -> takeaway -> payoff.`,
          metadata: {
            hookLine: `Why is ${safeTopic} suddenly everywhere?`,
            beatCount: 4,
          },
        },
        {
          assetType: 'screenshot',
          uri: `${stem}/keyframe-001.png`,
          summary: `High-contrast close-up focal subject with oversized headline space and urgent visual framing.`,
          metadata: {
            composition: 'close-up focal subject',
            contrast: 'high',
            textSpace: 'headline-safe upper third',
          },
        },
      ],
    };
  }
}

const videoProviderRegistry = new Map<string, VideoProvider>();
const analysisProviderRegistry = new Map<string, AnalysisProvider>();
const uploadProviderRegistry = new Map<string, UploadProvider>();

export function registerVideoProvider(provider: VideoProvider): VideoProvider {
  videoProviderRegistry.set(provider.name, provider);
  return provider;
}

export function registerAnalysisProvider(provider: AnalysisProvider): AnalysisProvider {
  analysisProviderRegistry.set(provider.name, provider);
  return provider;
}

export function registerUploadProvider(provider: UploadProvider): UploadProvider {
  uploadProviderRegistry.set(provider.name, provider);
  return provider;
}

export function listVideoProviders(): string[] {
  return [...videoProviderRegistry.keys()].sort();
}

export function listAnalysisProviders(): string[] {
  return [...analysisProviderRegistry.keys()].sort();
}

export function listUploadProviders(): string[] {
  return [...uploadProviderRegistry.keys()].sort();
}

export function getVideoProvider(providerName?: string): VideoProvider {
  const preferred = providerName || process.env.TREND_TO_VIDEO_DEFAULT_VIDEO_PROVIDER;
  if (preferred && videoProviderRegistry.has(preferred)) {
    return videoProviderRegistry.get(preferred)!;
  }

  if (process.env.TREND_TO_VIDEO_INFERENCE_SH_ENDPOINT) {
    return videoProviderRegistry.get('inference-sh-video')!;
  }

  return process.env.TREND_TO_VIDEO_GENERATION_ENDPOINT
    ? videoProviderRegistry.get('env-webhook-video')!
    : videoProviderRegistry.get('mock-sora-adapter')!;
}

export function getAnalysisProvider(providerName?: string): AnalysisProvider {
  if (providerName && analysisProviderRegistry.has(providerName)) {
    return analysisProviderRegistry.get(providerName)!;
  }

  return analysisProviderRegistry.get('baseline-analysis')!;
}

export function getUploadProvider(providerName?: string): UploadProvider {
  const preferred = providerName || process.env.TREND_TO_VIDEO_DEFAULT_UPLOAD_PROVIDER;
  if (preferred && uploadProviderRegistry.has(preferred)) {
    return uploadProviderRegistry.get(preferred)!;
  }

  if (process.env.TREND_TO_VIDEO_YOUTUBE_STUDIO_ENDPOINT) {
    return uploadProviderRegistry.get('youtube-studio-webhook')!;
  }

  return process.env.TREND_TO_VIDEO_UPLOAD_ENDPOINT
    ? uploadProviderRegistry.get('env-webhook-upload')!
    : uploadProviderRegistry.get('mock-youtube-upload')!;
}

export const mockVideoProvider = registerVideoProvider(new MockSoraVideoProvider());
export const mockVeoVideoProvider = registerVideoProvider(new MockVeoVideoProvider());
export const envWebhookVideoProvider = registerVideoProvider(new EnvWebhookVideoProvider());
export const inferenceShVideoProvider = registerVideoProvider(new InferenceShVideoProvider());
export const baselineAnalysisProvider = registerAnalysisProvider(new BaselineAnalysisProvider());
export const mockYouTubeUploadProvider = registerUploadProvider(new MockYouTubeUploadProvider());
export const envWebhookUploadProvider = registerUploadProvider(new EnvWebhookUploadProvider());
export const youtubeStudioWebhookUploadProvider = registerUploadProvider(new YouTubeStudioWebhookUploadProvider());

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
};

export type AnalyzeTrendResult = {
  provider: string;
  summary: string;
  artifacts: AnalysisArtifactDraft[];
};

export interface VideoProvider {
  readonly name: string;
  generateVideo(input: GenerateVideoInput): Promise<GenerateVideoResult>;
}

export interface AnalysisProvider {
  readonly name: string;
  analyzeTrend(input: AnalyzeTrendInput): Promise<AnalyzeTrendResult>;
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
        },
        {
          assetType: 'transcript',
          uri: `${stem}/analysis-transcript.txt`,
        },
        {
          assetType: 'screenshot',
          uri: `${stem}/keyframe-001.png`,
        },
      ],
    };
  }
}

const videoProviderRegistry = new Map<string, VideoProvider>();
const analysisProviderRegistry = new Map<string, AnalysisProvider>();

export function registerVideoProvider(provider: VideoProvider): VideoProvider {
  videoProviderRegistry.set(provider.name, provider);
  return provider;
}

export function registerAnalysisProvider(provider: AnalysisProvider): AnalysisProvider {
  analysisProviderRegistry.set(provider.name, provider);
  return provider;
}

export function listVideoProviders(): string[] {
  return [...videoProviderRegistry.keys()].sort();
}

export function listAnalysisProviders(): string[] {
  return [...analysisProviderRegistry.keys()].sort();
}

export function getVideoProvider(providerName?: string): VideoProvider {
  if (providerName && videoProviderRegistry.has(providerName)) {
    return videoProviderRegistry.get(providerName)!;
  }

  return videoProviderRegistry.get('mock-sora-adapter')!;
}

export function getAnalysisProvider(providerName?: string): AnalysisProvider {
  if (providerName && analysisProviderRegistry.has(providerName)) {
    return analysisProviderRegistry.get(providerName)!;
  }

  return analysisProviderRegistry.get('baseline-analysis')!;
}

export const mockVideoProvider = registerVideoProvider(new MockSoraVideoProvider());
export const mockVeoVideoProvider = registerVideoProvider(new MockVeoVideoProvider());
export const baselineAnalysisProvider = registerAnalysisProvider(new BaselineAnalysisProvider());

export type GenerateVideoInput = {
  prompt: string;
};

export type GenerateVideoResult = {
  jobId: string;
  status: 'queued' | 'completed';
  provider: string;
  outputUrl?: string;
};

export interface VideoProvider {
  readonly name: string;
  generateVideo(input: GenerateVideoInput): Promise<GenerateVideoResult>;
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

const providerRegistry = new Map<string, VideoProvider>();

export function registerVideoProvider(provider: VideoProvider): VideoProvider {
  providerRegistry.set(provider.name, provider);
  return provider;
}

export function listVideoProviders(): string[] {
  return [...providerRegistry.keys()].sort();
}

export function getVideoProvider(providerName?: string): VideoProvider {
  if (providerName && providerRegistry.has(providerName)) {
    return providerRegistry.get(providerName)!;
  }

  return providerRegistry.get('mock-sora-adapter')!;
}

export const mockVideoProvider = registerVideoProvider(new MockSoraVideoProvider());
export const mockVeoVideoProvider = registerVideoProvider(new MockVeoVideoProvider());

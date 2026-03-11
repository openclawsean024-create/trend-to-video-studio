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
  generateVideo(input: GenerateVideoInput): Promise<GenerateVideoResult>;
}

export const mockVideoProvider: VideoProvider = {
  async generateVideo() {
    return {
      jobId: `mock_job_${Date.now()}`,
      status: 'queued',
      provider: 'mock-sora-adapter',
      outputUrl: 'memory://video/output.mp4',
    };
  },
};

export type GenerateVideoInput = {
  prompt: string;
};

export type GenerateVideoResult = {
  jobId: string;
  status: 'queued' | 'completed';
};

export interface VideoProvider {
  generateVideo(input: GenerateVideoInput): Promise<GenerateVideoResult>;
}

export const mockVideoProvider: VideoProvider = {
  async generateVideo() {
    return {
      jobId: 'mock_job_001',
      status: 'queued',
    };
  },
};

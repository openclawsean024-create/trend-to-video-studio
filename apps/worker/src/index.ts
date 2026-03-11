import {
  examplePromptDraft,
  exampleSnapshot,
  exampleTrendCandidate,
  exampleUploadJob,
  exampleVideoJob,
} from '@trend-to-video-studio/core';
import { mockVideoProvider } from '@trend-to-video-studio/providers';

async function main() {
  console.log('Trend to Video Studio worker booted');
  console.log('Trend candidate:', exampleTrendCandidate.topic, '| status:', exampleTrendCandidate.status);
  console.log('Prompt draft:', examplePromptDraft.title, '| status:', examplePromptDraft.status);

  const result = await mockVideoProvider.generateVideo({
    prompt: examplePromptDraft.videoPrompt,
  });

  console.log('Mock generation result:', result);
  console.log('Video job:', exampleVideoJob.id, '| status:', exampleVideoJob.status);
  console.log('Upload job scheduled for:', exampleUploadJob.scheduledFor);
  console.log('Snapshot summary:', {
    trendCandidates: exampleSnapshot.trendCandidates.length,
    sourceAssets: exampleSnapshot.sourceAssets.length,
    promptDrafts: exampleSnapshot.promptDrafts.length,
    videoJobs: exampleSnapshot.videoJobs.length,
    uploadJobs: exampleSnapshot.uploadJobs.length,
  });
}

main().catch((error) => {
  console.error('Worker crashed', error);
  process.exit(1);
});

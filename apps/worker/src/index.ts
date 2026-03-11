import {
  createMockAnalysisArtifacts,
  listQueuedTrendCandidates,
  listSourceAssetsByTrendCandidate,
} from '@trend-to-video-studio/core';
import { mockVideoProvider } from '@trend-to-video-studio/providers';

async function main() {
  console.log('Trend to Video Studio worker booted');

  const queuedCandidates = listQueuedTrendCandidates();
  console.log(`Queued trend candidates: ${queuedCandidates.length}`);

  for (const candidate of queuedCandidates) {
    console.log(`Processing candidate: ${candidate.topic} (${candidate.sourceUrl})`);

    const analysisArtifacts = createMockAnalysisArtifacts(candidate.id);
    console.log('Generated analysis artifacts:', analysisArtifacts);

    const result = await mockVideoProvider.generateVideo({
      prompt: `Create an original short-form video concept inspired by ${candidate.topic}`,
    });

    console.log('Mock generation result:', result);
    console.log('Current asset count for candidate:', listSourceAssetsByTrendCandidate(candidate.id).length);
  }
}

main().catch((error) => {
  console.error('Worker crashed', error);
  process.exit(1);
});

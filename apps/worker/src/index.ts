import {
  completeUploadJob,
  createGeneratedPromptDraft,
  createSourceAssets,
  createUploadJob,
  createVideoJob,
  getTrendCandidateById,
  listQueuedTrendCandidates,
  listSourceAssetsByTrendCandidate,
  updateTrendCandidateStatus,
  updateVideoJobResult,
} from '@trend-to-video-studio/core';
import { getAnalysisProvider, getVideoProvider } from '@trend-to-video-studio/providers';

type WorkerMode = 'process-all' | 'process-one' | 'dry-run';

function getArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function getMode(): WorkerMode {
  const value = getArg('--mode');
  if (value === 'process-one') return 'process-one';
  if (value === 'dry-run') return 'dry-run';
  return 'process-all';
}

async function processCandidate(trendCandidateId: string, providerName = 'mock-sora-adapter') {
  const candidate = getTrendCandidateById(trendCandidateId);
  if (!candidate) {
    console.log(`Candidate not found: ${trendCandidateId}`);
    return;
  }

  console.log(`Processing candidate: ${candidate.topic} (${candidate.sourceUrl})`);
  updateTrendCandidateStatus(candidate.id, 'processing');

  const analysisProvider = getAnalysisProvider();
  const analysisResult = await analysisProvider.analyzeTrend({
    trendCandidateId: candidate.id,
    topic: candidate.topic,
    sourceUrl: candidate.sourceUrl,
    sourcePlatform: candidate.sourcePlatform,
  });
  const analysisArtifacts = createSourceAssets(
    analysisResult.artifacts.map((artifact) => ({
      trendCandidateId: candidate.id,
      assetType: artifact.assetType,
      uri: artifact.uri,
    })),
  );
  console.log('Analysis provider result:', analysisResult);
  console.log('Generated analysis artifacts:', analysisArtifacts);

  const promptDraft = createGeneratedPromptDraft(candidate.id);
  console.log('Generated prompt draft from analysis artifacts:', promptDraft);

  const provider = getVideoProvider(providerName);
  const queuedVideoJob = createVideoJob(promptDraft.id, provider.name);
  console.log('Queued video job:', queuedVideoJob);

  const result = await provider.generateVideo({
    prompt: promptDraft.videoPrompt,
  });

  const completedVideoJob = updateVideoJobResult(
    queuedVideoJob.id,
    result.outputUrl ?? 'memory://video/output.mp4',
    'completed',
  );

  const uploadJob = createUploadJob(
    queuedVideoJob.id,
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  );
  const completedUploadJob = completeUploadJob(uploadJob.id);
  updateTrendCandidateStatus(candidate.id, 'completed');

  console.log('Mock generation result:', result);
  console.log('Completed video job:', completedVideoJob);
  console.log('Completed upload job:', completedUploadJob);
  console.log('Current asset count for candidate:', listSourceAssetsByTrendCandidate(candidate.id).length);
}

async function main() {
  console.log('Trend to Video Studio worker booted');

  const mode = getMode();
  const queuedCandidates = listQueuedTrendCandidates();
  console.log(`Mode: ${mode}`);
  console.log(`Queued trend candidates: ${queuedCandidates.length}`);

  if (mode === 'dry-run') {
    console.log('Dry run candidate IDs:', queuedCandidates.map((candidate) => candidate.id));
    return;
  }

  const providerName = getArg('--provider') ?? 'mock-sora-adapter';

  if (mode === 'process-one') {
    const candidateId = getArg('--candidate-id') ?? queuedCandidates[0]?.id;
    if (!candidateId) {
      console.log('No queued candidate available for process-one');
      return;
    }

    await processCandidate(candidateId, providerName);
    return;
  }

  for (const candidate of queuedCandidates) {
    await processCandidate(candidate.id, providerName);
  }
}

main().catch((error) => {
  console.error('Worker crashed', error);
  process.exit(1);
});

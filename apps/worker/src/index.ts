import {
  completeUploadJob,
  createMockAnalysisArtifacts,
  createMockPromptDraft,
  createUploadJob,
  createVideoJob,
  getTrendCandidateById,
  listQueuedTrendCandidates,
  listSourceAssetsByTrendCandidate,
  updateTrendCandidateStatus,
  updateVideoJobResult,
} from '@trend-to-video-studio/core';
import { mockVideoProvider } from '@trend-to-video-studio/providers';

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

async function processCandidate(trendCandidateId: string) {
  const candidate = getTrendCandidateById(trendCandidateId);
  if (!candidate) {
    console.log(`Candidate not found: ${trendCandidateId}`);
    return;
  }

  console.log(`Processing candidate: ${candidate.topic} (${candidate.sourceUrl})`);
  updateTrendCandidateStatus(candidate.id, 'processing');

  const analysisArtifacts = createMockAnalysisArtifacts(candidate.id);
  console.log('Generated analysis artifacts:', analysisArtifacts);

  const promptDraft = createMockPromptDraft(candidate.id);
  console.log('Generated prompt draft:', promptDraft);

  const queuedVideoJob = createVideoJob(promptDraft.id);
  console.log('Queued video job:', queuedVideoJob);

  const result = await mockVideoProvider.generateVideo({
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

  if (mode === 'process-one') {
    const candidateId = getArg('--candidate-id') ?? queuedCandidates[0]?.id;
    if (!candidateId) {
      console.log('No queued candidate available for process-one');
      return;
    }

    await processCandidate(candidateId);
    return;
  }

  for (const candidate of queuedCandidates) {
    await processCandidate(candidate.id);
  }
}

main().catch((error) => {
  console.error('Worker crashed', error);
  process.exit(1);
});

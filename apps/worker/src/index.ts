import {
  completeUploadJob,
  createGeneratedPromptDraft,
  createSourceAssets,
  createUploadJob,
  createVideoJob,
  getPromptDraftById,
  getTrendCandidateById,
  listQueuedTrendCandidates,
  listSourceAssetsByTrendCandidate,
  updateTrendCandidateStatus,
  updateVideoJobResult,
} from '@trend-to-video-studio/core';
import { getAnalysisProvider, getUploadProvider, getVideoProvider } from '@trend-to-video-studio/providers';

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

async function processCandidate(
  trendCandidateId: string,
  videoProviderName?: string,
  uploadProviderName?: string,
) {
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
      content: artifact.content,
      summary: artifact.summary,
      metadata: artifact.metadata,
    })),
  );
  console.log('Analysis provider result:', analysisResult);
  console.log('Generated analysis artifacts:', analysisArtifacts);

  const promptDraft = createGeneratedPromptDraft(candidate.id);
  console.log('Generated prompt draft from analysis artifacts:', promptDraft);

  const videoProvider = getVideoProvider(videoProviderName);
  const queuedVideoJob = createVideoJob(promptDraft.id, videoProvider.name);
  console.log('Queued video job:', queuedVideoJob);

  const generationResult = await videoProvider.generateVideo({
    prompt: promptDraft.videoPrompt,
  });

  const completedVideoJob = updateVideoJobResult(
    queuedVideoJob.id,
    generationResult.outputUrl ?? 'memory://video/output.mp4',
    generationResult.status === 'completed' ? 'completed' : 'processing',
  );

  const uploadProvider = getUploadProvider(uploadProviderName);
  const scheduledFor = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const uploadJob = createUploadJob(queuedVideoJob.id, scheduledFor);
  const prompt = getPromptDraftById(promptDraft.id);
  const uploadResult = await uploadProvider.uploadVideo({
    videoUrl: generationResult.outputUrl ?? 'memory://video/output.mp4',
    title: prompt?.title ?? `${candidate.topic} Generated Video`,
    description: prompt?.videoPrompt ?? `Generated from trend candidate ${candidate.id}`,
    scheduledFor,
  });
  const completedUploadJob = completeUploadJob(uploadJob.id);
  updateTrendCandidateStatus(candidate.id, 'completed');

  console.log('Generation result:', generationResult);
  console.log('Completed video job:', completedVideoJob);
  console.log('Upload result:', uploadResult);
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

  const videoProviderName = getArg('--provider');
  const uploadProviderName = getArg('--upload-provider');

  if (mode === 'process-one') {
    const candidateId = getArg('--candidate-id') ?? queuedCandidates[0]?.id;
    if (!candidateId) {
      console.log('No queued candidate available for process-one');
      return;
    }

    await processCandidate(candidateId, videoProviderName, uploadProviderName);
    return;
  }

  for (const candidate of queuedCandidates) {
    await processCandidate(candidate.id, videoProviderName, uploadProviderName);
  }
}

main().catch((error) => {
  console.error('Worker crashed', error);
  process.exit(1);
});

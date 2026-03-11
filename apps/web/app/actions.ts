'use server';

import {
  completeUploadJob,
  createMockAnalysisArtifacts,
  createMockPromptDraft,
  createTrendCandidate,
  createUploadJob,
  createVideoJob,
  getPromptDraftById,
  getTrendCandidateById,
  getVideoJobById,
  isValidIsoDateTime,
  normalizeSourcePlatform,
  updateTrendCandidateStatus,
  updateVideoJobResult,
  validateTrendCandidateInputDetailed,
} from '@trend-to-video-studio/core';
import { mockVideoProvider } from '@trend-to-video-studio/providers';
import { revalidatePath } from 'next/cache';

function asString(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function createTrendCandidateAction(formData: FormData) {
  const input = {
    topic: asString(formData.get('topic')),
    sourceUrl: asString(formData.get('sourceUrl')),
    sourcePlatform: normalizeSourcePlatform(asString(formData.get('sourcePlatform'))),
  };

  const validation = validateTrendCandidateInputDetailed(input);
  if (validation.errors.length > 0) {
    throw new Error(validation.errors.join('; '));
  }

  createTrendCandidate({
    ...input,
    sourceUrl: validation.normalizedSourceUrl,
    sourcePlatform: validation.inferredSourcePlatform,
  });
  revalidatePath('/');
}

export async function runAnalysisAction(formData: FormData) {
  const trendCandidateId = asString(formData.get('trendCandidateId'));
  if (!trendCandidateId) throw new Error('trendCandidateId is required');
  if (!getTrendCandidateById(trendCandidateId)) throw new Error('trendCandidateId does not exist');

  updateTrendCandidateStatus(trendCandidateId, 'processing');
  createMockAnalysisArtifacts(trendCandidateId);
  revalidatePath('/');
}

export async function createPromptAction(formData: FormData) {
  const trendCandidateId = asString(formData.get('trendCandidateId'));
  if (!trendCandidateId) throw new Error('trendCandidateId is required');
  if (!getTrendCandidateById(trendCandidateId)) throw new Error('trendCandidateId does not exist');

  createMockPromptDraft(trendCandidateId);
  revalidatePath('/');
}

export async function createVideoJobAction(formData: FormData) {
  const promptDraftId = asString(formData.get('promptDraftId'));
  const prompt = asString(formData.get('prompt'));
  if (!promptDraftId) throw new Error('promptDraftId is required');
  if (!getPromptDraftById(promptDraftId)) throw new Error('promptDraftId does not exist');

  const job = createVideoJob(promptDraftId);
  const result = await mockVideoProvider.generateVideo({
    prompt: prompt || 'Generate original short-form video',
  });

  updateVideoJobResult(job.id, result.outputUrl ?? 'memory://video/output.mp4', 'completed');
  revalidatePath('/');
}

export async function createUploadJobAction(formData: FormData) {
  const videoJobId = asString(formData.get('videoJobId'));
  const scheduledForInput = asString(formData.get('scheduledFor'));
  if (!videoJobId) throw new Error('videoJobId is required');
  if (!getVideoJobById(videoJobId)) throw new Error('videoJobId does not exist');

  const scheduledFor = scheduledForInput || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  if (!isValidIsoDateTime(scheduledFor)) {
    throw new Error('scheduledFor must be a valid ISO datetime string');
  }

  const uploadJob = createUploadJob(videoJobId, scheduledFor);
  completeUploadJob(uploadJob.id);
  revalidatePath('/');
}

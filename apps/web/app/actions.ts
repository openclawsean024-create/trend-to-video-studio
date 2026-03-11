'use server';

import {
  completeUploadJob,
  createMockAnalysisArtifacts,
  createMockPromptDraft,
  createTrendCandidate,
  createUploadJob,
  createVideoJob,
  updateTrendCandidateStatus,
  updateVideoJobResult,
} from '@trend-to-video-studio/core';
import { mockVideoProvider } from '@trend-to-video-studio/providers';
import { revalidatePath } from 'next/cache';

function asString(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function createTrendCandidateAction(formData: FormData) {
  const topic = asString(formData.get('topic'));
  const sourceUrl = asString(formData.get('sourceUrl'));
  const sourcePlatform = asString(formData.get('sourcePlatform')) as 'youtube' | 'shorts' | 'manual';

  if (!topic || !sourceUrl) {
    throw new Error('topic and sourceUrl are required');
  }

  createTrendCandidate({
    topic,
    sourceUrl,
    sourcePlatform: sourcePlatform || 'youtube',
  });

  revalidatePath('/');
}

export async function runAnalysisAction(formData: FormData) {
  const trendCandidateId = asString(formData.get('trendCandidateId'));
  if (!trendCandidateId) throw new Error('trendCandidateId is required');

  updateTrendCandidateStatus(trendCandidateId, 'processing');
  createMockAnalysisArtifacts(trendCandidateId);
  revalidatePath('/');
}

export async function createPromptAction(formData: FormData) {
  const trendCandidateId = asString(formData.get('trendCandidateId'));
  if (!trendCandidateId) throw new Error('trendCandidateId is required');

  createMockPromptDraft(trendCandidateId);
  revalidatePath('/');
}

export async function createVideoJobAction(formData: FormData) {
  const promptDraftId = asString(formData.get('promptDraftId'));
  const prompt = asString(formData.get('prompt'));
  if (!promptDraftId) throw new Error('promptDraftId is required');

  const job = createVideoJob(promptDraftId);
  const result = await mockVideoProvider.generateVideo({
    prompt: prompt || 'Generate original short-form video',
  });

  updateVideoJobResult(job.id, result.outputUrl ?? 'memory://video/output.mp4', 'completed');
  revalidatePath('/');
}

export async function createUploadJobAction(formData: FormData) {
  const videoJobId = asString(formData.get('videoJobId'));
  const scheduledFor = asString(formData.get('scheduledFor'));
  if (!videoJobId) throw new Error('videoJobId is required');

  const uploadJob = createUploadJob(
    videoJobId,
    scheduledFor || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  );
  completeUploadJob(uploadJob.id);
  revalidatePath('/');
}

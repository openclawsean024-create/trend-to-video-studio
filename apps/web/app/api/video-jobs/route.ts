import {
  createVideoJob,
  getPromptDraftById,
  listVideoJobs,
  updateVideoJobResult,
} from '@trend-to-video-studio/core';
import { getVideoProvider, listVideoProviders } from '@trend-to-video-studio/providers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    items: listVideoJobs(),
    providers: listVideoProviders(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const promptDraftId = String(body?.promptDraftId ?? '');

  if (!promptDraftId) {
    return NextResponse.json(
      {
        ok: false,
        error: 'promptDraftId is required',
      },
      { status: 400 },
    );
  }

  if (!getPromptDraftById(promptDraftId)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'promptDraftId does not exist',
      },
      { status: 404 },
    );
  }

  const providerName = String(body?.provider ?? 'mock-sora-adapter');
  const provider = getVideoProvider(providerName);
  const job = createVideoJob(promptDraftId, provider.name);
  const result = await provider.generateVideo({
    prompt: String(body?.prompt ?? 'Generate original short-form video'),
  });
  const updated = updateVideoJobResult(job.id, result.outputUrl ?? 'memory://video/output.mp4', 'completed');

  return NextResponse.json({
    ok: true,
    item: updated,
    providerResult: result,
  });
}

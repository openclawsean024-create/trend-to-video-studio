import { createVideoJob, listVideoJobs, updateVideoJobResult } from '@trend-to-video-studio/core';
import { mockVideoProvider } from '@trend-to-video-studio/providers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    items: listVideoJobs(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body?.promptDraftId) {
    return NextResponse.json(
      {
        ok: false,
        error: 'promptDraftId is required',
      },
      { status: 400 },
    );
  }

  const job = createVideoJob(String(body.promptDraftId));
  const result = await mockVideoProvider.generateVideo({
    prompt: String(body.prompt ?? 'Generate original short-form video'),
  });
  const updated = updateVideoJobResult(job.id, result.outputUrl ?? 'memory://video/output.mp4', 'completed');

  return NextResponse.json({
    ok: true,
    item: updated,
  });
}

import { completeUploadJob, createUploadJob, listUploadJobs } from '@trend-to-video-studio/core';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    items: listUploadJobs(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body?.videoJobId) {
    return NextResponse.json(
      {
        ok: false,
        error: 'videoJobId is required',
      },
      { status: 400 },
    );
  }

  const scheduledFor = body.scheduledFor ? String(body.scheduledFor) : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const created = createUploadJob(String(body.videoJobId), scheduledFor);
  const completed = completeUploadJob(created.id);

  return NextResponse.json({
    ok: true,
    item: completed,
  });
}

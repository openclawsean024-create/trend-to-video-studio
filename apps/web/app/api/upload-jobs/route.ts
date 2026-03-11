import {
  completeUploadJob,
  createUploadJob,
  getVideoJobById,
  isValidIsoDateTime,
  listUploadJobs,
} from '@trend-to-video-studio/core';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    items: listUploadJobs(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const videoJobId = String(body?.videoJobId ?? '');

  if (!videoJobId) {
    return NextResponse.json(
      {
        ok: false,
        error: 'videoJobId is required',
      },
      { status: 400 },
    );
  }

  if (!getVideoJobById(videoJobId)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'videoJobId does not exist',
      },
      { status: 404 },
    );
  }

  const scheduledFor = body?.scheduledFor
    ? String(body.scheduledFor)
    : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  if (!isValidIsoDateTime(scheduledFor)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'scheduledFor must be a valid ISO datetime string',
      },
      { status: 400 },
    );
  }

  const created = createUploadJob(videoJobId, scheduledFor);
  const completed = completeUploadJob(created.id);

  return NextResponse.json({
    ok: true,
    item: completed,
  });
}

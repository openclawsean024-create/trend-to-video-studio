import {
  createMockPromptDraft,
  getTrendCandidateById,
  listPromptDrafts,
} from '@trend-to-video-studio/core';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    items: listPromptDrafts(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const trendCandidateId = String(body?.trendCandidateId ?? '');

  if (!trendCandidateId) {
    return NextResponse.json(
      {
        ok: false,
        error: 'trendCandidateId is required',
      },
      { status: 400 },
    );
  }

  if (!getTrendCandidateById(trendCandidateId)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'trendCandidateId does not exist',
      },
      { status: 404 },
    );
  }

  const draft = createMockPromptDraft(trendCandidateId);

  return NextResponse.json({
    ok: true,
    item: draft,
  });
}

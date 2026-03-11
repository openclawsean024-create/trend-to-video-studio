import { createTrendCandidate, listTrendCandidates } from '@trend-to-video-studio/core';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    items: listTrendCandidates(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body?.topic || !body?.sourceUrl) {
    return NextResponse.json(
      {
        ok: false,
        error: 'topic and sourceUrl are required',
      },
      { status: 400 },
    );
  }

  const created = createTrendCandidate({
    topic: String(body.topic),
    sourceUrl: String(body.sourceUrl),
    sourcePlatform: body.sourcePlatform === 'shorts' ? 'shorts' : body.sourcePlatform === 'manual' ? 'manual' : 'youtube',
  });

  return NextResponse.json({
    ok: true,
    item: created,
  });
}

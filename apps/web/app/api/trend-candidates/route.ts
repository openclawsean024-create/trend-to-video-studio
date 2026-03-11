import {
  createTrendCandidate,
  listTrendCandidates,
  normalizeSourcePlatform,
  validateTrendCandidateInput,
} from '@trend-to-video-studio/core';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    items: listTrendCandidates(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const input = {
    topic: String(body?.topic ?? ''),
    sourceUrl: String(body?.sourceUrl ?? ''),
    sourcePlatform: normalizeSourcePlatform(body?.sourcePlatform),
  };

  const errors = validateTrendCandidateInput(input);
  if (errors.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        errors,
      },
      { status: 400 },
    );
  }

  const created = createTrendCandidate(input);

  return NextResponse.json({
    ok: true,
    item: created,
  });
}

import {
  createTrendCandidate,
  listTrendCandidates,
  normalizeSourcePlatform,
  validateTrendCandidateInputDetailed,
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

  const validation = validateTrendCandidateInputDetailed(input);
  if (validation.errors.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        errors: validation.errors,
      },
      { status: 400 },
    );
  }

  const created = createTrendCandidate({
    ...input,
    sourceUrl: validation.normalizedSourceUrl,
    sourcePlatform: validation.inferredSourcePlatform,
  });

  return NextResponse.json({
    ok: true,
    item: created,
    normalization: {
      sourceUrl: validation.normalizedSourceUrl,
      sourcePlatform: validation.inferredSourcePlatform,
      youtube: validation.youtube ?? null,
    },
  });
}

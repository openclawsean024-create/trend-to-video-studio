import { createMockAnalysisArtifacts, listSourceAssets } from '@trend-to-video-studio/core';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    items: listSourceAssets(),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body?.trendCandidateId) {
    return NextResponse.json(
      {
        ok: false,
        error: 'trendCandidateId is required',
      },
      { status: 400 },
    );
  }

  const artifacts = createMockAnalysisArtifacts(String(body.trendCandidateId));

  return NextResponse.json({
    ok: true,
    items: artifacts,
  });
}

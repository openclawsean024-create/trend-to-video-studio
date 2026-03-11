import {
  createMockAnalysisArtifacts,
  getTrendCandidateById,
  listSourceAssets,
  updateTrendCandidateStatus,
} from '@trend-to-video-studio/core';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    ok: true,
    items: listSourceAssets(),
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

  updateTrendCandidateStatus(trendCandidateId, 'processing');
  const artifacts = createMockAnalysisArtifacts(trendCandidateId);

  return NextResponse.json({
    ok: true,
    items: artifacts,
  });
}

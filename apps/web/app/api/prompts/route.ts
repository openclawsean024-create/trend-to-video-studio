import {
  createGeneratedPromptDraft,
  getTrendCandidateById,
  listPromptDrafts,
  listSourceAssetsByTrendCandidate,
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

  const candidate = getTrendCandidateById(trendCandidateId);
  if (!candidate) {
    return NextResponse.json(
      {
        ok: false,
        error: 'trendCandidateId does not exist',
      },
      { status: 404 },
    );
  }

  const artifacts = listSourceAssetsByTrendCandidate(trendCandidateId);
  if (artifacts.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: 'analysis artifacts are required before generating a prompt draft',
      },
      { status: 400 },
    );
  }

  const draft = createGeneratedPromptDraft(trendCandidateId);

  return NextResponse.json({
    ok: true,
    trendCandidate: candidate,
    analysisArtifactCount: artifacts.length,
    item: draft,
  });
}

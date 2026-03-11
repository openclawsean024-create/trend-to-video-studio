import {
  createSourceAssets,
  getTrendCandidateById,
  listSourceAssets,
  updateTrendCandidateStatus,
} from '@trend-to-video-studio/core';
import { getAnalysisProvider } from '@trend-to-video-studio/providers';
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

  updateTrendCandidateStatus(trendCandidateId, 'processing');

  const analysisProvider = getAnalysisProvider(String(body?.provider ?? '') || undefined);
  const result = await analysisProvider.analyzeTrend({
    trendCandidateId: candidate.id,
    topic: candidate.topic,
    sourceUrl: candidate.sourceUrl,
    sourcePlatform: candidate.sourcePlatform,
  });

  const artifacts = createSourceAssets(
    result.artifacts.map((artifact) => ({
      trendCandidateId: candidate.id,
      assetType: artifact.assetType,
      uri: artifact.uri,
      content: artifact.content,
      summary: artifact.summary,
      metadata: artifact.metadata,
    })),
  );
  updateTrendCandidateStatus(trendCandidateId, 'completed');

  return NextResponse.json({
    ok: true,
    provider: result.provider,
    summary: result.summary,
    items: artifacts,
  });
}

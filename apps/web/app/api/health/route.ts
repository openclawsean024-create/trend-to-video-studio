import { getDataFilePath, getProjectSnapshot } from '@trend-to-video-studio/core';
import { NextResponse } from 'next/server';

export async function GET() {
  const snapshot = getProjectSnapshot();

  return NextResponse.json({
    ok: true,
    service: 'web',
    phase: 3,
    storage: 'local-json',
    dataFile: getDataFilePath(),
    counts: {
      trendCandidates: snapshot.trendCandidates.length,
      sourceAssets: snapshot.sourceAssets.length,
      promptDrafts: snapshot.promptDrafts.length,
      videoJobs: snapshot.videoJobs.length,
      uploadJobs: snapshot.uploadJobs.length,
    },
  });
}

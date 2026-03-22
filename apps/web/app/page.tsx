import {
  getDataFilePath,
  getProjectSnapshot,
  getSnapshotStoreLabel,
  listPipelineEvents,
  listPromptDrafts,
  listSourceAssets,
  listTrendCandidates,
  listUploadJobs,
  listVideoJobs,
} from '@trend-to-video-studio/core';
import StudioDashboard from './StudioDashboard';

export default function HomePage() {
  const snapshot = getProjectSnapshot();
  const candidates = listTrendCandidates();
  const drafts = listPromptDrafts();
  const videos = listVideoJobs();
  const uploads = listUploadJobs();
  const events = listPipelineEvents(20);
  const storeLabel = getSnapshotStoreLabel();
  const dataPath = getDataFilePath();

  return (
    <StudioDashboard
      initialCandidates={candidates}
      initialDrafts={drafts}
      initialVideos={videos}
      initialUploads={uploads}
      initialEvents={events}
      storeLabel={storeLabel}
      dataPath={dataPath}
      sourceAssets={listSourceAssets()}
    />
  );
}

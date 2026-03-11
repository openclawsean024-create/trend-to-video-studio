import {
  listPromptDrafts,
  listSourceAssets,
  listTrendCandidates,
  listUploadJobs,
  listVideoJobs,
} from '@trend-to-video-studio/core';

export default function HomePage() {
  const trendCandidates = listTrendCandidates();
  const sourceAssets = listSourceAssets();
  const promptDrafts = listPromptDrafts();
  const videoJobs = listVideoJobs();
  const uploadJobs = listUploadJobs();

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', padding: 32, lineHeight: 1.6 }}>
      <h1>Trend to Video Studio</h1>
      <p>Phase 6 YouTube scheduling draft is ready.</p>

      <section>
        <h2>Trend Candidates</h2>
        <ul>
          {trendCandidates.map((candidate) => (
            <li key={candidate.id} style={{ marginBottom: 16 }}>
              <strong>{candidate.topic}</strong>
              <div>Platform: {candidate.sourcePlatform}</div>
              <div>Status: {candidate.status}</div>
              <div>URL: {candidate.sourceUrl}</div>
              <div>Discovered: {candidate.discoveredAt}</div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Source Assets</h2>
        <ul>
          {sourceAssets.map((asset) => (
            <li key={asset.id} style={{ marginBottom: 12 }}>
              <strong>{asset.assetType}</strong>
              <div>Trend Candidate: {asset.trendCandidateId}</div>
              <div>URI: {asset.uri}</div>
              <div>Created: {asset.createdAt}</div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Prompt Drafts</h2>
        <ul>
          {promptDrafts.map((draft) => (
            <li key={draft.id} style={{ marginBottom: 16 }}>
              <strong>{draft.title}</strong>
              <div>Status: {draft.status}</div>
              <div>Trend Candidate: {draft.trendCandidateId}</div>
              <div>Video Prompt: {draft.videoPrompt}</div>
              <div>Thumbnail Prompt: {draft.thumbnailPrompt}</div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Video Jobs</h2>
        <ul>
          {videoJobs.map((job) => (
            <li key={job.id} style={{ marginBottom: 12 }}>
              <strong>{job.id}</strong>
              <div>Prompt Draft: {job.promptDraftId}</div>
              <div>Provider: {job.provider}</div>
              <div>Status: {job.status}</div>
              <div>Output URL: {job.outputUrl ?? 'pending'}</div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Upload Jobs</h2>
        <ul>
          {uploadJobs.map((job) => (
            <li key={job.id} style={{ marginBottom: 12 }}>
              <strong>{job.id}</strong>
              <div>Video Job: {job.videoJobId}</div>
              <div>Platform: {job.platform}</div>
              <div>Status: {job.status}</div>
              <div>Scheduled For: {job.scheduledFor}</div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>API Notes</h2>
        <p>Use <code>GET /api/trend-candidates</code> to list items.</p>
        <p>Use <code>POST /api/trend-candidates</code> to add a candidate.</p>
        <p>Use <code>GET /api/analysis</code> to list source assets.</p>
        <p>Use <code>POST /api/analysis</code> with <code>{'{ trendCandidateId }'}</code> to create mock analysis artifacts.</p>
        <p>Use <code>GET /api/prompts</code> to list prompt drafts.</p>
        <p>Use <code>POST /api/prompts</code> with <code>{'{ trendCandidateId }'}</code> to create a prompt draft.</p>
        <p>Use <code>GET /api/video-jobs</code> to list video jobs.</p>
        <p>Use <code>POST /api/video-jobs</code> with <code>{'{ promptDraftId, prompt? }'}</code> to create and complete a mock video job.</p>
        <p>Use <code>GET /api/upload-jobs</code> to list upload jobs.</p>
        <p>Use <code>POST /api/upload-jobs</code> with <code>{'{ videoJobId, scheduledFor? }'}</code> to create and complete a mock upload job.</p>
      </section>
    </main>
  );
}

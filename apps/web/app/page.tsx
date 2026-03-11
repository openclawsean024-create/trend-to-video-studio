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
import { listVideoProviders } from '@trend-to-video-studio/providers';
import {
  createPromptAction,
  createTrendCandidateAction,
  createUploadJobAction,
  createVideoJobAction,
  runAnalysisAction,
} from './actions';

const sectionStyle = {
  marginBottom: 24,
  padding: 20,
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  background: '#fff',
} satisfies React.CSSProperties;

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  marginTop: 6,
} satisfies React.CSSProperties;

const buttonStyle = {
  padding: '10px 14px',
  borderRadius: 10,
  border: 'none',
  background: '#111827',
  color: '#fff',
  cursor: 'pointer',
} satisfies React.CSSProperties;

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        borderRadius: 999,
        background: '#e2e8f0',
        color: '#0f172a',
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

export default function HomePage() {
  const trendCandidates = listTrendCandidates();
  const sourceAssets = listSourceAssets();
  const promptDrafts = listPromptDrafts();
  const videoJobs = listVideoJobs();
  const uploadJobs = listUploadJobs();
  const pipelineEvents = listPipelineEvents(20);
  const snapshot = getProjectSnapshot();
  const videoProviders = listVideoProviders();
  const selectedEntityId = pipelineEvents[0]?.entityId;
  const selectedEntityEvents = selectedEntityId
    ? listPipelineEvents(100).filter((event) => event.entityId === selectedEntityId)
    : [];

  return (
    <main
      style={{
        fontFamily: 'Arial, sans-serif',
        padding: 32,
        lineHeight: 1.6,
        maxWidth: 1180,
        margin: '0 auto',
        background: '#f8fafc',
        minHeight: '100vh',
      }}
    >
      <h1>Trend to Video Studio</h1>
      <p>Operator dashboard for trend intake → analysis → prompts → video jobs → upload queue.</p>

      <section style={{ ...sectionStyle, background: '#eef2ff' }}>
        <h2 style={{ marginTop: 0 }}>Project Snapshot</h2>
        <div>Store: <code>{getSnapshotStoreLabel()}</code></div>
        <div>Data file: <code>{getDataFilePath()}</code></div>
        <div>Trend candidates: {snapshot.trendCandidates.length}</div>
        <div>Source assets: {snapshot.sourceAssets.length}</div>
        <div>Prompt drafts: {snapshot.promptDrafts.length}</div>
        <div>Video jobs: {snapshot.videoJobs.length}</div>
        <div>Upload jobs: {snapshot.uploadJobs.length}</div>
        <div>Pipeline events: {snapshot.pipelineEvents.length}</div>
        <div>Available video providers: {videoProviders.join(', ')}</div>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>Execution Plan</h2>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          <li><strong>Phase 1</strong> — stabilize repository/event model and API validation</li>
          <li><strong>Phase 2</strong> — strengthen operator dashboard and event-log inspection</li>
          <li><strong>Phase 3</strong> — provider registry, adapter contract, and provider-based job routing</li>
          <li><strong>Phase 4</strong> — automate end-to-end worker orchestration and retries</li>
        </ol>
        <p style={{ marginBottom: 0, color: '#475569' }}>
          Constraint: each phase stays comfortably below your 1,500,000-token ceiling by keeping scope narrow and independently verifiable.
        </p>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>Create Trend Candidate</h2>
        <form action={createTrendCandidateAction} style={{ display: 'grid', gap: 12 }}>
          <label>
            Topic
            <input name="topic" placeholder="AI storytelling shorts" style={inputStyle} />
          </label>
          <label>
            Source URL
            <input name="sourceUrl" placeholder="https://www.youtube.com/watch?v=..." style={inputStyle} />
          </label>
          <label>
            Source Platform
            <select name="sourcePlatform" defaultValue="youtube" style={inputStyle}>
              <option value="youtube">youtube</option>
              <option value="shorts">shorts</option>
              <option value="manual">manual</option>
            </select>
          </label>
          <div>
            <button type="submit" style={buttonStyle}>Add candidate</button>
          </div>
        </form>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>Trend Candidates</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {trendCandidates.map((candidate) => (
            <li key={candidate.id} style={{ padding: 16, borderTop: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <strong>{candidate.topic}</strong>
                <Badge>{candidate.status}</Badge>
                <Badge>{candidate.sourcePlatform}</Badge>
              </div>
              <div>ID: {candidate.id}</div>
              <div>URL: {candidate.sourceUrl}</div>
              {candidate.sourcePlatform !== 'manual' ? (
                <div style={{ fontSize: 13, color: '#475569' }}>Expected input: YouTube watch / shorts / youtu.be URL</div>
              ) : null}
              <div>Discovered: {candidate.discoveredAt}</div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                <form action={runAnalysisAction}>
                  <input type="hidden" name="trendCandidateId" value={candidate.id} />
                  <button type="submit" style={buttonStyle}>Run analysis</button>
                </form>
                <form action={createPromptAction}>
                  <input type="hidden" name="trendCandidateId" value={candidate.id} />
                  <button type="submit" style={buttonStyle}>Create prompt</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>Prompt Drafts</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {promptDrafts.map((draft) => (
            <li key={draft.id} style={{ padding: 16, borderTop: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <strong>{draft.title}</strong>
                <Badge>{draft.status}</Badge>
              </div>
              <div>ID: {draft.id}</div>
              <div>Trend Candidate: {draft.trendCandidateId}</div>
              <div>Video Prompt: {draft.videoPrompt}</div>
              <div>Thumbnail Prompt: {draft.thumbnailPrompt}</div>

              <form action={createVideoJobAction} style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                <input type="hidden" name="promptDraftId" value={draft.id} />
                <label>
                  Provider
                  <select name="provider" defaultValue="mock-sora-adapter" style={inputStyle}>
                    {videoProviders.map((provider) => (
                      <option key={provider} value={provider}>{provider}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Override prompt (optional)
                  <textarea name="prompt" rows={3} style={inputStyle} defaultValue={draft.videoPrompt} />
                </label>
                <div>
                  <button type="submit" style={buttonStyle}>Generate video job</button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>Video Jobs</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {videoJobs.map((job) => (
            <li key={job.id} style={{ padding: 16, borderTop: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <strong>{job.id}</strong>
                <Badge>{job.status}</Badge>
                <Badge>{job.provider}</Badge>
              </div>
              <div>Prompt Draft: {job.promptDraftId}</div>
              <div>Output URL: {job.outputUrl ?? 'pending'}</div>

              <form action={createUploadJobAction} style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                <input type="hidden" name="videoJobId" value={job.id} />
                <label>
                  Schedule for (ISO, optional)
                  <input name="scheduledFor" placeholder="2026-03-12T10:00:00.000Z" style={inputStyle} />
                </label>
                <div>
                  <button type="submit" style={buttonStyle}>Queue upload</button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>Source Assets</h2>
        <ul>
          {sourceAssets.map((asset) => (
            <li key={asset.id} style={{ marginBottom: 12 }}>
              <strong>{asset.assetType}</strong>
              <div>ID: {asset.id}</div>
              <div>Trend Candidate: {asset.trendCandidateId}</div>
              <div>URI: {asset.uri}</div>
              <div>Created: {asset.createdAt}</div>
            </li>
          ))}
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>Upload Jobs</h2>
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

      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>Pipeline Events</h2>
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1.2fr 1fr' }}>
          <div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {pipelineEvents.map((event) => (
                <li key={event.id} style={{ padding: 16, borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <strong>{event.type}</strong>
                    <Badge>{event.entityType}</Badge>
                    <Badge>{event.entityId}</Badge>
                  </div>
                  <div>ID: {event.id}</div>
                  <div>Message: {event.message}</div>
                  <div>Created: {event.createdAt}</div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 style={{ marginTop: 0 }}>Focused Event Stream</h3>
            {selectedEntityId ? (
              <>
                <p style={{ color: '#475569' }}>
                  Showing the latest event chain for entity <code>{selectedEntityId}</code>.
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {selectedEntityEvents.map((event) => (
                    <li key={event.id} style={{ padding: 16, borderTop: '1px solid #e5e7eb' }}>
                      <strong>{event.type}</strong>
                      <div>{event.message}</div>
                      <div style={{ fontSize: 13, color: '#475569' }}>{event.createdAt}</div>
                      {event.metadata ? (
                        <pre
                          style={{
                            marginTop: 10,
                            padding: 12,
                            background: '#0f172a',
                            color: '#e2e8f0',
                            borderRadius: 12,
                            overflowX: 'auto',
                            fontSize: 12,
                          }}
                        >
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>No events yet.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

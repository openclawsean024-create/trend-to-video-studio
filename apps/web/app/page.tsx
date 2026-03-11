import { exampleSnapshot } from '@trend-to-video-studio/core';

export default function HomePage() {
  return (
    <main style={{ fontFamily: 'Arial, sans-serif', padding: 32, lineHeight: 1.6 }}>
      <h1>Trend to Video Studio</h1>
      <p>Phase 1 schema and job flow draft is ready.</p>

      <section>
        <h2>Pipeline Snapshot</h2>
        <ul>
          <li>Trend candidates: {exampleSnapshot.trendCandidates.length}</li>
          <li>Source assets: {exampleSnapshot.sourceAssets.length}</li>
          <li>Prompt drafts: {exampleSnapshot.promptDrafts.length}</li>
          <li>Video jobs: {exampleSnapshot.videoJobs.length}</li>
          <li>Upload jobs: {exampleSnapshot.uploadJobs.length}</li>
        </ul>
      </section>

      <section>
        <h2>Example Payload</h2>
        <pre>{JSON.stringify(exampleSnapshot, null, 2)}</pre>
      </section>
    </main>
  );
}

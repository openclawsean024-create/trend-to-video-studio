import { listTrendCandidates } from '@trend-to-video-studio/core';

export default function HomePage() {
  const trendCandidates = listTrendCandidates();

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', padding: 32, lineHeight: 1.6 }}>
      <h1>Trend to Video Studio</h1>
      <p>Phase 2 URL intake draft is ready.</p>

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
        <h2>API Notes</h2>
        <p>Use <code>GET /api/trend-candidates</code> to list items.</p>
        <p>Use <code>POST /api/trend-candidates</code> with <code>{'{ topic, sourceUrl, sourcePlatform }'}</code> to add a candidate.</p>
      </section>
    </main>
  );
}

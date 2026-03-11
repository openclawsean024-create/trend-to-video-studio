import { exampleTrendCandidate } from '@trend-to-video-studio/core';

export default function HomePage() {
  return (
    <main style={{ fontFamily: 'Arial, sans-serif', padding: 32 }}>
      <h1>Trend to Video Studio</h1>
      <p>Phase 0 monorepo scaffold is ready.</p>
      <section>
        <h2>Example Trend Candidate</h2>
        <pre>{JSON.stringify(exampleTrendCandidate, null, 2)}</pre>
      </section>
    </main>
  );
}

export type TrendCandidate = {
  id: string;
  topic: string;
  sourceUrl: string;
  discoveredAt: string;
};

export const exampleTrendCandidate: TrendCandidate = {
  id: 'trend_001',
  topic: 'AI generated short-form storytelling',
  sourceUrl: 'https://example.com/source',
  discoveredAt: new Date('2026-03-11T10:00:00Z').toISOString(),
};

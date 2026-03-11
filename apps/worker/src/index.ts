import { exampleTrendCandidate } from '@trend-to-video-studio/core';
import { mockVideoProvider } from '@trend-to-video-studio/providers';

async function main() {
  console.log('Trend to Video Studio worker booted');
  console.log('Loaded example trend candidate:', exampleTrendCandidate.topic);
  const result = await mockVideoProvider.generateVideo({
    prompt: `Create an original short-form video about ${exampleTrendCandidate.topic}`,
  });
  console.log('Mock generation result:', result);
}

main().catch((error) => {
  console.error('Worker crashed', error);
  process.exit(1);
});

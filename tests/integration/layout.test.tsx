import { metadata } from '@/app/layout';

describe('RootLayout metadata', () => {
  it('exposes title and description', () => {
    expect(metadata.title).toBe('Learning Trainer');
    expect(metadata.description).toContain('AI-powered learning agent system');
  });
});

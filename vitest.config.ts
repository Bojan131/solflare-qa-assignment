import { defineConfig } from 'vitest/config';

// Runs the API tests only. E2E tests run through WebdriverIO.
export default defineConfig({
  test: {
    include: ['tests/api/**/*.test.ts'],
    setupFiles: ['tests/api/pacing.ts'],
    // Above two requests at the API client's 2 minute limit, so its clearer error reports first
    testTimeout: 300000,
    // One file at a time, to go easier on the API's rate limit
    fileParallelism: false,
    reporters: [
      'verbose',
      // One file, because the split report shows a blank page when opened from disk
      ['html', { outputDir: 'reports/api', singleFile: true }],
      // Marks failures on the GitHub run page
      ...(process.env.GITHUB_ACTIONS ? ['github-actions'] : []),
    ],
  },
});

import { defineConfig } from 'vitest/config';

// Runs the API tests only. E2E tests run through WebdriverIO.
export default defineConfig({
  test: {
    include: ['tests/api/**/*.test.ts'],
    // The API is live, so give it time to answer
    testTimeout: 30000,
    reporters: ['default', ['html', { outputDir: 'reports/api' }]],
  },
});

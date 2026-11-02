import { defineConfig } from 'vitest/config'; // vitest config helper

export default defineConfig({ // vitest settings
  test: { // test options
    include: ['tests/api/**/*.test.ts'], // where api tests live
    testTimeout: 30000, // the live api can be slow
    reporters: ['default', ['html', { outputDir: 'reports/api' }]], // console and html report
  },
});

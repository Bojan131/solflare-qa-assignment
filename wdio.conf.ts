import { logPageState } from './utils/page-state';
import { takeFailureScreenshot } from './utils/screenshot';

const SUPPORTED_BROWSERS = ['chrome', 'firefox'];
// The app follows the browser's language, and the test checks English text
const LANGUAGE = 'en-US';
// The last --browser flag wins, so a command can override an npm script
const browserIndex = process.argv.findLastIndex((argument) => argument.startsWith('--browser'));
const browserFlag = process.argv[browserIndex] ?? '--browser=chrome';
// Handles both --browser=firefox and --browser firefox
const browserName = browserFlag.split('=')[1] ?? process.argv[browserIndex + 1];

if (!SUPPORTED_BROWSERS.includes(browserName)) {
  throw new Error(`Unknown browser "${browserName}". Use chrome or firefox.`);
}

export const config: WebdriverIO.Config = {
  runner: 'local',
  specs: ['./tests/e2e/**/*.e2e.ts'],
  maxInstances: 1,
  capabilities: [
    {
      browserName,
      // Downloads the browser, so nothing has to be installed.
      // An older installed Firefox hung on startup.
      browserVersion: 'stable',
      'goog:chromeOptions': {
        args: [`--lang=${LANGUAGE}`],
        prefs: { 'intl.accept_languages': LANGUAGE },
      },
      'moz:firefoxOptions': {
        prefs: { 'intl.accept_languages': LANGUAGE },
      },
    },
  ],
  baseUrl: 'https://solflare.com',
  // Keeps WebdriverIO's own logs short but keeps our action log
  logLevel: 'warn',
  logLevels: { solflare: 'info' },
  // One folder per browser, because each run replaces its log
  outputDir: `logs/${browserName}`,
  // The first screen normally appears in about 3 seconds
  waitforTimeout: 10000,
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    // Well above the slowest full run so far, about 20 seconds
    timeout: 120000,
  },
  before: async () => {
    // The layout changes with the window size, so keep it the same everywhere
    await browser.setWindowSize(1440, 900);
  },
  afterTest: async (test, _context, { passed }) => {
    if (passed) return;
    // allSettled so a problem in one cannot stop the other
    await Promise.allSettled([takeFailureScreenshot(test.title), logPageState()]);
  },
};

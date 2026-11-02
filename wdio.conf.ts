import { logPageState } from './utils/page-state'; // logs what a failed page showed
import { takeFailureScreenshot } from './utils/screenshot'; // saves failure screenshots

const SUPPORTED_BROWSERS = ['chrome', 'firefox']; // browsers we run on
// finds the last --browser=name, so a command can override an npm script
const browserArgument = process.argv.findLast((argument) => argument.startsWith('--browser='));
const browserName = browserArgument?.split('=')[1] ?? 'chrome'; // chrome by default

if (!SUPPORTED_BROWSERS.includes(browserName)) { // stops on a typo
  throw new Error(`Unknown browser "${browserName}". Use chrome or firefox.`); // clear message
}

export const config: WebdriverIO.Config = { // webdriverio settings
  runner: 'local', // runs on this machine
  specs: ['./tests/e2e/**/*.e2e.ts'], // where e2e tests live
  maxInstances: 1, // one browser at a time
  capabilities: [{ browserName, browserVersion: 'stable' }], // downloads the latest stable browser
  baseUrl: 'https://solflare.com', // site under test
  logLevel: 'warn', // keeps webdriverio's own logs short
  logLevels: { solflare: 'info' }, // keeps our action logs
  outputDir: 'logs', // log files go here
  waitforTimeout: 10000, // waits up to 10s for elements
  framework: 'mocha', // test framework
  reporters: ['spec'], // readable console report
  mochaOpts: { // mocha settings
    ui: 'bdd', // describe and it style
    timeout: 120000, // the full flow can take a while
  },
  before: async () => { // runs before the tests
    await browser.setWindowSize(1440, 900); // same layout in every browser
  },
  afterTest: async (test, _context, { passed }) => { // runs after each test
    if (passed) return; // nothing to record
    await logPageState(); // log what the page showed
    await takeFailureScreenshot(test.title); // screenshot on failure
  },
};

import { logPageState } from './utils/page-state'; // logs what a failed page showed
import { takeFailureScreenshot } from './utils/screenshot'; // saves failure screenshots

const SUPPORTED_BROWSERS = ['chrome', 'firefox']; // browsers we run on
const LANGUAGE = 'en-US'; // the app follows the browser language, the test expects english
// finds the last --browser flag, so commands can override scripts
const browserIndex = process.argv.findLastIndex((argument) => argument.startsWith('--browser'));
const browserFlag = process.argv[browserIndex] ?? '--browser=chrome'; // chrome by default
// works for both --browser=firefox and --browser firefox
const browserName = browserFlag.split('=')[1] ?? process.argv[browserIndex + 1];

if (!SUPPORTED_BROWSERS.includes(browserName)) { // stops on a typo
  throw new Error(`Unknown browser "${browserName}". Use chrome or firefox.`); // clear message
}

export const config: WebdriverIO.Config = { // webdriverio settings
  runner: 'local', // runs on this machine
  specs: ['./tests/e2e/**/*.e2e.ts'], // where e2e tests live
  maxInstances: 1, // one browser at a time
  capabilities: [{ // the browser for this run
    browserName, // chrome or firefox
    browserVersion: 'stable', // downloads the latest stable browser
    'goog:chromeOptions': { // chrome settings
      args: [`--lang=${LANGUAGE}`], // browser language
      prefs: { 'intl.accept_languages': LANGUAGE }, // language sent to sites
    },
    'moz:firefoxOptions': { // firefox settings
      prefs: { 'intl.accept_languages': LANGUAGE }, // language sent to sites
    },
  }],
  baseUrl: 'https://solflare.com', // site under test
  logLevel: 'warn', // keeps webdriverio's own logs short
  logLevels: { solflare: 'info' }, // keeps our action logs
  outputDir: `logs/${browserName}`, // one log folder per browser
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
    // one failing cannot stop the other
    await Promise.allSettled([takeFailureScreenshot(test.title), logPageState()]);
  },
};

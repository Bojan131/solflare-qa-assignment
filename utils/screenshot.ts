import { mkdirSync } from 'node:fs';
import { browser } from '@wdio/globals';
import log from './logger';

// Saves a screenshot for a failed test. The timestamp keeps screenshots from earlier runs.
export async function takeFailureScreenshot(testTitle: string) {
  mkdirSync('screenshots', { recursive: true });
  const safeTitle = testTitle.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const browserName = browser.capabilities.browserName;
  const path = `screenshots/${browserName}-${safeTitle}-${timestamp}.png`;
  await browser.saveScreenshot(path);
  log.info(`saved failure screenshot: ${path}`);
}

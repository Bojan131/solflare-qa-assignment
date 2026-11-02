import { mkdirSync } from 'node:fs'; // creates folders
import { browser } from '@wdio/globals'; // webdriverio browser object
import log from './logger'; // action logger

export async function takeFailureScreenshot(testTitle: string) { // saves the failed screen
  mkdirSync('screenshots', { recursive: true }); // make sure the folder exists
  const safeTitle = testTitle.replace(/[^a-z0-9]+/gi, '-').toLowerCase(); // safe for a file name
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // keeps older screenshots
  const browserName = browser.capabilities.browserName; // chrome or firefox
  const path = `screenshots/${browserName}-${safeTitle}-${timestamp}.png`; // where it goes
  await browser.saveScreenshot(path); // save the screenshot
  log.info(`saved failure screenshot: ${path}`); // record where it went
}

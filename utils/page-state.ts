import { browser } from '@wdio/globals'; // webdriverio browser object
import log from './logger'; // action logger

export async function logPageState() { // records what the page showed when a test failed
  const page = await browser.execute(() => { // reads details from the page
    const entries = performance.getEntriesByType('navigation'); // page load info
    const load = entries[0] as PerformanceNavigationTiming | undefined; // can be missing
    // start of the visible text
    const text = document.body.innerText.replace(/\s+/g, ' ').slice(0, 120);
    return { status: load?.responseStatus, text }; // send both back
  });
  const url = await browser.getUrl(); // where the test stopped
  const details = `failed on ${url} | status ${page.status} | page: ${page.text}`; // summary
  log.error(details); // goes to the log file
  console.error(details); // also shows in the terminal
}

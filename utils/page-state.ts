import { browser } from '@wdio/globals';
import log from './logger';

// Logs what the page showed when a test failed, so a blocked or blank page is easy to spot
export async function logPageState() {
  const page = await browser.execute(() => {
    const entries = performance.getEntriesByType('navigation');
    // Can be missing on a page that failed to load
    const load = entries[0] as PerformanceNavigationTiming | undefined;
    const text = document.body.innerText.replace(/\s+/g, ' ').slice(0, 120);
    return { status: load?.responseStatus, text };
  });
  const url = await browser.getUrl();
  const details = `failed on ${url} | status ${page.status} | page: ${page.text}`;
  log.error(details);
  // The log goes to a file, so also print this for whoever is watching the terminal
  console.error(details);
}

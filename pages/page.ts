import { browser } from '@wdio/globals';
import log from '../utils/logger';

// Base class for the page objects, as the WebdriverIO docs recommend
export default class Page {
  async open(path: string) {
    log.info(`open ${path}`);
    await browser.url(path);
  }

  async reload() {
    log.info('reload page');
    await browser.refresh();
  }
}

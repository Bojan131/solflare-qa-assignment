import { browser } from '@wdio/globals'; // webdriverio browser object
import log from '../utils/logger'; // action logger

export default class Page { // shared by all page objects
  async open(path: string) { // opens a path on the site
    log.info(`open ${path}`); // record the action
    await browser.url(path); // path is relative to baseUrl
  }
}

import { $, $$ } from '@wdio/globals';
import log from '../utils/logger';
import Page from './page';

// Show or hide wallets screen, with one toggle per wallet
class ShowHideWalletsPage extends Page {
  get toggles() {
    return $$('[data-testid^="tgl-li-wallets-"]');
  }
  get saveButton() {
    return $('[data-testid="btn-save"]');
  }

  async getAddress(position: number) {
    // The toggle's test ID ends with the wallet's address
    const testId = await this.toggles[position].getAttribute('data-testid');
    return testId!.replace('tgl-li-wallets-', '');
  }

  async selectWallet(position: number) {
    log.info(`select wallet at position ${position}`);
    await this.toggles[position].click();
  }

  async clickSave() {
    log.info('click save');
    await this.saveButton.click();
  }
}

export default new ShowHideWalletsPage();

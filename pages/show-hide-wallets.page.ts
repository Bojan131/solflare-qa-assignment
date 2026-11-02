import { $, $$ } from '@wdio/globals'; // finds elements
import log from '../utils/logger'; // action logger
import Page from './page'; // shared page helpers

class ShowHideWalletsPage extends Page { // show or hide wallets screen
  get toggles() { return $$('[data-testid^="tgl-li-wallets-"]'); } // one toggle per wallet
  get saveButton() { return $('[data-testid="btn-save"]'); } // saves the choices

  async getAddress(position: number) { // reads a wallet's address
    const testId = await this.toggles[position].getAttribute('data-testid'); // read its test id
    return testId?.replace('tgl-li-wallets-', ''); // keep only the address
  }

  async selectWallet(position: number) { // turns a wallet on
    log.info(`select wallet at position ${position}`); // record the action
    await this.toggles[position].click(); // click its toggle
  }

  async clickSave() { // saves the choices
    log.info('click save'); // record the action
    await this.saveButton.click(); // click save
  }
}

export default new ShowHideWalletsPage(); // one shared instance

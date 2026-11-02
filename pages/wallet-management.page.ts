import { $, $$ } from '@wdio/globals'; // finds elements
import log from '../utils/logger'; // action logger
import Page from './page'; // shared page helpers

const SECTION = '[data-testid="section-Recovery phrase"]'; // recovery phrase part of the panel

class WalletManagementPage extends Page { // my wallets panel
  get avatar() { return $('[data-testid="wallet-picker-avatar"]'); } // avatar in the header
  get netWorthLabel() { return $('span=Net worth'); } // net worth label in the panel
  get walletNames() { return $$(`${SECTION} [data-testid="text-wallet-name"]`); } // listed names
  get walletRows() { return $$(`${SECTION} [data-testid^="li-wallets-"]`); } // listed wallets
  // three dots next to the label
  get optionsButton() { return $(`${SECTION} [data-testid="icon-btn-wallet-section-options"]`); }
  get createNewItem() { return $('[data-testid="li-recovery-phrase-create-new"]'); } // menu item
  get renameItem() { return $('[data-testid="li-recovery-phrase-rename-section"]'); } // menu item
  get showOrHideItem() { return $('[data-testid="li-recovery-phrase-show-or-hide"]'); } // menu item
  get revealItem() { return $('[data-testid="li-recovery-phrase-export"]'); } // menu item
  get removeItem() { return $('[data-testid="li-recovery-phrase-remove"]'); } // menu item

  walletRow(address?: string) { // finds one wallet in the list
    return $(`${SECTION} [data-testid="li-wallets-${address}"]`); // row for that address
  }

  async clickAvatar() { // opens the panel
    log.info('click avatar'); // record the action
    await this.avatar.click(); // click the avatar
  }

  async clickOptions() { // opens the recovery phrase menu
    log.info('click recovery phrase options'); // record the action
    await this.optionsButton.click(); // click three dots
  }

  async clickShowOrHide() { // opens the wallet toggles
    log.info('click show or hide wallets'); // record the action
    await this.showOrHideItem.click(); // click show or hide wallets
  }

  async getWalletAddresses() { // reads addresses from the list
    // each test id holds an address
    const testIds = await this.walletRows.map((row) => row.getAttribute('data-testid'));
    return testIds.map((testId) => testId?.replace('li-wallets-', '')); // keep only the address
  }
}

export default new WalletManagementPage(); // one shared instance

import { $, $$ } from '@wdio/globals';
import log from '../utils/logger';
import Page from './page';

const SECTION = '[data-testid="section-Recovery phrase"]';

// My wallets panel, opened from the avatar in the header
class WalletManagementPage extends Page {
  get avatar() {
    return $('[data-testid="wallet-picker-avatar"]');
  }
  get walletNames() {
    return $$(`${SECTION} [data-testid="text-wallet-name"]`);
  }
  get walletRows() {
    return $$(`${SECTION} [data-testid^="li-wallets-"]`);
  }
  get optionsButton() {
    return $(`${SECTION} [data-testid="icon-btn-wallet-section-options"]`);
  }
  get showOrHideItem() {
    return $('[data-testid="li-recovery-phrase-show-or-hide"]');
  }

  walletRow(address: string) {
    return $(`${SECTION} [data-testid="li-wallets-${address}"]`);
  }

  async clickAvatar() {
    log.info('click avatar');
    await this.avatar.click();
  }

  async clickOptions() {
    log.info('click recovery phrase options');
    await this.optionsButton.click();
  }

  async clickShowOrHide() {
    log.info('click show or hide wallets');
    await this.showOrHideItem.click();
  }

  async getWalletAddresses() {
    // Each row's test ID ends with the wallet's address
    const testIds = await this.walletRows.map((row) => row.getAttribute('data-testid'));
    return testIds.map((testId) => testId!.replace('li-wallets-', ''));
  }
}

export default new WalletManagementPage();

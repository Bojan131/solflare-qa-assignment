import { $ } from '@wdio/globals'; // finds elements
import Page from './page'; // shared page helpers

class PortfolioPage extends Page { // main page after creating a wallet
  get logo() { return $('button[aria-label="Solflare"]'); } // solflare logo in the menu
  get balancePanel() { return $('[data-testid="section-portfolio-hero"]'); } // balance panel
  get walletPicker() { return $('[data-testid="section-wallet-picker"]'); } // main wallet button
}

export default new PortfolioPage(); // one shared instance

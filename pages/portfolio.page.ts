import { $ } from '@wdio/globals'; // finds elements
import Page from './page'; // shared page helpers

class PortfolioPage extends Page { // main page after creating a wallet
  get balancePanel() { return $('[data-testid="section-portfolio-hero"]'); } // balance panel
}

export default new PortfolioPage(); // one shared instance

import { $ } from '@wdio/globals';
import Page from './page';

// Main page, shown after a wallet is created
class PortfolioPage extends Page {
  get balancePanel() { return $('[data-testid="section-portfolio-hero"]'); }
}

export default new PortfolioPage();

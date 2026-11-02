import { $ } from '@wdio/globals'; // finds elements
import log from '../utils/logger'; // action logger
import Page from './page'; // shared page helpers

class OnboardingPage extends Page { // onboarding screens
  get getStartedButton() { return $('[data-testid="btn-get-started"]'); } // first screen button
  get createWalletButton() { return $('[data-testid="btn-manual-create"]'); } // second screen
  get passwordInput() { return $('[data-testid="input-new-password"]'); } // first field
  get repeatPasswordInput() { return $('[data-testid="input-repeat-password"]'); } // second field
  // terms tick box, the inner label of the terms row
  get termsCheckbox() { return $('[data-key="onboard-term-and-conditions-check"] label'); }
  get continueButton() { return $('[data-testid="btn-continue"]'); } // submits the form

  async openOnboarding() { // opens the first screen
    await this.open('/onboard'); // go to onboarding
  }

  async clickGetStarted() { // leaves the first screen
    log.info('click get started'); // record the action
    await this.getStartedButton.click(); // click get started
  }

  async clickCreateWallet() { // chooses a new wallet
    log.info('click create new wallet'); // record the action
    await this.createWalletButton.click(); // click create new wallet
  }

  async enterPassword(password: string) { // fills the first field
    log.info('enter password'); // never logs the value
    await this.passwordInput.setValue(password, { mask: true }); // type it, hidden from logs
  }

  async repeatPassword(password: string) { // fills the second field
    log.info('repeat password'); // never logs the value
    await this.repeatPasswordInput.setValue(password, { mask: true }); // type it, hidden from logs
  }

  async acceptTerms() { // ticks the terms box
    log.info('accept terms'); // record the action
    await this.termsCheckbox.click(); // tick the box
  }

  async clickContinue() { // submits the form
    log.info('click continue'); // record the action
    await this.continueButton.click(); // click continue
  }
}

export default new OnboardingPage(); // one shared instance

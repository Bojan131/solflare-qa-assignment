import { $ } from '@wdio/globals';
import log from '../utils/logger';
import Page from './page';

// Onboarding screens, from the first page to the password form
class OnboardingPage extends Page {
  get getStartedButton() {
    return $('[data-testid="btn-get-started"]');
  }
  get createWalletButton() {
    return $('[data-testid="btn-manual-create"]');
  }
  get passwordInput() {
    return $('[data-testid="input-new-password"]');
  }
  get repeatPasswordInput() {
    return $('[data-testid="input-repeat-password"]');
  }
  // The input is 1x1 and the outer label's centre is the Terms of Service link,
  // so the inner label is the only safe place to click
  get termsCheckbox() {
    return $('[data-key="onboard-term-and-conditions-check"] label');
  }
  get continueButton() {
    return $('[data-testid="btn-continue"]');
  }

  async openOnboarding() {
    await this.open('/onboard');
  }

  async clickGetStarted() {
    log.info('click get started');
    await this.getStartedButton.click();
  }

  async clickCreateWallet() {
    log.info('click create new wallet');
    await this.createWalletButton.click();
  }

  async enterPassword(password: string) {
    log.info('enter password');
    // Masked so the password stays out of the logs
    await this.passwordInput.setValue(password, { mask: true });
  }

  async repeatPassword(password: string) {
    log.info('repeat password');
    await this.repeatPasswordInput.setValue(password, { mask: true });
  }

  async acceptTerms() {
    log.info('accept terms');
    await this.termsCheckbox.click();
  }

  async clickContinue() {
    log.info('click continue');
    await this.continueButton.click();
  }
}

export default new OnboardingPage();

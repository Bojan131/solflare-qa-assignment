import { randomUUID } from 'node:crypto';
import { browser, expect } from '@wdio/globals';
import onboardingPage from '../../pages/onboarding.page';
import portfolioPage from '../../pages/portfolio.page';
import showHideWalletsPage from '../../pages/show-hide-wallets.page';
import walletManagementPage from '../../pages/wallet-management.page';

// Each run creates a new wallet, so there is nothing to store.
// The fixed start gives it an uppercase letter, lowercase letter, number and symbol.
const PASSWORD = `Aa1!${randomUUID().slice(0, 12)}`;
// List positions start at zero
const FIRST_WALLET = 0;
const THIRD_WALLET = 2;
const FOURTH_WALLET = 3;

// Checks the list holds exactly these wallets. Counting rows alone would pass
// with the wrong wallets, so it looks for each address too.
async function expectSavedWallets(addresses: string[]) {
  await expect(walletManagementPage.walletRows).toBeElementsArrayOfSize(3);
  for (const address of addresses) {
    await expect(walletManagementPage.walletRow(address)).toBeDisplayed();
  }
}

// TC-01 in docs/test-case.md
describe('Wallet management', () => {
  it('shows the two new wallets in the recovery phrase list after saving', async () => {
    await onboardingPage.open();
    await expect(onboardingPage.getStartedButton).toBeDisplayed();
    await onboardingPage.clickGetStarted();
    await onboardingPage.clickCreateWallet();

    await expect(onboardingPage.continueButton).toBeDisabled();
    await onboardingPage.enterPassword(PASSWORD);
    await onboardingPage.repeatPassword(PASSWORD);
    await onboardingPage.acceptTerms();
    await expect(onboardingPage.continueButton).toBeEnabled();
    await onboardingPage.clickContinue();

    await expect(browser).toHaveUrl(expect.stringContaining('/portfolio'));
    await expect(portfolioPage.balancePanel).toBeDisplayed();

    await walletManagementPage.clickAvatar();
    await expect(walletManagementPage.walletNames[FIRST_WALLET]).toBeDisplayed();
    await expect(walletManagementPage.walletNames[FIRST_WALLET]).toHaveText('Main Wallet');

    await walletManagementPage.clickOptions();
    await walletManagementPage.clickShowOrHide();
    // The test needs a 3rd and 4th wallet, so wait until they have loaded
    await expect(showHideWalletsPage.toggles).toBeElementsArrayOfSize({ gte: 4 });
    await expect(showHideWalletsPage.saveButton).toBeDisabled();

    // Check this before selecting others: it is disabled only while it is the only wallet shown
    const firstToggle = showHideWalletsPage.toggles[FIRST_WALLET];
    await expect(firstToggle).toBeDisabled();
    await expect(firstToggle).toHaveAttribute('aria-checked', 'true');

    const mainAddress = await showHideWalletsPage.getAddress(FIRST_WALLET);
    const thirdAddress = await showHideWalletsPage.getAddress(THIRD_WALLET);
    const fourthAddress = await showHideWalletsPage.getAddress(FOURTH_WALLET);

    await showHideWalletsPage.selectWallet(THIRD_WALLET);
    await showHideWalletsPage.selectWallet(FOURTH_WALLET);
    const thirdToggle = showHideWalletsPage.toggles[THIRD_WALLET];
    const fourthToggle = showHideWalletsPage.toggles[FOURTH_WALLET];
    await expect(thirdToggle).toHaveAttribute('aria-checked', 'true');
    await expect(fourthToggle).toHaveAttribute('aria-checked', 'true');
    await expect(showHideWalletsPage.saveButton).toBeEnabled();
    await showHideWalletsPage.clickSave();

    const expectedAddresses = [mainAddress, thirdAddress, fourthAddress];
    await expectSavedWallets(expectedAddresses);

    // Reload to prove Save really stored the wallets
    await walletManagementPage.reload();
    await expectSavedWallets(expectedAddresses);
  });
});

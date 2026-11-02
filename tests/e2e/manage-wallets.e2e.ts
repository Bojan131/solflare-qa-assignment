import { randomUUID } from 'node:crypto'; // makes random values
import { browser, expect } from '@wdio/globals'; // browser and assertions that retry
import onboardingPage from '../../pages/onboarding.page'; // onboarding screens
import portfolioPage from '../../pages/portfolio.page'; // main page after onboarding
import showHideWalletsPage from '../../pages/show-hide-wallets.page'; // wallet toggles screen
import walletManagementPage from '../../pages/wallet-management.page'; // my wallets panel

const PASSWORD = `Aa1!${randomUUID().slice(0, 12)}`; // new throwaway password each run
const FIRST_WALLET = 0; // list positions start at zero
const THIRD_WALLET = 2; // 3rd item in the list
const FOURTH_WALLET = 3; // 4th item in the list

async function expectSavedWallets(addresses: string[]) { // checks the list holds exactly these
  await expect(walletManagementPage.walletRows).toBeElementsArrayOfSize(3); // original plus two
  const savedAddresses = await walletManagementPage.getWalletAddresses(); // read the list
  expect(savedAddresses).toEqual(expect.arrayContaining(addresses)); // all three listed
  for (const address of addresses) { // check each wallet
    await expect(walletManagementPage.walletRow(address)).toBeDisplayed(); // it is visible
  }
}

describe('Wallet management', () => { // wallet management feature
  it('shows the two new wallets in the recovery phrase list after saving', async () => { // the flow
    await onboardingPage.openOnboarding(); // go to onboarding
    await expect(onboardingPage.getStartedButton).toBeDisplayed(); // the app has loaded
    await onboardingPage.clickGetStarted(); // click get started
    await onboardingPage.clickCreateWallet(); // click create new wallet

    await expect(onboardingPage.continueButton).toBeDisabled(); // cannot continue on an empty form
    await onboardingPage.enterPassword(PASSWORD); // type password
    await onboardingPage.repeatPassword(PASSWORD); // type it again
    await onboardingPage.acceptTerms(); // tick terms box
    await expect(onboardingPage.continueButton).toBeEnabled(); // form is valid
    await onboardingPage.clickContinue(); // submit the form

    await expect(browser).toHaveUrl(expect.stringContaining('/portfolio')); // wallet was created
    await expect(portfolioPage.balancePanel).toBeDisplayed(); // portfolio has loaded

    await walletManagementPage.clickAvatar(); // open my wallets
    await expect(walletManagementPage.walletNames[FIRST_WALLET]).toBeDisplayed(); // name is visible
    // it is the main wallet
    await expect(walletManagementPage.walletNames[FIRST_WALLET]).toHaveText('Main Wallet');

    await walletManagementPage.clickOptions(); // click three dots
    await walletManagementPage.clickShowOrHide(); // open wallet toggles
    await expect(showHideWalletsPage.toggles).toBeElementsArrayOfSize({ gte: 4 }); // list loaded
    await expect(showHideWalletsPage.saveButton).toBeDisabled(); // nothing to save yet

    const firstToggle = showHideWalletsPage.toggles[FIRST_WALLET]; // main wallet's toggle
    await expect(firstToggle).toBeDisabled(); // cannot be turned off
    await expect(firstToggle).toHaveAttribute('aria-checked', 'true'); // first toggle is on

    const mainAddress = await showHideWalletsPage.getAddress(FIRST_WALLET); // original wallet
    const thirdAddress = await showHideWalletsPage.getAddress(THIRD_WALLET); // first new wallet
    const fourthAddress = await showHideWalletsPage.getAddress(FOURTH_WALLET); // second new wallet

    await showHideWalletsPage.selectWallet(THIRD_WALLET); // turn on 3rd wallet
    await showHideWalletsPage.selectWallet(FOURTH_WALLET); // turn on 4th wallet
    const thirdToggle = showHideWalletsPage.toggles[THIRD_WALLET]; // 3rd wallet's toggle
    const fourthToggle = showHideWalletsPage.toggles[FOURTH_WALLET]; // 4th wallet's toggle
    await expect(thirdToggle).toHaveAttribute('aria-checked', 'true'); // 3rd is on
    await expect(fourthToggle).toHaveAttribute('aria-checked', 'true'); // 4th is on
    await expect(showHideWalletsPage.saveButton).toBeEnabled(); // there is something to save
    await showHideWalletsPage.clickSave(); // save the choices

    const expectedAddresses = [mainAddress, thirdAddress, fourthAddress]; // recorded before saving
    await expectSavedWallets(expectedAddresses); // the list shows these three

    await walletManagementPage.reload(); // reload to prove the choices were stored
    await expectSavedWallets(expectedAddresses); // the list still shows these three
  });
});

# E2E test case

**ID:** E2E-01
**Title:** Shows the two new wallets in the recovery phrase list after saving
**Priority:** High. Losing track of wallets is one of the biggest risks in a wallet app.
**Spec:** `tests/e2e/manage-wallets.e2e.ts`

## Preconditions

- A clean browser session, so every run creates a new wallet.
- No stored credentials. The test generates its own password.

## Steps

| # | Action | Expected | Brief step |
|---|---|---|---|
| 1 | Open `/onboard` | Onboarding page opens | 1 |
| 2 | Click Get started | Create wallet screen opens | 2 |
| 3 | Click Create new wallet | Password form opens | Not in brief |
| 4 | Enter the password | Field is filled | 3 |
| 5 | Enter the same password again | Field is filled | 4 |
| 6 | Tick the Terms of Service box | Continue becomes enabled | 5 |
| 7 | Click Continue | Portfolio page opens | 6 |
| 8 | Click the avatar | My wallets panel opens | 7 |
| 9 | Check the first recovery phrase wallet | Main Wallet is displayed | 8 |
| 10 | Click the three dots next to Recovery phrase | Options menu opens | 9 |
| 11 | Click Show or hide wallets | Wallet list opens | 10 |
| 12 | Check the first toggle | It is disabled | 11 |
| 13 | Check the first toggle | It is on | 12 |
| 14 | Turn on the 3rd and 4th wallets, noting their addresses | Both toggles are on | 13 |
| 15 | Click Save | Returns to My wallets | 14 |
| 16 | Read the recovery phrase list | It holds exactly the original wallet and those two addresses | Expected result |

## Differences from the brief

- The brief has no step for Create new wallet, but the app needs it.
- The brief says "Main wallet". The app shows "Main Wallet".
- The first toggle is disabled only while it is the only wallet shown, so steps 12 and 13 must run before step 14.

## Why the last check uses addresses

Counting three rows would pass even if the wrong wallets were saved. The test records the 3rd and 4th addresses before saving and looks for those same addresses afterwards.

## Not covered

- A passing Chrome headless run. The script exists, but solflare.com blocks it, so it fails at step 2.
- Password rules and other negative cases. The brief asks for one test.
- Google sign-in and importing a wallet.

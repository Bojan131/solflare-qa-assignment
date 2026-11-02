# TC-01: Recovery phrase list shows newly added wallets

| Field | Value |
|---|---|
| Test case ID | TC-01 |
| Module | Wallet management |
| Description | Verify that wallets turned on in Show or hide wallets appear in the recovery phrase list |
| Requirement | Technical assignment, task 1 |
| Priority | High |
| Test type | Functional, E2E |
| Automation | Automated in `tests/e2e/manage-wallets.e2e.ts` |
| Environment | Production, https://solflare.com |
| Browsers | Chrome and Firefox, latest stable |
| Preconditions | Clean browser session with no wallet |
| Test data | Any valid password |

## Test steps

1. Go to https://solflare.com/onboard
2. Verify that the page loaded and the Solflare logo, Get started and Import existing wallet are displayed
3. Click Get started
4. Verify that Create new wallet and Continue with Google are displayed
5. Click Create new wallet
6. Verify that both password fields and Continue are displayed, and Continue is disabled
7. Enter a password
8. Enter the same password in the second field
9. Accept the Terms of Service and Privacy Policy
10. Verify that Continue is enabled
11. Click Continue
12. Verify that the page loaded and the Solflare logo, balance panel and Main Wallet button are displayed
13. Click the avatar in the header to open Wallet management
14. Verify that Net worth and Main Wallet are displayed
15. Click the three dots next to Recovery phrase
16. Verify that Create new wallet, Rename recovery phrase, Show or hide wallets, Reveal recovery phrase and Remove recovery phrase are displayed
17. Click Show or hide wallets
18. Verify that the wallet list is displayed and Save is disabled
19. Verify that the first toggle is disabled
20. Verify that the first toggle is on
21. Turn on the 3rd and 4th wallets
22. Verify that both toggles are on and Save is enabled
23. Click Save
24. Reload the page

## Expected result

Before and after the reload, the recovery phrase list shows 3 wallets: Main Wallet and the two wallets turned on in step 21.

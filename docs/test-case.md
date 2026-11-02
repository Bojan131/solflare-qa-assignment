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
2. Verify that Get started is displayed
3. Click Get started
4. Click Create new wallet
5. Verify that Continue is disabled
6. Enter a password
7. Enter the same password in the second field
8. Accept the Terms of Service and Privacy Policy
9. Verify that Continue is enabled
10. Click Continue
11. Verify that the Portfolio page opens and the balance panel is displayed
12. Click the avatar in the header to open Wallet management
13. Verify that Main Wallet is displayed
14. Click the three dots next to Recovery phrase
15. Click Show or hide wallets
16. Verify that Save is disabled
17. Verify that the first toggle is disabled
18. Verify that the first toggle is on
19. Note the wallet addresses, then turn on the 3rd and 4th wallets
20. Verify that both toggles are on and Save is enabled
21. Click Save
22. Reload the page

## Expected result

Before and after the reload, the recovery phrase list shows 3 wallets: Main Wallet and the two wallets turned on in step 19.

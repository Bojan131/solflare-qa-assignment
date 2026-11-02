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
2. Click Get started
3. Click Create new wallet
4. Enter a password
5. Enter the same password in the second field
6. Accept the Terms of Service and Privacy Policy
7. Click Continue
8. Click the avatar in the header to open Wallet management
9. Verify that Main Wallet is displayed
10. Click the three dots next to Recovery phrase
11. Click Show or hide wallets
12. Verify that the first toggle is disabled
13. Verify that the first toggle is on
14. Turn on the 3rd and 4th wallets
15. Click Save

## Expected result

The recovery phrase list contains Main Wallet and the two wallets turned on in step 14.

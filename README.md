# Solflare QA assignment

[![API tests](https://github.com/Bojan131/solflare-qa-assignment/actions/workflows/api-tests.yml/badge.svg)](https://github.com/Bojan131/solflare-qa-assignment/actions/workflows/api-tests.yml)

WebdriverIO E2E test and Vitest API tests for the Solflare wallet.

The E2E test creates a new wallet, turns on the 3rd and 4th wallets under Show or hide wallets, saves, and checks that the recovery phrase list holds the original wallet and those two, including after a page reload. The steps are in [docs/test-case.md](docs/test-case.md).

The API tests check that portfolio totals and net worth add up on the live API, that holdings match the blockchain, and how bad requests are handled. The cases are in [docs/api-test-cases.md](docs/api-test-cases.md). They also run in GitHub Actions on every push to `main`.

The bugs I found are in [docs/bugs.md](docs/bugs.md).

## Setup

You need Node 24.22.2, as set in `.nvmrc`, and internet access.

```bash
nvm install
npm ci
```

WebdriverIO downloads Chrome and Firefox when it needs them, so they don't have to be installed. It contacts the download sites on every run, so a Firefox run fails with `Couldn't find a matching firefox browser` if archive.mozilla.org can't be reached.

## Running the tests

```bash
npm test                                  # API tests, then E2E in Firefox headless
npm run test:api                          # API tests
npm run test:e2e:chrome                   # E2E in Chrome
npm run test:e2e:firefox                  # E2E in Firefox
npm run test:e2e:firefox:headless         # E2E in Firefox, headless
npm run test:e2e:chrome:headless          # E2E in Chrome, headless. Currently fails, see known issues
```

The browser is a command line argument, so `npx wdio run wdio.conf.ts --browser=firefox` works too.

An API run takes about a minute and shows `1 expected fail`. That's API-13, a known bug. It turns red once the bug is fixed, as a reminder to remove the marker.

## Test output

- **E2E actions and failure details:** `logs/<browser>/`, with failure details also in the terminal
- **Screenshots of failed tests:** `screenshots/`
- **API report:** `reports/api/index.html`, also saved as the `api-report` artifact on each GitHub Actions run

## Decisions

- Each E2E run creates a new wallet with a generated password, so there are no credentials to store. The password is masked when typed and never logged.
- No Cucumber, because there is one test and no business team writing scenarios. No Docker, because WebdriverIO downloads the browsers itself, so Node is the only requirement.
- E2E isn't in GitHub Actions, because each run creates a wallet on the live site. Only the API tests run there.
- No retries, because a retry could hide a real bug.
- Prices move between calls, so values from separate responses can differ by 0.25%. The worst gap I measured was 0.086%, with the stock market open. Values from one response must match to 6 decimals.
- The net worth test sends its own GET calls instead of reusing the first test's, because the assignment also asks for independent tests.
- The assignment lists no error codes, so a bad token can get 401 or 403, and bad input 400 or 422. A 429 fails these tests, because it means the rate limit answered and the check never ran.
- Tests that only compare the API with itself can't see data that's wrong everywhere, so token amounts are compared with the blockchain and the EUR value with the European Central Bank's rate. If either service fails, the error names it, so it doesn't read as an API bug.
- Each request waits up to 2 minutes, so a stall doesn't look like a wrong value. An answer over 10 seconds still fails the run, as a separate failure listing the slow URLs. The assignment sets no limit, so 10 seconds is our own bar. Normal answers took under 6.
- There is a 2 second gap between tests, so runs stay under the rate limit without retrying. A 1 second gap still got blocked on the third run in a row.

## Known issues

**Chrome headless is blocked.** solflare.com answers Chrome's headless browser with a 403, so that script fails on the first screen, and I didn't disguise the browser to get past it. On a real project, I'd ask the team for an approved way through, such as a secret header Cloudflare lets pass or an allowlisted IP for the test machines, instead of disguising the browser. You can see it with curl, which returned 403 on 2 Nov 2026, while a normal Chrome user agent got a 200:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -A 'HeadlessChrome/156.0.0.0' https://solflare.com/onboard
```

**Blank page in Chrome.** One Chrome run stopped on an empty first page. It didn't come back and the cause is unknown, so the test still fails if it happens. Re-run it to check.

**The API can stall.** A run during a stall fails, listing the slow URLs. That means the API was slow, not that a value was wrong. See the [bug report](docs/bugs.md).

**API rate limit.** Cloudflare answers with a 429 after too many requests. It seems tied to the IP address, so other traffic from the same connection counts too. If you see `returned 429`, wait about two minutes and run the tests again.

## Test evidence

Results on macOS, 2 and 3 Nov 2026.

- **E2E:** 9 of 9 passed across Chrome, Firefox and Firefox headless, and Chrome and Firefox headless passed again on the final code.
- **API checks broken on purpose:** 64 of 64 failed the test on the broken check.
- **Realistic API bugs injected into recorded answers:** 47 of 49 caught. The 2 misses are a wrong price on a single token, as listed under Not covered. The tool for this isn't in the repo, to keep it minimal.
- **API runs:** 8 of 8 passed with the stock market open. Back to back, 5 of 6 passed with no rate limit errors, and the 6th failed on a real stall, which is in the bug report.
- **Stalls made on demand:** a request with no answer fails at 2 minutes and names the URL. A slow answer fails the run and lists the URL, and the values still get checked.

## Differences from the assignment

- The assignment has no step for Create new wallet, but the app needs it.
- The assignment says "Main wallet". The app shows "Main Wallet".
- The test adds checks the assignment doesn't ask for, such as a page reload after saving.

## Not covered

- Password rules and other negative E2E cases, because the assignment asks for one test.
- Google sign-in, importing a wallet, and E2E on Windows or Linux.
- Whether each token's price is right. Only USDC has an outside reference, at about $1, so a wrong price on one other token gets through. In a one-off check, all 8 priced tokens were within 0.9% of CoinGecko.
- Whether the API's own auth rejects a missing token. Cloudflare answers first, so that test only proves the request is refused.
- Inputs where nothing says what's right: empty `pubkeys`, GET tokens with no `network`, `general: false`, and tokens that aren't a uuid4. All return 200 today.
- API load, the exact rate limit, and currencies other than USD and EUR.

# Solflare QA assignment

WebdriverIO E2E test and Vitest API tests for the Solflare wallet.

The E2E test creates a new wallet, turns on the 3rd and 4th wallets under Show or hide wallets, saves, and checks that the recovery phrase list holds the original wallet and those two, including after a page reload. Every step is in [docs/test-case.md](docs/test-case.md).

The API tests check that portfolio totals and net worth add up on the live API, and how it handles bad requests. The cases are in [docs/api-test-cases.md](docs/api-test-cases.md). They also run in GitHub Actions on every push to `main`.

## Requirements

Node 24.22.2, as set in `.nvmrc`. WebdriverIO 10 also lists 22.23.4+ and 26.12.1+, and the install stops with an error on anything else.

Internet access to solflare.com, wallet-api.solflare.com and the browser download sites. WebdriverIO contacts the download sites on every run, even when the browser is already downloaded, so a Firefox run fails with `Couldn't find a matching firefox browser` if archive.mozilla.org can't be reached.

## Setup

```bash
nvm install
npm ci
```

`nvm install` installs the Node version from `.nvmrc` if needed and switches to it. Without nvm, install that version any other way.

WebdriverIO downloads the browsers when it needs them, so Chrome and Firefox do not need to be installed.

## Running the tests

```bash
npm run test:e2e:chrome                   # Chrome, headed
npm run test:e2e:firefox                  # Firefox, headed
npm run test:e2e:firefox:headless         # Firefox, headless
npm run test:e2e:chrome:headless          # Chrome, headless. Currently fails, see known issues
npm run test:api                          # API tests
npm run typecheck                         # TypeScript check
npm run format                            # Format the code with Prettier
npm run format:check                      # Check the format without changing files
```

The scripts pass the browser as an argument, which also works directly:

```bash
npx wdio run wdio.conf.ts --browser=firefox
```

## Test output

| What                           | Where                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Actions and failure details    | `logs/<browser>/manage-wallets.e2e-0-0.log`, replaced on each run; failure details also print in the terminal |
| Screenshot of each failed test | `screenshots/`                                                                                                |
| API report                     | `reports/api/index.html`                                                                                      |

## Project layout

```text
pages/        page objects
tests/e2e/    the E2E test
tests/api/    API tests
utils/        API client, logger, failure screenshots and failed page details
docs/         the written test cases
```

## Decisions

- **No stored credentials.** Each run creates a new wallet with a password it generates, so there is nothing to keep in `.env` or GitHub Secrets. The password is masked when typed and never logged.
- **Page objects without Cucumber.** There is one test and no business team writing scenarios, so a Gherkin layer would add files without adding value.
- **Addresses in the final check.** Counting three rows would pass even if the wrong wallets were saved, so the test compares addresses recorded before saving.
- **Browser language is set to English.** The app follows the browser's language, and the test checks English text, so it would otherwise fail on a machine set to another language.
- **No Docker.** WebdriverIO downloads the browsers itself, so Node is the only requirement. Docker would add a second one, and Selenium lists its Chrome images as amd64 only.
- **E2E is not in GitHub Actions.** Each run loads the live site and creates a new wallet through it, and Cloudflare is known to block GitHub's IPs on other sites. This was not tested against Solflare.
- **No retries.** A retry could hide a real bug, so failures stay visible.
- **Vitest and `fetch` for the API tests.** The brief leaves the choice open. Neither needs a browser, and `fetch` is built into Node, so there is no extra client library.
- **No fixed dollar amounts.** Prices move, so expected values are calculated from the responses.
- **A $0.01 limit between separate responses.** Prices can move between calls. The worst gap in 8 samples was $0.00053, so the limit is about 20 times that. Values from one response must match to 6 decimals.
- **Net worth test makes its own GET calls.** The brief compares against "the previous requests", but it also asks for independent tests, so the test sends its own, together with the POST.
- **Any 4xx counts as a rejection.** The docs don't list error codes, so the tests don't lock in today's exact ones. They are listed under API behaviour below.

## API behaviour

Seen on the live API on 3 Nov 2026. These are observations, not documented requirements.

| Request                                 | Response                            |
| --------------------------------------- | ----------------------------------- |
| No token                                | 403, HTML page                      |
| Wrong token                             | 403, plain text `Invalid API key!`  |
| Malformed address or invalid network    | 400, JSON with `type` and `message` |
| Pubkey with no `1` prefix, or malformed | 400, JSON with `error` and `status` |
| Unsupported currency                    | 422, JSON with `error` and `status` |
| GET tokens with no `network`            | 200, same result as mainnet         |
| POST balances with empty `pubkeys`      | 200, `netWorth` of 0                |
| POST balances with a duplicate pubkey   | 200, counted once                   |

Worth raising with the API team:

- Errors come in four formats: an HTML page, plain text and two JSON styles. A client has to handle all of them.
- A missing token returns 403, where 401 is more usual.
- `netWorth` changed only every second sample, 20 seconds apart, so balances look cached for about 40 seconds. That is a guess from the pattern.

## Known issues

**Chrome headless is blocked.** solflare.com blocks Chrome's headless user agent, so `npm run test:e2e:chrome:headless` currently fails on the first screen. I kept the script so the failure stays visible, and did not disguise the browser to get past the block. The terminal shows the page's 403 status and its message, `{ "errors": ["Too many requests."] }`. You can see the difference with curl:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -A 'HeadlessChrome/156.0.0.0' https://solflare.com/onboard
```

That returned 403 on 2 Nov 2026, while the same request with a normal Chrome user agent returned 200.

**Rare blank page in Chrome.** One Chrome run out of 43 stopped on the first screen, because the app had not appeared after 10 seconds. The screenshot shows an empty dark page. It did not come back in 38 timed page loads afterwards, which took about 3.1 seconds and 3.9 seconds at most. The cause is unknown, so the test still fails when it happens. Re-run it to check.

**API rate limit.** Cloudflare answers with 429 (error 1015) after too many requests in a short time. A full run sends 26 requests. In testing, 10 runs a minute apart all passed, and so did two runs back to back, but a third within about 15 seconds failed with `returned 429`. Wait about a minute and run them again.

## Differences from the brief

- The brief has no step for Create new wallet, but the app needs it.
- The brief says "Main wallet". The app shows "Main Wallet".
- The test adds checks the brief does not ask for, such as a page reload after saving.

## Not covered

- Password rules and other negative cases, because the brief asks for one test.
- Google sign-in and importing a wallet.
- Windows and Linux. The E2E test has only been run on macOS.
- Whether API prices are correct. The tests check that totals agree with the prices the API returns, not that those prices match the market.
- API load and performance, and the exact rate limit.

# Solflare QA assignment

[![API tests](https://github.com/Bojan131/solflare-qa-assignment/actions/workflows/api-tests.yml/badge.svg)](https://github.com/Bojan131/solflare-qa-assignment/actions/workflows/api-tests.yml)

WebdriverIO E2E test and Vitest API tests for the Solflare wallet.

The E2E test creates a new wallet, turns on the 3rd and 4th wallets under Show or hide wallets, saves, and checks that the recovery phrase list holds the original wallet and those two, including after a page reload. Every step is in [docs/test-case.md](docs/test-case.md).

The API tests check that portfolio totals and net worth add up on the live API, and how it handles bad requests. The cases are in [docs/api-test-cases.md](docs/api-test-cases.md), and what they found is in [docs/api-findings.md](docs/api-findings.md). They also run in GitHub Actions on every push to `main`.

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
npm test                                  # API tests, then E2E in Firefox headless
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
| API report                     | `reports/api/index.html`, a single file that opens directly in a browser                                      |
| API report from GitHub Actions | The `api-report` artifact on each run                                                                         |

## Project layout

```text
pages/        page objects
tests/e2e/    the E2E test
tests/api/    API tests
utils/        API client, logger, failure screenshots and failed page details
docs/         the written test cases and API findings
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
- **A 0.5% limit between separate responses.** Prices can move between calls, and a percentage keeps working if the balances change. The worst gap in 8 samples was 0.011% ($0.00053), measured with the stock market closed. The network and currency tests use the same limit the other way round: values only count as different if they are further apart than prices could move. Values from one response must match to 6 decimals.
- **Net worth test makes its own GET calls.** The brief compares against "the previous requests", but it also asks for independent tests, so the test sends its own, together with the POST.
- **One test for both addresses.** The brief asks for a single test, so it loops over them. It uses soft checks, so a wrong value for one address still lets the other be checked. A failed call stops the test where it is, so the other address isn't reached in that run.
- **A list of allowed error codes.** The brief doesn't list them, so a bad token accepts 401 or 403, and bad input accepts 400 or 422, plus 404 for an address in the URL, rather than locking in today's exact code. A 429 fails these tests, because it means the rate limit answered and the check never ran.
- **Slow answers fail, and the values still get checked.** A request over 10 seconds fails its test, with the URL and the time. It's a soft check, so the value checks still run and a stall reads as "too slow", not as a wrong value. The brief sets no limit, so 10 seconds is my own bar: normal answers took under 6 seconds. A request with no answer after 2 minutes is aborted, so a run can't hang.
- **A 1 second gap between tests.** A test suite shouldn't trip the API's rate limit, so the gap spreads the requests out instead of retrying after a 429. Requests inside a test still go out together, to keep prices close in time. A run takes about 30 seconds as a result.
- **Known bugs stay in the run.** A bug the tests find is marked `it.fails`, so the run stays green while it exists and goes red once it's fixed.

## API behaviour

Seen on the live API on 3 Nov 2026. These are observations, not documented requirements.

| Request                                 | Response                                                               |
| --------------------------------------- | ---------------------------------------------------------------------- |
| No token                                | 403, Cloudflare's block page, so the API's own auth isn't what answers |
| Wrong token                             | 403, plain text `Invalid API key!`                                     |
| Malformed address or invalid network    | 400, JSON with `type` and `message`                                    |
| Pubkey with no `1` prefix, or malformed | 400, JSON with `error` and `status`, sent as `text/plain`              |
| One valid pubkey and one malformed      | 400 for the whole request, so no partial answer                        |
| Unsupported currency                    | 422, JSON with `error` and `status`, sent as `text/plain`              |
| GET tokens with no `network`            | 200, same result as mainnet                                            |
| POST balances with empty `pubkeys`      | 200, `netWorth` of 0                                                   |
| POST balances with a duplicate pubkey   | 200, counted once                                                      |
| POST balances with a `{}` body          | 400, JSON with `type` and `message`                                    |
| POST balances with malformed JSON       | 500, `HttpInternalServerError`                                         |
| A well-formed UUID that isn't version 4 | 200, both for a v1 and for all zeros                                   |

Bugs and questions for the API team are in [docs/api-findings.md](docs/api-findings.md).

## Known issues

**Chrome headless is blocked.** solflare.com blocks Chrome's headless user agent, so `npm run test:e2e:chrome:headless` currently fails on the first screen. I kept the script so the failure stays visible, and did not disguise the browser to get past the block. The terminal shows the page's 403 status and its message, `{ "errors": ["Too many requests."] }`. You can see the difference with curl:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -A 'HeadlessChrome/156.0.0.0' https://solflare.com/onboard
```

That returned 403 on 2 Nov 2026, while the same request with a normal Chrome user agent returned 200.

**Rare blank page in Chrome.** One Chrome run out of 43 stopped on the first screen, because the app had not appeared after 10 seconds. The screenshot shows an empty dark page. It did not come back in 38 timed page loads afterwards, which took about 3.1 seconds and 3.9 seconds at most. The cause is unknown, so the test still fails when it happens. Re-run it to check.

**Malformed JSON returns 500.** `POST /v2/portfolio/balances` with a body that isn't JSON answers with a 500, while `{}` gets a 400. API-12 checks for exactly that and is marked `it.fails`, so a run shows `1 expected fail`. Any other answer turns it red, including the fix, and then the marker should be removed. A request that gets no answer also counts as the expected failure, and so does a slow 500. See [F-1](docs/api-findings.md).

**API requests can stall.** On the night of 3 Nov, 6 of 46 full runs failed, none with an assertion error, and answers took up to 103 seconds. A run during a stall goes red with `answered too slowly` and the URL. That means the API was slow, not that a value was wrong, so this suite can fail for that reason alone. The cause is unknown. The evidence is in [F-2](docs/api-findings.md).

**API rate limit.** Cloudflare answers with 429 (error 1015) after too many requests in a short time. A full run sends 32 requests, one test file at a time. Before the gap between tests, two runs back to back passed and the third got `returned 429`. A run 90 seconds later was still limited, and the next one, about 45 seconds after that, passed. If you see that message, wait about two minutes and run them again.

## Test evidence

Results from 2 and 3 Nov 2026, on macOS unless noted.

| Check                                       | Result                                                                                                                                                                                                                                                           |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API tests, 30 second timeout, runs spaced   | 40 of 46 passed, no assertion errors, see known issues                                                                                                                                                                                                           |
| API tests, before the gap between tests     | 9 of 10 passed, with API-12 as the expected failure. The other was still rate limited from the back-to-back runs before it. No stall happened, slowest answer 2.5 seconds                                                                                        |
| Stall handling, with stalls made on demand  | No answer, or a body that never ends, failed at 2 minutes naming the URL. Answers over 10 seconds failed with `answered too slowly`, and a wrong value in the same answer was still reported. Two 68 second answers in one test failed as slow, not as a timeout |
| API checks broken on purpose, one at a time | 54 of 54 failed the test on the broken check, before the gap between tests and the 10 second bar                                                                                                                                                                 |
| API tests on GitHub Actions, on Linux       | [First run passed](https://github.com/Bojan131/solflare-qa-assignment/actions/runs/41564535228), on an earlier version                                                                                                                                           |
| E2E in Chrome, Firefox and Firefox headless | 9 of 9 passed, then 3 of 3 after the final clean-up                                                                                                                                                                                                              |
| E2E final address check broken on purpose   | Failed on that check                                                                                                                                                                                                                                             |

## Differences from the brief

- The brief has no step for Create new wallet, but the app needs it.
- The brief says "Main wallet". The app shows "Main Wallet".
- The test adds checks the brief does not ask for, such as a page reload after saving.

## Not covered

- Password rules and other negative cases, because the brief asks for one test.
- Google sign-in and importing a wallet.
- Windows and Linux. The E2E test has only been run on macOS.
- Whether API prices are correct. The tests check that totals agree with the prices the API returns, not that those prices match the market.
- API load and performance beyond the 10 second bar, and the exact rate limit.
- Whether the API's own auth rejects a missing token. Cloudflare answers first, so that test only proves the request is refused.
- Empty `pubkeys`, GET tokens with no `network`, and `general: false`. Each returns a usable 200, and neither the brief nor common practice says that is wrong.
- Whether a token that isn't a version 4 UUID should be refused. It's accepted today, and the brief doesn't say.
- Exchange rates, and currencies other than USD and EUR. The EUR test checks the value is consistent, not that the rate is right.

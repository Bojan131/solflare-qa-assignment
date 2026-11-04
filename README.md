# Solflare QA assignment

[![API tests](https://github.com/Bojan131/solflare-qa-assignment/actions/workflows/api-tests.yml/badge.svg)](https://github.com/Bojan131/solflare-qa-assignment/actions/workflows/api-tests.yml)

Tests for the Solflare wallet: one E2E test in WebdriverIO, and API tests in Vitest.

- [E2E test case](docs/test-case.md)
- [API test cases](docs/api-test-cases.md)
- [Bugs I found](docs/bugs.md)

## Setup

You need Node 24.22.2 and internet access. The browsers download on their own.

```bash
nvm install
npm ci
```

## Run the tests

```bash
npm test                            # API tests, then E2E in Firefox headless
npm run test:api                    # API tests
npm run test:e2e:chrome             # E2E in Chrome
npm run test:e2e:firefox            # E2E in Firefox
npm run test:e2e:firefox:headless   # E2E in Firefox, headless
npm run test:e2e:chrome:headless    # E2E in Chrome, headless (blocked, see known issues)
```

You can also pick the browser yourself: `npx wdio run wdio.conf.ts --browser=firefox`.

An API run takes about a minute and shows `1 expected fail`. That's API-13, a known bug documented in [docs/bugs.md](docs/bugs.md).

## Where the results go

- **API report:** `reports/api/index.html`, also saved on each GitHub Actions run
- **E2E logs:** `logs/`
- **Screenshots of failed tests:** `screenshots/`

## Decisions

- **No stored passwords.** Each E2E run creates a new wallet with a generated password, so there's nothing to keep secret.
- **No retries.** A retry could hide a real bug.
- **No Docker.** It would be one more thing to install. WebdriverIO already downloads the browsers, so Node is all you need.
- **E2E isn't in GitHub Actions.** UI tests on a live site can be flaky, and could turn CI red with nothing wrong. The API tests run there instead.
- **A 0.25% limit between responses.** Prices move between calls. The biggest gap I measured was 0.086%.
- **Two outside checks.** Token amounts are compared with the blockchain, and EUR with the European Central Bank rate, because the API can't confirm its own data.
- **A 2 second gap between tests.** It keeps runs under the rate limit.

## Known issues

Problems I ran into while building this, and what they mean when you run the tests.

- **Chrome headless is blocked.** solflare.com answers it with a 403, and I didn't disguise the browser to get past that. On a real project, I'd ask for an approved way through, like a secret header or an allowlisted IP address.
- **The testnet balance never appears.** It stays a grey bar. See the [bug report](docs/bugs.md).
- **The API can stall.** Requests sometimes take over a minute, and a valid request twice got a 400 lock error. A run that hits this fails. It's explained in detail in [docs/bugs.md](docs/bugs.md).
- **Malformed JSON returns a 500.** It should be a 400, because the mistake is in the request. See the [bug report](docs/bugs.md).

## What is checked and confirmed

- E2E passed in Chrome, Firefox and Firefox headless, on macOS.
- API tests pass on macOS and in GitHub Actions on Linux.
- I broke each API check on purpose, and the test failed each time.
- I added realistic bugs to recorded API answers, and the tests caught all of them.

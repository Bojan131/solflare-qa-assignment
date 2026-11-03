# API findings

What the API tests found, for the API team. Everything here was seen on production, https://wallet-api.solflare.com, on 3 Nov 2026, from one home connection on macOS, using curl and Node 24.22.2.

| ID  | Finding                                    | Type        | Severity             |
| --- | ------------------------------------------ | ----------- | -------------------- |
| F-1 | POST balances returns 500 for bad JSON     | Bug         | Low                  |
| F-2 | Requests sometimes stall for over a minute | Observation | High if users see it |
| F-3 | Any well-formed UUID works as the token    | Question    | Depends on intent    |

## F-1: POST balances returns 500 for malformed JSON

**Priority:** Medium. No data is exposed, but a client's mistake shows up as a server failure, which adds noise to error monitoring and gives the client nothing to fix.

**Steps**

```bash
curl -s -X POST https://wallet-api.solflare.com/v2/portfolio/balances \
  -H "Authorization: Bearer $(uuidgen | tr 'A-Z' 'a-z')" \
  -H 'Content-Type: application/json' \
  -d 'not json'
```

**Expected:** a 4xx, because the client sent the bad request. The same endpoint already answers `{}` with a 400 and the message `"pubkeys" is required`.

**Actual:** status 500.

```json
{
  "type": "HttpInternalServerError",
  "message": "common.error.internal_server_error",
  "code": 500,
  "data": {}
}
```

**Evidence:** happens every time, also with the body `{`. Test API-12 covers it and is marked as a known bug.

## F-2: Requests sometimes stall for over a minute

**Priority:** for the API team to set, after checking their logs for that time. It can't be reproduced on demand. If real users hit it, balances wouldn't load.

**What was running:** the API test suite, repeatedly, between about 03:50 and 05:10 UTC on 3 Nov. A run normally takes about 6 seconds.

**Expected:** there is no written target. Normal answers came back in under 6 seconds.

**Actual:** 6 of 46 runs failed, with no assertion errors. These answers are from the runs that were traced:

| Request                       | Answer                    | Time        |
| ----------------------------- | ------------------------- | ----------- |
| GET tokens                    | 200                       | 54 seconds  |
| POST balances                 | 200                       | 65 seconds  |
| GET tokens, wrong token       | 403                       | 51 seconds  |
| POST balances, wrong token    | 403                       | 68 seconds  |
| GET tokens, malformed address | 400                       | 69 seconds  |
| POST balances, bad input      | 400                       | 103 seconds |
| POST balances, bad input      | None before the run ended | 3 requests  |

**Where the delay is:** behind Cloudflare, either in the API's servers or on the way to them.

- Requests went out on healthy connections, which connected in about 20 ms.
- Even requests that only get an error back were slow.
- Cloudflare's own block page, for a request with no token, answered in about 10 ms.
- A check every 10 seconds on Cloudflare's response stayed under 60 ms, and Google's stayed normal.

**What isn't known:** the cause. This was one night from one connection, and the tests sent a few thousand requests that night, so that traffic may have contributed. Against that, none of the saved stalled runs showed a 429, and the stalls ended while the tests kept running at the same rate.

## F-3: Any well-formed UUID works as the token

**Priority:** only if this isn't intended. The brief describes a uuid4 generated for each app install, so this may be by design.

**Steps:** send GET tokens with these tokens.

| Token                                  | Answer                        |
| -------------------------------------- | ----------------------------- |
| A generated uuid4                      | 200                           |
| A generated uuid1                      | 200                           |
| `00000000-0000-0000-0000-000000000000` | 200                           |
| `not-a-real-token`                     | 403, plain `Invalid API key!` |

**Question:** is the token meant to identify or limit anyone? Today it looks like a format check, so a client can make up a new one at any time, or everyone can share all zeros.

## Smaller observations

- Errors come in three formats: plain text and two JSON styles, and one of those JSON styles is sent as `text/plain`. A client has to handle all of them.
- A wrong token returns 403, where 401 is more usual.
- `netWorth` changed only every second sample, 20 seconds apart, so balances look cached for about 40 seconds. That is a guess from the pattern.
- The rate limit isn't a bug, but it isn't documented either. Cloudflare answers 429 (error 1015) after a burst of requests, and it took up to about two minutes to clear.

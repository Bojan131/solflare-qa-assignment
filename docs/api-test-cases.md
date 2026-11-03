# API test cases

| Field         | Value                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| Module        | Portfolio API                                                          |
| Requirement   | Technical assignment, task 2                                           |
| Test type     | Functional, API                                                        |
| Automation    | Automated in `tests/api/`                                              |
| Environment   | Production, https://wallet-api.solflare.com                            |
| Preconditions | Both wallets from the brief hold funds on mainnet                      |
| Test data     | The two addresses from the brief, and a generated uuid4 as Bearer auth |

In every case, each request must also answer within 10 seconds, or the test fails. The brief sets no limit, so this is our own bar: normal answers took under 6 seconds.

## API-01: Total portfolio value is correct for both addresses

- **Priority:** High
- **Brief:** Scenario 1

### Test steps

1. Send `GET /v3/portfolio/tokens/{address}?network=mainnet` for the first address
2. Repeat for the second address, in the same test

### Expected result

For each address:

- Status is 200 and `errors` is empty
- `value.total` is above 0
- `value.total` equals the sum of `price.price * totalUiAmount`, with tokens that have no price counted as 0
- `value.total` equals `tokensValue.total + stocksValue.total`
- `tokensValue.total` equals that sum for rows with `isStock: false`, and `stocksValue.total` for rows with `isStock: true`

## API-02: Net worth equals the sum of the portfolio totals

- **Priority:** High
- **Brief:** Scenario 2, first expected result

### Test steps

1. Send `POST /v2/portfolio/balances` for both addresses on mainnet
2. At the same time, send the GET request from API-01 for both addresses

### Expected result

- `netWorth` is above 0 and within 0.5% of the two `value.total` values added together
- Each address's wallet in `data` is within 0.5% of its own `value.total`

## API-03: Net worth equals the sum of the wallet values

- **Priority:** High
- **Brief:** Scenario 2, second expected result

### Test steps

1. Send `POST /v2/portfolio/balances` for both addresses on mainnet

### Expected result

`data` holds exactly the two addresses, and `netWorth` is above 0 and equals the sum of their `value` fields.

## Other cases

These go beyond the brief's two scenarios. The brief lists no error codes or edge cases, so their expected results come from common API practice and what the API does today.

| ID     | Test           | Request                                                                                                                            | Expected result                                                                                  | Priority |
| ------ | -------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------- |
| API-04 | Token rows     | GET tokens for both addresses                                                                                                      | Totals, `errors` and every token row have the expected types                                     | Medium   |
| API-05 | Wallet rows    | POST balances                                                                                                                      | `netWorth` and every wallet row have the expected types                                          | Medium   |
| API-06 | No token       | GET tokens and POST balances with no `Authorization` header                                                                        | 401 or 403, no wallet data                                                                       | High     |
| API-07 | Wrong token    | GET tokens and POST balances with an invalid token                                                                                 | 401 or 403 from the API, not Cloudflare's page, no wallet data                                   | High     |
| API-08 | Bad input      | Malformed address, invalid network, no `1` prefix, malformed pubkey, no pubkeys field, one bad pubkey of two, unsupported currency | 400 or 422 (404 also allowed for the address), no wallet data                                    | High     |
| API-09 | Other networks | POST balances for both addresses and GET tokens for the first, on devnet and testnet, compared with mainnet                        | 200, with values further from mainnet than the 0.5% limit                                        | Low      |
| API-10 | Duplicate      | POST balances with the same pubkey twice, and once                                                                                 | Net worth is not doubled                                                                         | Medium   |
| API-11 | Other currency | POST balances in EUR and in USD                                                                                                    | EUR is above 0, differs from USD by more than 0.5%, and matches its wallet values                | Low      |
| API-12 | Malformed JSON | POST balances with a body that isn't JSON                                                                                          | A 4xx. Known bug: returns 500, so the test is marked `it.fails` and goes red on any other answer | Medium   |

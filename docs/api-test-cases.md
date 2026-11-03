# API test cases

| Field         | Value                                                                              |
| ------------- | ---------------------------------------------------------------------------------- |
| Module        | Portfolio API                                                                      |
| Requirement   | Technical assignment, task 2                                                       |
| Test type     | Functional, API                                                                    |
| Automation    | Automated in `tests/api/`                                                          |
| Environment   | Production, https://wallet-api.solflare.com                                        |
| Preconditions | Both wallets from the brief hold funds on mainnet                                  |
| Test data     | The two addresses from the brief, and one uuid4 per run as `Authorization: Bearer` |

## API-01: Total portfolio value is correct for both addresses

**Priority:** High

### Test steps

1. Send `GET /v3/portfolio/tokens/{address}?network=mainnet` for the first address
2. Repeat for the second address, in the same test

### Expected result

For each address:

- Status is 200 and `errors` is empty
- `value.total` is above 0
- `value.total` equals the sum of `price.price * totalUiAmount`, with tokens that have no price counted as 0
- `value.total` equals `tokensValue.total + stocksValue.total`

## API-02: Net worth equals the sum of the portfolio totals

**Priority:** High

### Test steps

1. Send `POST /v2/portfolio/balances` for both addresses on mainnet
2. At the same time, send the GET request from API-01 for both addresses

### Expected result

`netWorth` is above 0 and within $0.01 of the two `value.total` values added together.

## API-03: Net worth equals the sum of the wallet values

**Priority:** High

### Test steps

1. Send `POST /v2/portfolio/balances` for both addresses on mainnet

### Expected result

`data` holds exactly the two addresses, and `netWorth` is above 0 and equals the sum of their `value` fields.

## Other cases

| ID     | Test                    | Request                                                                                               | Expected result                                        | Priority |
| ------ | ----------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------- |
| API-04 | Tokens response shape   | GET tokens                                                                                            | Totals, `errors` and token fields have the right types | Medium   |
| API-05 | Balances response shape | POST balances                                                                                         | `netWorth` and wallet fields have the right types      | Medium   |
| API-06 | No token                | GET tokens and POST balances with no `Authorization` header                                           | 4xx, no wallet data                                    | High     |
| API-07 | Wrong token             | GET tokens and POST balances with an invalid token                                                    | 4xx, no wallet data                                    | High     |
| API-08 | Bad input               | Malformed address, invalid network, pubkey with no `1` prefix, malformed pubkey, unsupported currency | 4xx, no wallet data                                    | Medium   |
| API-09 | Other networks          | GET tokens and POST balances on devnet and testnet                                                    | 200 with numeric values                                | Low      |
| API-10 | Duplicate address       | POST balances with the same pubkey twice, and once                                                    | One wallet returned, net worth not doubled             | Medium   |
| API-11 | Other currency          | POST balances in EUR and in USD                                                                       | EUR is above 0 and differs from USD                    | Low      |

# API test cases

All tests run on production, https://wallet-api.solflare.com, with the two addresses from the assignment and a generated uuid4 as the token.

Every request must also answer within 10 seconds, or the run fails. The assignment sets no limit, so that one is our own.

## From the assignment

### API-01: Total portfolio value (High)

Send GET tokens on mainnet for both addresses. For each one:

- The total equals price x amount added up for all tokens. A token with no price counts as 0.
- The total equals tokens value + stocks value.
- Tokens value and stocks value each match their own rows.
- The total is above 0 and `errors` is empty.

### API-02: Net worth against the portfolio totals (High)

Send POST balances and GET tokens for both addresses at the same time.

- Net worth is within 0.25% of the two totals added together.
- Each wallet is within 0.25% of its own total.

### API-03: Net worth against the wallets (High)

Send POST balances for both addresses.

- Both addresses are there, and nothing else.
- Net worth is above 0 and equals the wallet values added together.

## Beyond the assignment

| ID     | What it checks                                                                                                                  | Expected                                                                                                 | Priority |
| ------ | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------- |
| API-04 | Token rows on both wallets                                                                                                      | No negative amounts, verified tokens have a price, stablecoins are about $1, stocks are marked as stocks | Medium   |
| API-05 | Token amounts on both wallets                                                                                                   | Match the blockchain exactly                                                                             | High     |
| API-06 | 24h change and SOL value                                                                                                        | Add up from the rows and totals                                                                          | Medium   |
| API-07 | Net worth in EUR                                                                                                                | Equals its wallets and is within 3% of the European Central Bank rate                                    | Medium   |
| API-08 | No token                                                                                                                        | Rejected with 401 or 403                                                                                 | High     |
| API-09 | Wrong token                                                                                                                     | Rejected by the API with 401 or 403                                                                      | High     |
| API-10 | Bad input: malformed address or pubkey, invalid network, no `1` prefix, no pubkeys, one bad pubkey of two, unsupported currency | Rejected with 400 or 422, or 404 for the address                                                         | High     |
| API-11 | Devnet and testnet                                                                                                              | Values differ from mainnet                                                                               | Low      |
| API-12 | The same address sent twice                                                                                                     | Net worth isn't doubled and still equals its rows                                                        | Medium   |
| API-13 | Malformed JSON                                                                                                                  | Not a 500. Known bug                                                                                     | Medium   |

A rejected request must not return any wallet data.

API-13 is marked as an expected failure, so it turns red once the bug is fixed. It's in [bugs.md](bugs.md).

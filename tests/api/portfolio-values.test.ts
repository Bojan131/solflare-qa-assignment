import { describe, expect, it } from 'vitest';
import {
  ADDRESSES,
  expectWithinPriceDrift,
  getBalances,
  getTokens,
  PUBKEYS,
  SAME_RESPONSE_DECIMALS,
  sumOfWallets,
  tokenValue,
  type Token,
} from '../../utils/api-client';

// Adds up what each token is worth, from its price and amount
function calculateTotal(tokens: Token[]) {
  return tokens.reduce((total, token) => total + tokenValue(token), 0);
}

// Scenarios 1 and 2 from the assignment
describe('Assignment scenarios', () => {
  // Soft checks, so a wrong value for one address does not hide a problem with the other
  it('API-01: total value matches the tokens and stocks for both addresses', async () => {
    for (const address of ADDRESSES) {
      const { tokens, value, tokensValue, stocksValue, errors } = await getTokens(address);
      const stocks = tokens.filter((token) => token.isStock);
      const otherTokens = tokens.filter((token) => !token.isStock);

      expect.soft(errors, `${address} errors`).toEqual([]);
      // A total above zero stops an emptied wallet from passing by accident
      expect.soft(value.total, `${address} total`).toBeGreaterThan(0);
      expect
        .soft(value.total, `${address} total vs price x amount`)
        .toBeCloseTo(calculateTotal(tokens), SAME_RESPONSE_DECIMALS);
      expect
        .soft(value.total, `${address} total vs tokens + stocks`)
        .toBeCloseTo(tokensValue.total + stocksValue.total, SAME_RESPONSE_DECIMALS);
      // One wallet's value is all tokens and the other's all stocks, so the sum above never adds
      // two real numbers. These catch a token counted on the wrong side.
      expect
        .soft(tokensValue.total, `${address} tokens value`)
        .toBeCloseTo(calculateTotal(otherTokens), SAME_RESPONSE_DECIMALS);
      expect
        .soft(stocksValue.total, `${address} stocks value`)
        .toBeCloseTo(calculateTotal(stocks), SAME_RESPONSE_DECIMALS);
    }
  });

  // Makes its own GET calls instead of reusing the first test's, so tests stay independent.
  // They go out together with the POST to keep the prices as close in time as possible.
  it('API-02: net worth equals the sum of the portfolio totals', async () => {
    const [balances, first, second] = await Promise.all([
      getBalances(PUBKEYS),
      getTokens(ADDRESSES[0]),
      getTokens(ADDRESSES[1]),
    ]);
    const totals = [first.value.total, second.value.total];

    expect(balances.netWorth).toBeGreaterThan(0);
    expectWithinPriceDrift(balances.netWorth, totals[0] + totals[1], 'net worth vs GET totals');
    // A correct sum could still hide values attached to the wrong wallets
    ADDRESSES.forEach((address, index) => {
      const wallet = balances.data.find((item) => item.publicKey === address);
      expect(wallet, `${address} is missing from balances`).toBeDefined();
      expectWithinPriceDrift(wallet!.value, totals[index], `${address} wallet vs GET total`);
    });
  });

  // Uses only the balances endpoint, as the assignment asks
  it('API-03: net worth equals the sum of the wallet values', async () => {
    const balances = await getBalances(PUBKEYS);
    const walletAddresses = balances.data.map((wallet) => wallet.publicKey);

    expect(walletAddresses).toHaveLength(2);
    expect(walletAddresses).toEqual(expect.arrayContaining(ADDRESSES));
    expect(balances.netWorth).toBeGreaterThan(0);
    expect(balances.netWorth).toBeCloseTo(sumOfWallets(balances), SAME_RESPONSE_DECIMALS);
  });
});

import { describe, expect, it } from 'vitest';
import {
  ADDRESSES,
  getBalances,
  getTokens,
  PRICE_DRIFT_LIMIT,
  PUBKEYS,
  type Token,
} from '../../utils/api-client';

// Values from one response can only differ by float rounding, so they compare to 6 decimals
const SAME_RESPONSE_DECIMALS = 6;

function calculateTotal(tokens: Token[]) {
  return tokens.reduce(
    (total, token) => total + (token.price?.price ?? 0) * token.totalUiAmount,
    0,
  );
}

// Scenarios 1 and 2 from the brief, API-01 to API-03 in docs/api-test-cases.md
describe('Portfolio values', () => {
  // Soft checks, so a problem with one address does not hide the other
  it('total value matches the tokens and stocks for both addresses', async () => {
    for (const address of ADDRESSES) {
      const portfolio = await getTokens(address);
      const total = portfolio.value.total;

      expect.soft(portfolio.errors, `${address} errors`).toEqual([]);
      // A total above zero stops an emptied wallet from passing by accident
      expect.soft(total, `${address} total`).toBeGreaterThan(0);
      expect
        .soft(total, `${address} total vs price x amount`)
        .toBeCloseTo(calculateTotal(portfolio.tokens), SAME_RESPONSE_DECIMALS);
      expect
        .soft(total, `${address} total vs tokens + stocks`)
        .toBeCloseTo(
          portfolio.tokensValue.total + portfolio.stocksValue.total,
          SAME_RESPONSE_DECIMALS,
        );
    }
  });

  // Makes its own GET calls instead of reusing the first test's, so tests stay independent.
  // They go out together with the POST to keep the prices as close in time as possible.
  it('net worth equals the sum of the portfolio totals', async () => {
    const [balances, first, second] = await Promise.all([
      getBalances(PUBKEYS),
      getTokens(ADDRESSES[0]),
      getTokens(ADDRESSES[1]),
    ]);
    const sumOfTotals = first.value.total + second.value.total;

    expect(balances.netWorth).toBeGreaterThan(0);
    expect(Math.abs(balances.netWorth - sumOfTotals)).toBeLessThanOrEqual(PRICE_DRIFT_LIMIT);
  });

  it('net worth equals the sum of the wallet values', async () => {
    const balances = await getBalances(PUBKEYS);
    const walletAddresses = balances.data.map((wallet) => wallet.publicKey);
    const sumOfWallets = balances.data.reduce((total, wallet) => total + wallet.value, 0);

    expect(walletAddresses).toHaveLength(2);
    expect(walletAddresses).toEqual(expect.arrayContaining(ADDRESSES));
    expect(balances.netWorth).toBeGreaterThan(0);
    expect(balances.netWorth).toBeCloseTo(sumOfWallets, SAME_RESPONSE_DECIMALS);
  });
});

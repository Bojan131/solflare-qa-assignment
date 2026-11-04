import { describe, expect, it } from 'vitest';
import {
  ADDRESSES,
  getBalances,
  getTokens,
  PUBKEYS,
  SAME_RESPONSE_DECIMALS,
  sumOfWallets,
  tokenValue,
  type Token,
} from '../../utils/api-client';
import { getChainHoldings, getEurPerUsd } from '../../utils/outside-sources';

// A stablecoin that drifts further than this from $1 means its price, or the price feed, is wrong
const STABLECOIN_LIMIT = 0.05;
// The bank publishes one rate a working day, while the API's moves all the time
const EUR_RATE_LIMIT = 0.03;
// This compares separate responses, so it leaves room for the share to move slightly between them
const NET_WORTH_CHANGE_DECIMALS = 3;

// What a token's value changed by over 24 hours, from its value now and its percentage change
function changeOf(token: Token) {
  const value = tokenValue(token);
  return value - value / (1 + (token.price?.change ?? 0) / 100);
}

// Beyond the assignment. The other tests would pass if the API were wrong the same way everywhere.
describe('Extra: portfolio accuracy', () => {
  // Both wallets, because only one of them holds stocks and their rows have extra fields
  it('API-04: every token row has valid fields and prices on both wallets', async () => {
    for (const address of ADDRESSES) {
      const portfolio = await getTokens(address);

      expect(portfolio).toMatchObject({
        value: { total: expect.any(Number) },
        tokensValue: { total: expect.any(Number) },
        stocksValue: { total: expect.any(Number) },
        errors: expect.any(Array),
      });
      expect(portfolio.tokens.length).toBeGreaterThan(0);
      for (const token of portfolio.tokens) {
        expect(token, token.symbol).toMatchObject({
          symbol: expect.any(String),
          totalUiAmount: expect.any(Number),
          isStock: expect.any(Boolean),
          isStablecoin: expect.any(Boolean),
          verified: expect.any(Boolean),
        });
        // The checks below depend on these fields, so losing one must not switch them off
        expect(token, token.symbol).toHaveProperty('category');
        expect(token.totalUiAmount, token.symbol).toBeGreaterThanOrEqual(0);
        // Unverified tokens can have no price, but a verified one would drop out of every total
        if (token.verified) expect(token.price?.price, `${token.symbol} price`).toBeGreaterThan(0);
        if (token.price) expect(token.price.price, token.symbol).toBeGreaterThan(0);
        // The one price with a known answer, so this catches prices that are wrong across the board
        if (token.isStablecoin) {
          const gap = Math.abs((token.price?.price ?? 0) - 1);
          expect(gap, `${token.symbol} price vs $1`).toBeLessThan(STABLECOIN_LIMIT);
        }
        // A stock counted as a token would land on the wrong side of the two subtotals
        if (token.category === 'stock' || token.category === 'etf') {
          expect(token.isStock, token.symbol).toBe(true);
        }
      }
    }
  });

  // The blockchain is the real answer for what a wallet holds, so this catches a wrong amount or a
  // missing token even when every endpoint agrees on it. An outage there says nothing about Solflare,
  // so it skips the test.
  it('API-05: holdings match the blockchain for both addresses', async ({ skip }) => {
    for (const address of ADDRESSES) {
      const [{ tokens }, chainHoldings] = await Promise.all([
        getTokens(address),
        getChainHoldings(address).catch((error: Error) => skip(error.message)),
      ]);
      const apiHoldings: Record<string, number> = {};
      // Adds up instead of overwriting, so a token listed twice can't pass as one correct row
      for (const { mint, totalUiAmount } of tokens) {
        if (totalUiAmount > 0) apiHoldings[mint] = (apiHoldings[mint] ?? 0) + totalUiAmount;
      }

      expect.soft(apiHoldings, address).toEqual(chainHoldings);
    }
  });

  // The app shows these next to the totals, and no other test reads them
  it('API-06: 24h change and SOL value add up for both addresses', async () => {
    const [balances, first, second] = await Promise.all([
      getBalances(PUBKEYS),
      getTokens(ADDRESSES[0]),
      getTokens(ADDRESSES[1]),
    ]);

    [first, second].forEach(({ tokens, value, solValue }, index) => {
      const address = ADDRESSES[index];
      const changeFromRows = tokens.reduce((total, token) => total + changeOf(token), 0);
      const solPrice = tokens.find((token) => token.symbol === 'SOL')?.price?.price;

      expect(solPrice, `${address} SOL price`).toEqual(expect.any(Number));
      expect
        .soft(value.change, `${address} change vs rows`)
        .toBeCloseTo(changeFromRows, SAME_RESPONSE_DECIMALS);
      expect
        .soft(value.percentage, `${address} percentage vs change`)
        .toBeCloseTo((value.change / (value.total - value.change)) * 100, SAME_RESPONSE_DECIMALS);
      expect
        .soft(solValue.total, `${address} SOL value vs total`)
        .toBeCloseTo(value.total / solPrice!, SAME_RESPONSE_DECIMALS);
    });

    const change = first.value.change + second.value.change;
    const total = first.value.total + second.value.total;
    // Unlike value.change, this one is a share of the earlier net worth and not an amount
    expect(balances.netWorthChange, 'net worth change vs portfolios').toBeCloseTo(
      change / (total - change),
      NET_WORTH_CHANGE_DECIMALS,
    );
  });

  // The bank's rate is an outside check, because the API can't confirm its own rate. An outage there
  // says nothing about Solflare, so it skips the rate check.
  it('API-07: converts net worth to EUR at about the real rate', async ({ skip }) => {
    const [usd, eur] = await Promise.all([
      getBalances(PUBKEYS),
      getBalances(PUBKEYS, { currency: 'eur' }),
    ]);

    expect(eur.netWorth).toBeCloseTo(sumOfWallets(eur), SAME_RESPONSE_DECIMALS);

    const eurPerUsd = await getEurPerUsd().catch((error: Error) => skip(error.message));
    const gap = Math.abs(eur.netWorth / usd.netWorth - eurPerUsd) / eurPerUsd;
    expect(gap, `EUR ${eur.netWorth} vs USD ${usd.netWorth} at ${eurPerUsd}`).toBeLessThan(
      EUR_RATE_LIMIT,
    );
  });
});

import { describe, expect, it } from 'vitest';
import {
  ADDRESSES,
  getBalances,
  getTokens,
  PRICE_DRIFT_LIMIT,
  PUBKEYS,
  requestBalances,
  requestTokens,
} from '../../utils/api-client';

type RejectedRequest = [string, () => Promise<Response>];

const WRONG_TOKEN = 'Bearer not-a-real-token';

// The docs don't list error codes, so any 4xx counts. The exact responses are in the README.
async function expectRejected(response: Response) {
  expect(response.status).toBeGreaterThanOrEqual(400);
  expect(response.status).toBeLessThan(500);
  const body = await response.text();
  expect(body).not.toContain('netWorth');
  expect(body).not.toContain('totalUiAmount');
}

const badAuthRequests: RejectedRequest[] = [
  ['tokens with no token', () => requestTokens(ADDRESSES[0], { auth: null })],
  ['tokens with a wrong token', () => requestTokens(ADDRESSES[0], { auth: WRONG_TOKEN })],
  ['balances with no token', () => requestBalances(PUBKEYS, { auth: null })],
  ['balances with a wrong token', () => requestBalances(PUBKEYS, { auth: WRONG_TOKEN })],
];

const badInputRequests: RejectedRequest[] = [
  ['tokens with a malformed address', () => requestTokens('not-an-address')],
  ['tokens with an invalid network', () => requestTokens(ADDRESSES[0], { network: 'moonnet' })],
  ['balances with no 1 prefix', () => requestBalances(ADDRESSES)],
  ['balances with a malformed pubkey', () => requestBalances(['1not-an-address'])],
  ['balances with an invalid network', () => requestBalances(PUBKEYS, { network: 'moonnet' })],
  ['balances with an unsupported currency', () => requestBalances(PUBKEYS, { currency: 'xxx' })],
];

// API-04 to API-11 in docs/api-test-cases.md
describe('Request handling', () => {
  it('tokens response has the fields the app relies on', async () => {
    const portfolio = await getTokens(ADDRESSES[0]);

    expect(portfolio).toMatchObject({
      value: { total: expect.any(Number) },
      tokensValue: { total: expect.any(Number) },
      stocksValue: { total: expect.any(Number) },
      errors: expect.any(Array),
    });
    expect(portfolio.tokens[0]).toMatchObject({
      symbol: expect.any(String),
      totalUiAmount: expect.any(Number),
      isStock: expect.any(Boolean),
    });
  });

  it('balances response has the fields the app relies on', async () => {
    const balances = await getBalances(PUBKEYS);

    expect(balances.netWorth).toEqual(expect.any(Number));
    expect(balances.data[0]).toMatchObject({
      publicKey: expect.any(String),
      value: expect.any(Number),
    });
  });

  it.each(badAuthRequests)('rejects %s', async (_name, send) => {
    await expectRejected(await send());
  });

  it.each(badInputRequests)('rejects %s', async (_name, send) => {
    await expectRejected(await send());
  });

  it.each(['devnet', 'testnet'])('answers normally on %s', async (network) => {
    const portfolio = await getTokens(ADDRESSES[0], { network });
    const balances = await getBalances(PUBKEYS, { network });

    expect(portfolio.value.total).toEqual(expect.any(Number));
    expect(balances.netWorth).toEqual(expect.any(Number));
  });

  it('does not count a duplicate address twice', async () => {
    const [once, twice] = await Promise.all([
      getBalances([PUBKEYS[0]]),
      getBalances([PUBKEYS[0], PUBKEYS[0]]),
    ]);

    expect(twice.data).toHaveLength(1);
    expect(Math.abs(twice.netWorth - once.netWorth)).toBeLessThanOrEqual(PRICE_DRIFT_LIMIT);
  });

  it('returns a different value in another currency', async () => {
    const [usd, eur] = await Promise.all([
      getBalances(PUBKEYS),
      getBalances(PUBKEYS, { currency: 'eur' }),
    ]);

    expect(eur.netWorth).toBeGreaterThan(0);
    expect(Math.abs(eur.netWorth - usd.netWorth)).toBeGreaterThan(PRICE_DRIFT_LIMIT);
  });
});

import { describe, expect, it } from 'vitest';
import {
  ADDRESSES,
  expectBeyondPriceDrift,
  expectWithinPriceDrift,
  getBalances,
  getTokens,
  PUBKEYS,
  requestBalances,
  requestBalancesWithBody,
  requestTokens,
  SAME_RESPONSE_DECIMALS,
  sumOfWallets,
} from '../../utils/api-client';

type RejectedRequest = [string, () => Promise<Response>];

const WRONG_TOKEN = 'Bearer not-a-real-token';
// The assignment doesn't list error codes, so these allow the sensible ones instead of locking in
// today's exact code. 429 is left out on purpose: it means the rate limit answered, not the check.
const AUTH_STATUSES = [401, 403];
const BAD_INPUT_STATUSES = [400, 422];

// Checks for an expected error status and no wallet data, and returns the body for further checks
async function expectRejected(response: Response, allowedStatuses: number[]) {
  expect(allowedStatuses, `${response.url} returned ${response.status}`).toContain(response.status);
  const body = await response.text();
  expect(body).not.toContain('netWorth');
  expect(body).not.toContain('totalUiAmount');
  return body;
}

// Cloudflare answers these with its own block page before the API sees the request
const noTokenRequests: RejectedRequest[] = [
  ['API-08: rejects tokens with no token', () => requestTokens(ADDRESSES[0], { auth: null })],
  ['API-08: rejects balances with no token', () => requestBalances(PUBKEYS, { auth: null })],
];

const wrongTokenRequests: RejectedRequest[] = [
  [
    'API-09: rejects tokens with a wrong token',
    () => requestTokens(ADDRESSES[0], { auth: WRONG_TOKEN }),
  ],
  [
    'API-09: rejects balances with a wrong token',
    () => requestBalances(PUBKEYS, { auth: WRONG_TOKEN }),
  ],
];

const badInputRequests: RejectedRequest[] = [
  [
    'API-10: rejects tokens with an invalid network',
    () => requestTokens(ADDRESSES[0], { network: 'moonnet' }),
  ],
  ['API-10: rejects balances with no 1 prefix', () => requestBalances(ADDRESSES)],
  ['API-10: rejects balances with a malformed pubkey', () => requestBalances(['1not-an-address'])],
  ['API-10: rejects balances with no pubkeys field', () => requestBalancesWithBody('{}')],
  // A partial answer here would quietly understate someone's net worth
  [
    'API-10: rejects balances when one pubkey of two is malformed',
    () => requestBalances([PUBKEYS[0], '1not-an-address']),
  ],
  [
    'API-10: rejects balances with an invalid network',
    () => requestBalances(PUBKEYS, { network: 'moonnet' }),
  ],
  [
    'API-10: rejects balances with an unsupported currency',
    () => requestBalances(PUBKEYS, { currency: 'xxx' }),
  ],
];

// How the API handles bad and unusual requests
describe('Extra: request handling', () => {
  it.each(noTokenRequests)('%s', async (_name, send) => {
    await expectRejected(await send(), AUTH_STATUSES);
  });

  it.each(wrongTokenRequests)('%s', async (_name, send) => {
    const body = await expectRejected(await send(), AUTH_STATUSES);
    // Cloudflare's page here would mean the API never checked the token
    expect(body).not.toContain('Cloudflare');
  });

  // The address is part of the URL, so a 404 is a sensible answer here and not for the others
  it('API-10: rejects tokens with a malformed address', async () => {
    await expectRejected(await requestTokens('not-an-address'), [...BAD_INPUT_STATUSES, 404]);
  });

  // Bad input should be refused, not answered with a guess at what was meant
  it.each(badInputRequests)('%s', async (_name, send) => {
    await expectRejected(await send(), BAD_INPUT_STATUSES);
  });

  // Compares with mainnet, because a bare status check would still pass if network were ignored.
  // It doesn't expect zero, because anyone can send test funds to a public address.
  it.each(['devnet', 'testnet'])('API-11: returns different values on %s', async (network) => {
    const [mainnet, other] = await Promise.all([
      getBalances(PUBKEYS),
      getBalances(PUBKEYS, { network }),
    ]);
    const portfolio = await getTokens(ADDRESSES[0], { network });
    const mainnetWallet = mainnet.data.find((wallet) => wallet.publicKey === ADDRESSES[0]);

    expect(mainnetWallet).toBeDefined();
    expectBeyondPriceDrift(other.netWorth, mainnet.netWorth, 'net worth vs mainnet');
    expectBeyondPriceDrift(portfolio.value.total, mainnetWallet!.value, 'total vs mainnet');
  });

  // A wallet listed twice would otherwise show double its real value
  it('API-12: does not count a duplicate address twice', async () => {
    const [once, twice] = await Promise.all([
      getBalances([PUBKEYS[0]]),
      getBalances([PUBKEYS[0], PUBKEYS[0]]),
    ]);

    expectWithinPriceDrift(twice.netWorth, once.netWorth, 'duplicate vs single');
    expect(twice.netWorth).toBeCloseTo(sumOfWallets(twice), SAME_RESPONSE_DECIMALS);
  });

  // Known bug: the API answers with a 500. it.fails counts any error as the expected one, so only
  // the 500 itself may fail here. The fix, a 429 or no answer at all turns the test red.
  it.fails('API-13: does not answer malformed JSON with a 500', async () => {
    const status = await requestBalancesWithBody('not json').then(
      (response) => response.status,
      () => 'no answer',
    );
    expect(status).not.toBe(500);
  });
});

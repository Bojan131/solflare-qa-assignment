import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';

const BASE_URL = 'https://wallet-api.solflare.com';
// The app sends a uuid4 generated at install, so the tests generate their own in the same way
const AUTH_HEADER = `Bearer ${randomUUID()}`;
// Separate responses can differ because prices move. The worst gap measured was 0.086%, on one wallet
// with the stock market open, so this allows about three times that.
const PRICE_DRIFT_SHARE = 0.0025;
// The API sometimes stalls, and the slowest answer measured took 103 seconds
const REQUEST_TIMEOUT_MS = 120000;
// The assignment sets no limit, so this is our own bar. Normal answers took under 6 seconds.
const SLOW_REQUEST_MS = 10000;

export const ADDRESSES = [
  '96Y3j66AX16noUAAVriW8bmwTGzV1PVqBKCEArPd5fuU',
  '7eXxD3vQww9cgBgD3gb7iqTriAzAmCBXFBMpdDi71P3i',
];
// The balances endpoint expects each address with a 1 in front of it
export const PUBKEYS = ADDRESSES.map((address) => `1${address}`);
// Values from one response can only differ by float rounding
export const SAME_RESPONSE_DECIMALS = 6;

export interface Token {
  symbol: string;
  mint: string;
  totalUiAmount: number;
  isStock: boolean;
  isStablecoin: boolean;
  verified: boolean;
  category: string | null;
  // Missing on tokens with no price, and the API leaves those out of the total
  price?: { price: number; change: number };
}

export interface TokensResponse {
  tokens: Token[];
  value: { total: number; change: number; percentage: number };
  solValue: { total: number };
  tokensValue: { total: number };
  stocksValue: { total: number };
  errors: unknown[];
}

export interface BalancesResponse {
  netWorth: number;
  netWorthChange: number;
  data: { publicKey: string; value: number }[];
}

interface RequestOptions {
  network?: string;
  currency?: string;
  // Null sends no header, so tests can check that auth is required
  auth?: string | null;
}

// Answers over the limit, which tests/api/setup.ts turns into a failure of their own
export const slowAnswers: string[] = [];

// Sends every request, so a stall fails with its URL and a slow answer gets recorded
async function send(url: string, init: RequestInit) {
  const started = Date.now();
  try {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    // Waits for the whole body, because the answer can also stall after its headers arrive
    await response.clone().text();
    const elapsed = Date.now() - started;
    if (elapsed > SLOW_REQUEST_MS) slowAnswers.push(`${url} took ${elapsed} ms`);
    return response;
  } catch (error) {
    throw new Error(`${url} failed after ${Date.now() - started} ms`, { cause: error });
  }
}

// Sends the tokens request and returns the raw response, for tests that expect a rejection
export function requestTokens(address: string, options: RequestOptions = {}) {
  const { network = 'mainnet', auth = AUTH_HEADER } = options;
  return send(`${BASE_URL}/v3/portfolio/tokens/${address}?network=${network}`, {
    headers: auth ? { Authorization: auth } : {},
  });
}

// Posts any body to the balances endpoint, including one that isn't valid JSON
export function requestBalancesWithBody(body: string, auth: string | null = AUTH_HEADER) {
  return send(`${BASE_URL}/v2/portfolio/balances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) },
    body,
  });
}

// Sends the balances request and returns the raw response, for tests that expect a rejection
export function requestBalances(pubkeys: string[], options: RequestOptions = {}) {
  const { network = 'mainnet', currency = 'usd', auth = AUTH_HEADER } = options;
  const body = JSON.stringify({ pubkeys, currency, general: true, network });
  return requestBalancesWithBody(body, auth);
}

// Reads a successful response. The message shows the URL and the reply, so a failed call explains
// itself, and a 429 shows the rate limit answered rather than the API.
async function readJson<T>(response: Response): Promise<T> {
  const body = await response.text();
  const message = `${response.url} returned ${response.status}: ${body.slice(0, 120)}`;
  expect(response.status, message).toBe(200);
  return JSON.parse(body) as T;
}

// Fetches a wallet's portfolio and checks the call succeeded
export async function getTokens(address: string, options: RequestOptions = {}) {
  return readJson<TokensResponse>(await requestTokens(address, options));
}

// Fetches wallet balances and checks the call succeeded
export async function getBalances(pubkeys: string[], options: RequestOptions = {}) {
  return readJson<BalancesResponse>(await requestBalances(pubkeys, options));
}

// What a token is worth. A token with no price counts as 0, as it does in the API's own total.
export function tokenValue(token: Token) {
  return (token.price?.price ?? 0) * token.totalUiAmount;
}

// Adds up the wallet values in one balances response
export function sumOfWallets(balances: BalancesResponse) {
  return balances.data.reduce((total, wallet) => total + wallet.value, 0);
}

// Compares values from separate responses. The message shows both, to help work out a failure.
export function expectWithinPriceDrift(actual: number, expected: number, label: string) {
  const gap = Math.abs(actual - expected);
  expect(gap, `${label}: ${actual} vs ${expected}`).toBeLessThanOrEqual(
    expected * PRICE_DRIFT_SHARE,
  );
}

// Checks two values differ by more than prices could move. Checks the types first, because a null
// or missing value could otherwise count as far away from the other one.
export function expectBeyondPriceDrift(actual: number, expected: number, label: string) {
  expect([actual, expected], label).toEqual([expect.any(Number), expect.any(Number)]);
  const gap = Math.abs(actual - expected);
  expect(gap, `${label}: ${actual} vs ${expected}`).toBeGreaterThan(expected * PRICE_DRIFT_SHARE);
}

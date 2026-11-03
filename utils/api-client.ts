import { randomUUID } from 'node:crypto';
import { expect } from 'vitest';

const BASE_URL = 'https://wallet-api.solflare.com';
// The app generates one uuid4 per install, so one per test run works the same way
const AUTH_HEADER = `Bearer ${randomUUID()}`;

export const ADDRESSES = [
  '96Y3j66AX16noUAAVriW8bmwTGzV1PVqBKCEArPd5fuU',
  '7eXxD3vQww9cgBgD3gb7iqTriAzAmCBXFBMpdDi71P3i',
];
// The balances endpoint expects each address with a 1 in front of it
export const PUBKEYS = ADDRESSES.map((address) => `1${address}`);
// Separate responses can differ because prices move. The worst gap measured was $0.00053.
export const PRICE_DRIFT_LIMIT = 0.01;

export interface Token {
  symbol: string;
  totalUiAmount: number;
  isStock: boolean;
  // Some tokens have no price, and the API leaves them out of the total
  price: { price: number } | null;
}

export interface TokensResponse {
  tokens: Token[];
  value: { total: number };
  tokensValue: { total: number };
  stocksValue: { total: number };
  errors: unknown[];
}

export interface BalancesResponse {
  netWorth: number;
  data: { publicKey: string; value: number }[];
}

interface RequestOptions {
  network?: string;
  currency?: string;
  // Null sends no header, so tests can check that auth is required
  auth?: string | null;
}

function buildHeaders(auth: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) headers.Authorization = auth;
  return headers;
}

// Sends the tokens request and returns the raw response, for tests that expect a rejection
export function requestTokens(address: string, options: RequestOptions = {}) {
  const { network = 'mainnet', auth = AUTH_HEADER } = options;
  return fetch(`${BASE_URL}/v3/portfolio/tokens/${address}?network=${network}`, {
    headers: buildHeaders(auth),
  });
}

// Sends the balances request and returns the raw response, for tests that expect a rejection
export function requestBalances(pubkeys: string[], options: RequestOptions = {}) {
  const { network = 'mainnet', currency = 'usd', auth = AUTH_HEADER } = options;
  return fetch(`${BASE_URL}/v2/portfolio/balances`, {
    method: 'POST',
    headers: buildHeaders(auth),
    body: JSON.stringify({ pubkeys, currency, general: true, network }),
  });
}

// Reads a successful response. The message names the URL, so a blocked call is easy to spot.
async function readJson<T>(response: Response): Promise<T> {
  expect(response.status, `${response.url} returned ${response.status}`).toBe(200);
  return (await response.json()) as T;
}

export async function getTokens(address: string, options: RequestOptions = {}) {
  return readJson<TokensResponse>(await requestTokens(address, options));
}

export async function getBalances(pubkeys: string[], options: RequestOptions = {}) {
  return readJson<BalancesResponse>(await requestBalances(pubkeys, options));
}

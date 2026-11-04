const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';
const ECB_RATES_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
const TOKEN_PROGRAMS = [
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
];
// The API lists SOL under this ID, though SOL is not really a token with a mint
const SOL_MINT = '11111111111111111111111111111111';
const LAMPORTS_PER_SOL = 1_000_000_000;
const OUTSIDE_TIMEOUT_MS = 30000;

interface TokenAccount {
  account: {
    data: { parsed: { info: { mint: string; tokenAmount: { uiAmount: number } } } };
  };
}

// Calls a service outside Solflare. The error says so, because its failure isn't an API bug.
async function callOutside(url: string, init?: RequestInit) {
  try {
    const response = await fetch(url, { ...init, signal: AbortSignal.timeout(OUTSIDE_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`Status ${response.status}`);
    return await response.text();
  } catch (error) {
    throw new Error(`${url} is outside Solflare and failed`, { cause: error });
  }
}

// Calls Solana's public RPC, which reads the blockchain directly
async function callSolana<T>(method: string, params: unknown[]) {
  const answer = await callOutside(SOLANA_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const { result, error } = JSON.parse(answer) as { result: { value: T }; error?: unknown };
  if (error) throw new Error(`${SOLANA_RPC_URL} is outside Solflare and returned an error`);
  return result.value;
}

// Reads what a wallet really holds, as amounts by mint, leaving out anything with a zero balance
export async function getChainHoldings(address: string) {
  const holdings: Record<string, number> = {};
  const lamports = await callSolana<number>('getBalance', [address]);
  if (lamports > 0) holdings[SOL_MINT] = lamports / LAMPORTS_PER_SOL;

  for (const programId of TOKEN_PROGRAMS) {
    const accounts = await callSolana<TokenAccount[]>('getTokenAccountsByOwner', [
      address,
      { programId },
      { encoding: 'jsonParsed' },
    ]);
    for (const { account } of accounts) {
      const { mint, tokenAmount } = account.data.parsed.info;
      if (tokenAmount.uiAmount > 0) holdings[mint] = (holdings[mint] ?? 0) + tokenAmount.uiAmount;
    }
  }
  return holdings;
}

// Reads the European Central Bank's rate, published once a working day. The feed gives USD per EUR.
export async function getEurPerUsd() {
  const feed = await callOutside(ECB_RATES_URL);
  const usdPerEur = feed.match(/currency='USD' rate='([\d.]+)'/)?.[1];
  if (!usdPerEur) throw new Error(`${ECB_RATES_URL} is outside Solflare and has no USD rate`);
  return 1 / Number(usdPerEur);
}

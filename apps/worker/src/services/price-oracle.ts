/**
 * Reference price lookup for quantitative markets.
 * Detects "Will X be above/below $Y" patterns and fetches the actual price.
 * Uses CoinGecko (crypto, free, no key) and Yahoo Finance (stocks, free, no key).
 */

export interface ReferencePrice {
  asset: string;
  currentPrice: number;
  threshold: number | null;
  source: string;
}

const TIMEOUT_MS = 5000;

async function fetchWithTimeout(url: string, headers?: Record<string, string>): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal, headers });
  } finally {
    clearTimeout(timer);
  }
}

// ── Crypto asset map ──────────────────────────────────────────────────────────

const CRYPTO_MAP: Record<string, string> = {
  BTC: "bitcoin", BITCOIN: "bitcoin",
  ETH: "ethereum", ETHEREUM: "ethereum",
  SOL: "solana", SOLANA: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  AVAX: "avalanche-2",
  LINK: "chainlink",
  DOT: "polkadot",
  MATIC: "matic-network", POL: "matic-network",
};

// ── Stock symbol patterns ─────────────────────────────────────────────────────

const STOCK_PATTERNS = [
  /\b(AAPL|MSFT|GOOGL|GOOG|AMZN|META|TSLA|NVDA|AMD|NFLX|BABA|UBER|COIN|SPY|QQQ|GOLD|GLD)\b/i,
];

// ── Title parsing ─────────────────────────────────────────────────────────────

function parseThreshold(title: string): number | null {
  const match = title.match(/\$([0-9,]+(?:\.[0-9]+)?)[kKmM]?/);
  if (!match) return null;
  const raw = parseFloat(match[1].replace(/,/g, ""));
  if (title.match(/\dk\b/i)) return raw * 1000;
  return raw;
}

function detectCrypto(title: string): string | null {
  for (const [ticker, id] of Object.entries(CRYPTO_MAP)) {
    if (new RegExp(`\\b${ticker}\\b`, "i").test(title)) return id;
  }
  return null;
}

function detectStock(title: string): string | null {
  for (const pat of STOCK_PATTERNS) {
    const m = title.match(pat);
    if (m) return m[1].toUpperCase();
  }
  return null;
}

// ── Price fetchers ────────────────────────────────────────────────────────────

async function getCryptoPrice(coinId: string): Promise<number | null> {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
    const resp = await fetchWithTimeout(url);
    if (!resp.ok) return null;
    const data = await resp.json() as Record<string, { usd?: number }>;
    return data[coinId]?.usd ?? null;
  } catch {
    return null;
  }
}

async function getStockPrice(ticker: string): Promise<number | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
    const resp = await fetchWithTimeout(url, {
      "User-Agent": "Mozilla/5.0",
    });
    if (!resp.ok) return null;
    const data = await resp.json() as {
      chart?: { result?: Array<{ meta?: { regularMarketPrice?: number } }> };
    };
    return data.chart?.result?.[0]?.meta?.regularMarketPrice ?? null;
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getReferencePrice(title: string): Promise<ReferencePrice | null> {
  const threshold = parseThreshold(title);

  const cryptoId = detectCrypto(title);
  if (cryptoId) {
    const price = await getCryptoPrice(cryptoId);
    if (price == null) return null;
    const ticker = Object.entries(CRYPTO_MAP).find(([, v]) => v === cryptoId)?.[0] ?? cryptoId.toUpperCase();
    return { asset: ticker, currentPrice: price, threshold, source: "CoinGecko" };
  }

  const stockTicker = detectStock(title);
  if (stockTicker) {
    const price = await getStockPrice(stockTicker);
    if (price == null) return null;
    return { asset: stockTicker, currentPrice: price, threshold, source: "Yahoo Finance" };
  }

  return null;
}

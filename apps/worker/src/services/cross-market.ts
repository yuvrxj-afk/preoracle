/**
 * Cross-market price comparison.
 * Searches Manifold and Metaculus for the same question and returns their probabilities.
 * Both APIs are free, no auth required.
 */

export interface CrossMarketPrices {
  manifold: { probability: number; question: string; url: string } | null;
  metaculus: { probability: number; question: string; url: string } | null;
}

const TIMEOUT_MS = 4000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function searchManifold(title: string): Promise<CrossMarketPrices["manifold"]> {
  try {
    const url = `https://api.manifold.markets/v0/search-markets?term=${encodeURIComponent(title)}&limit=3&filter=open&contractType=BINARY`;
    const resp = await fetchWithTimeout(url);
    if (!resp.ok) return null;

    const markets = await resp.json() as Array<{
      probability?: number;
      question: string;
      url: string;
    }>;

    const match = markets.find((m) => typeof m.probability === "number");
    if (!match) return null;

    return {
      probability: match.probability!,
      question: match.question,
      url: match.url,
    };
  } catch {
    return null;
  }
}

async function searchMetaculus(title: string): Promise<CrossMarketPrices["metaculus"]> {
  try {
    const url = `https://www.metaculus.com/api2/questions/?search=${encodeURIComponent(title)}&limit=3&status=open`;
    const resp = await fetchWithTimeout(url);
    if (!resp.ok) return null;

    const data = await resp.json() as {
      results?: Array<{
        title: string;
        page_url: string;
        community_prediction?: { full?: { q2?: number } };
      }>;
    };

    const match = (data.results ?? []).find(
      (q) => q.community_prediction?.full?.q2 != null
    );
    if (!match) return null;

    return {
      probability: match.community_prediction!.full!.q2!,
      question: match.title,
      url: `https://www.metaculus.com${match.page_url}`,
    };
  } catch {
    return null;
  }
}

export async function getCrossMarketPrices(title: string): Promise<CrossMarketPrices> {
  const [manifold, metaculus] = await Promise.all([
    searchManifold(title).catch(() => null),
    searchMetaculus(title).catch(() => null),
  ]);
  return { manifold, metaculus };
}

/** Compute divergence label vs Polymarket price. */
export function getDivergenceLabel(
  polymarketPrice: number,
  cross: CrossMarketPrices
): string {
  const peers = [cross.manifold?.probability, cross.metaculus?.probability]
    .filter((p): p is number => p != null);

  if (peers.length === 0) return "INSUFFICIENT_DATA";

  const peerAvg = peers.reduce((a, b) => a + b, 0) / peers.length;
  const diff = polymarketPrice - peerAvg;

  if (diff > 0.08) return "OVERPRICED";
  if (diff < -0.08) return "UNDERPRICED";
  return "ALIGNED";
}

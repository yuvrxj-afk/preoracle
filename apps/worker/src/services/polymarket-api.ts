/** Gamma API client — fetch only, no DB. */
import axios from "axios";
import type { PolymarketMarket } from "../types/polymarket";
import { POLYMARKET } from "../config";

const client = axios.create({
  baseURL: POLYMARKET.GAMMA_API_BASE,
  timeout: 30_000,
});

export interface FetchMarketsOptions {
  active?: boolean;
  limit?: number;
  endDateAfter?: Date;
}

/** Active markets from Gamma API; optional endDateAfter filter. */
export async function fetchMarkets(
  options: FetchMarketsOptions = {}
): Promise<PolymarketMarket[]> {
  const { active = true, limit = POLYMARKET.DEFAULT_MARKET_LIMIT, endDateAfter } = options;

  const params = new URLSearchParams();
  if (active) params.set("active", "true");

  const { data } = await client.get<PolymarketMarket[]>(POLYMARKET.MARKETS_PATH, {
    params: Object.fromEntries(params),
  });

  let list = Array.isArray(data) ? data : [];

  if (endDateAfter) {
    list = list.filter((m) => m.endDate != null && new Date(m.endDate) > endDateAfter);
  }

  return list.slice(0, limit);
}

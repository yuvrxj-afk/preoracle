/** Polymarket CLOB API client — public, no auth required for reads. */
import axios from "axios";

const CLOB_BASE = "https://clob.polymarket.com";
const DEFAULT_LIMIT = 500;

export interface ClobTrade {
  transaction_hash: string;
  market: string;        // condition_id
  asset_id: string;      // outcome token id
  side: "BUY" | "SELL";
  price: string;         // decimal string e.g. "0.52"
  size: string;          // outcome tokens as decimal string
  maker_address: string;
  taker_address: string;
  match_time: string;    // ISO timestamp
}

interface ClobTradesResponse {
  data: ClobTrade[];
  next_cursor: string;
  limit: number;
}

/**
 * Fetch recent trades for a market by condition_id.
 * Returns up to `limit` trades ordered newest-first.
 * Pass `after` cursor to paginate.
 */
export async function getTradesByMarket(
  conditionId: string,
  options: { limit?: number; after?: string } = {}
): Promise<ClobTradesResponse> {
  const params: Record<string, string | number> = {
    market_id: conditionId,
    limit: options.limit ?? DEFAULT_LIMIT,
  };
  if (options.after) params.next_cursor = options.after;

  const res = await axios.get<ClobTradesResponse>(`${CLOB_BASE}/trades`, {
    params,
    timeout: 10_000,
  });
  return res.data;
}

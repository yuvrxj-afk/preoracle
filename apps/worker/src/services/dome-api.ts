/**
 * Dome API client — uses @dome-api/sdk for markets and candlesticks.
 */

import { DomeClient } from "@dome-api/sdk";
import type { MarketsResponse, CandlesticksResponse } from "@dome-api/sdk";

function getApiKey(): string {
  const key = process.env.DOME_API_KEY;
  if (key === undefined || key === "") {
    throw new Error("Missing DOME_API_KEY");
  }
  return key;
}

let clientInstance: DomeClient | null = null;

function getClient(apiKey?: string): DomeClient {
  if (clientInstance) return clientInstance;
  clientInstance = new DomeClient({ apiKey: apiKey ?? getApiKey() });
  return clientInstance;
}

/**
 * Fetches markets filtered by condition_id(s). Returns first page only.
 */
export async function getMarketsByConditionId(
  conditionId: string,
  apiKey?: string
): Promise<MarketsResponse> {
  const dome = getClient(apiKey);
  return dome.polymarket.markets.getMarkets({
    condition_id: [conditionId],
    limit: 10,
  });
}

/**
 * Fetches candlestick data for a market by condition_id.
 * Interval: 1 = 1m (max 1 week), 60 = 1h (max 1 month), 1440 = 1d (max 1 year).
 */
export async function getCandlesticks(
  conditionId: string,
  startTime: number,
  endTime: number,
  interval: 1 | 60 | 1440 = 1440,
  apiKey?: string
): Promise<CandlesticksResponse["candlesticks"]> {
  const dome = getClient(apiKey);
  const res = await dome.polymarket.markets.getCandlesticks({
    condition_id: conditionId,
    start_time: startTime,
    end_time: endTime,
    interval,
  });
  return res.candlesticks ?? [];
}

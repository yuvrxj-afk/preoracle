/** Dome API — @dome-api/sdk for markets and candlesticks. */
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

/** Markets by condition_id (first page). */
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

/** Candlesticks for condition_id. Interval: 1=1m, 60=1h, 1440=1d. */
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

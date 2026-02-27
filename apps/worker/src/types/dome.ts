/**
 * Types for Dome API responses.
 * @see https://docs.domeapi.io/
 */

export interface DomeMarketSide {
  id: string;
  label: string;
}

export interface DomeMarket {
  market_slug: string;
  event_slug: string | null;
  condition_id: string;
  title: string;
  start_time: number;
  end_time: number;
  completed_time: number | null;
  close_time: number | null;
  tags: string[];
  volume_1_week: number;
  volume_1_month: number;
  volume_1_year: number;
  volume_total: number;
  resolution_source: string;
  image: string;
  description: string | null;
  side_a: DomeMarketSide;
  side_b: DomeMarketSide;
  winning_side: string | null;
  status: "open" | "closed";
}

export interface DomeMarketsResponse {
  markets: DomeMarket[];
  pagination: { limit: number; offset: number; total: number; has_more: boolean };
}

/** One candlestick period (price in 0–1, volume in USD). */
export interface DomeCandlestickPrice {
  open: number;
  high: number;
  low: number;
  close: number;
  mean?: number;
  previous?: number;
}

export interface DomeCandlestickRow {
  end_period_ts: number;
  volume: number;
  price: DomeCandlestickPrice;
  open_interest?: number;
}

export interface DomeCandlestickTokenMeta {
  token_id: string;
  side: string;
}

/** Tuple: [candlestick_data[], token_metadata] */
export type DomeCandlestickSeries = [DomeCandlestickRow[], DomeCandlestickTokenMeta];

export interface DomeCandlesticksResponse {
  candlesticks: DomeCandlestickSeries[];
}

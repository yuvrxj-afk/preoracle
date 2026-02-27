/**
 * Types for Polymarket Gamma API responses.
 * @see https://gamma-api.polymarket.com/markets
 */

export interface PolymarketMarket {
  id: string;
  question: string;
  slug: string;
  description: string | null;
  category: string | null;
  conditionId: string | null;
  marketType: string | null;
  image: string | null;
  icon: string | null;
  resolutionSource: string | null;
  marketMakerAddress: string | null;
  active: boolean;
  closed: boolean;
  archived: boolean;
  approved: boolean;
  funded: boolean;
  restricted: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  endDate: string | null;
  closedTime: string | null;
  outcomes: string; // JSON array string
  outcomePrices: string; // JSON array string
  liquidityNum: number | null;
  volumeNum: number | null;
  volume24hr: number | null;
  lastTradePrice: number | null;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  oneHourPriceChange: number | null;
  oneDayPriceChange: number | null;
  oneWeekPriceChange: number | null;
}

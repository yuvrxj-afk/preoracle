/**
 * App configuration and constants.
 */

export const POLYMARKET = {
  GAMMA_API_BASE: "https://gamma-api.polymarket.com",
  MARKETS_PATH: "/markets",
  DEFAULT_MARKET_LIMIT: 20,
} as const;

export const DOME = {
  API_BASE: "https://api.domeapi.io/v1",
  CANDLESTICK_INTERVAL_1D: 1440,
  CANDLESTICK_MAX_DAYS_1D: 365,
} as const;

export function getEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

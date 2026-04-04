/**
 * App config and constants.
 */

export const MARKET_SCOPE = {
  MIN_TRACKED: 20,
  MAX_TRACKED: 50,
  DEFAULT_TRACKED: 30,
} as const;

export const POLYMARKET = {
  GAMMA_API_BASE: "https://gamma-api.polymarket.com",
  MARKETS_PATH: "/markets",
  DEFAULT_MARKET_LIMIT: MARKET_SCOPE.DEFAULT_TRACKED,
} as const;

export const DOME = {
  CANDLESTICK_INTERVAL_1D: 1440,
  CANDLESTICK_MAX_DAYS_1D: 365,
  MARKET_CACHE_MAX_AGE_HOURS: 24,
  CANDLESTICKS_CACHE_MAX_AGE_HOURS: 6,
} as const;

export function getEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

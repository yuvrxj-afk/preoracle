/**
 * Polymarket CLOB service.
 *
 * Provides:
 *   - getClobClient()        → authenticated ClobClient (uses POLYMARKET_PK env var)
 *   - placeOrder()           → create + post a GTC order
 *   - getUsdcBalance()       → read wallet USDC balance / allowance
 */
import { ethers } from "ethers";
import {
  ClobClient,
  Side,
  type ApiKeyCreds,
  type TickSize,
} from "@polymarket/clob-client";

const CLOB_HOST = "https://clob.polymarket.com";
const CHAIN_ID = 137; // Polygon mainnet

let _client: ClobClient | null = null;

/**
 * Returns a singleton ClobClient authenticated with POLYMARKET_PK.
 * On first call it derives/creates API credentials and caches them.
 */
export async function getClobClient(): Promise<ClobClient> {
  if (_client) return _client;

  const pk = process.env.POLYMARKET_PK;
  if (!pk) throw new Error("Missing env: POLYMARKET_PK (Polygon private key)");

  const wallet = new ethers.Wallet(pk);
  const client = new ClobClient(CLOB_HOST, CHAIN_ID, wallet);

  // Derive L2 HMAC API credentials from the wallet signature.
  // This is idempotent — safe to call on every startup.
  const creds: ApiKeyCreds = await client.createOrDeriveApiKey();
  _client = new ClobClient(CLOB_HOST, CHAIN_ID, wallet, creds);

  return _client;
}

export interface PlaceOrderParams {
  tokenID: string;   // outcome token ID (side_a_id or side_b_id from dome_markets)
  conditionId: string;
  price: number;     // 0.01–0.99
  sizeUsd: number;   // USD notional → converted to shares: size = sizeUsd / price
  side?: "BUY" | "SELL";
}

export interface PlaceOrderResult {
  orderId: string;
  status: string;
  tokenID: string;
  price: number;
  size: number;
}

export async function placeOrder(params: PlaceOrderParams): Promise<PlaceOrderResult> {
  const client = await getClobClient();

  // Get tick size and neg_risk from the market
  const market = await client.getMarket(params.conditionId);
  const tickSize = String(market.minimum_tick_size ?? "0.01") as TickSize;
  const negRisk = market.neg_risk ?? false;

  // Convert USD notional to shares
  const size = parseFloat((params.sizeUsd / params.price).toFixed(2));

  const resp = await client.createAndPostOrder(
    {
      tokenID: params.tokenID,
      price: params.price,
      size,
      side: params.side === "SELL" ? Side.SELL : Side.BUY,
    },
    { tickSize, negRisk }
  );

  return {
    orderId: resp.orderID,
    status: resp.status,
    tokenID: params.tokenID,
    price: params.price,
    size,
  };
}

export interface BalanceInfo {
  usdc_balance: number;
  usdc_allowance: number;
}

export async function getUsdcBalance(): Promise<BalanceInfo> {
  const client = await getClobClient();
  const result = await client.getBalanceAllowance();
  return {
    usdc_balance: result.balance ? parseFloat(result.balance) : 0,
    usdc_allowance: result.allowance ? parseFloat(result.allowance) : 0,
  };
}

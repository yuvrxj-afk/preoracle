/** LLM provider abstraction — Claude (primary). */
import Anthropic from "@anthropic-ai/sdk";
import { getEnv } from "../config";

export interface VerdictResponse {
  verdict: "BUY" | "SKIP" | "HOLD";
  confidence: number;
  reason: string;
  model: string;
}

const MODEL = "claude-haiku-4-5-20251001";

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: getEnv("ANTHROPIC_API_KEY") });
  }
  return _client;
}

export async function reasonWithClaude(prompt: string): Promise<VerdictResponse> {
  const client = getClient();

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const parsed = parseVerdict(raw);
  return { ...parsed, model: MODEL };
}

function parseVerdict(raw: string): Omit<VerdictResponse, "model"> {
  // Strip any markdown code fences if present.
  const cleaned = raw.replace(/```(?:json)?/g, "").trim();

  let obj: unknown;
  try {
    obj = JSON.parse(cleaned);
  } catch {
    throw new Error(`LLM returned non-JSON response: ${raw.slice(0, 200)}`);
  }

  if (typeof obj !== "object" || obj === null) {
    throw new Error("LLM returned null or non-object JSON");
  }

  const o = obj as Record<string, unknown>;
  const verdict = o["verdict"];
  const confidence = o["confidence"];
  const reason = o["reason"];

  if (verdict !== "BUY" && verdict !== "SKIP" && verdict !== "HOLD") {
    throw new Error(`Invalid verdict value: ${String(verdict)}`);
  }
  if (typeof confidence !== "number" || confidence < 0 || confidence > 1) {
    throw new Error(`Invalid confidence value: ${String(confidence)}`);
  }
  if (typeof reason !== "string" || reason.trim().length === 0) {
    throw new Error("Missing or empty reason");
  }

  return { verdict, confidence, reason: reason.trim() };
}

/**
 * LLM provider abstraction.
 * Gemini-only via generateContent endpoint.
 */

export interface VerdictResponse {
  verdict: "BUY" | "SKIP" | "HOLD";
  confidence: number;
  reason: string;
  model: string;
  usage?: {
    totalTokenCount?: number;
  };
}

export type LlmTask =
  | "high"
  | "default"
  | "lite"
  | "experimental"
  | "experimental-lite";

const GEMINI_MODELS: Record<LlmTask, string> = {
  high: "gemini-2.5-pro",
  default: "gemini-2.5-flash",
  lite: "gemini-2.5-flash-lite",
  experimental: "gemini-3-flash-preview",
  "experimental-lite": "gemini-3.1-flash-lite-preview",
};

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

const SYSTEM_INSTRUCTION =
  "You are a prediction market analyst. Use any available context and your knowledge to evaluate the market. " +
  "Respond with ONLY a valid JSON object — no prose, no markdown fences, no explanation outside the JSON. " +
  'Format: {"verdict":"BUY"|"SKIP"|"HOLD","confidence":0.0-1.0,"reason":"max 2 sentences"}';

export interface LlmOptions {
  task?: LlmTask;
}

export async function reasonWithLLM(prompt: string, options: LlmOptions = {}): Promise<VerdictResponse> {
  return reasonWithGemini(prompt, options);
}

export function parseLlmTask(value?: string): LlmTask | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "high" || normalized === "pro") return "high";
  if (normalized === "default" || normalized === "flash") return "default";
  if (normalized === "lite" || normalized === "flash-lite") return "lite";
  if (normalized === "experimental" || normalized === "preview") return "experimental";
  if (normalized === "experimental-lite" || normalized === "preview-lite" || normalized === "flash-lite-preview") {
    return "experimental-lite";
  }
  return undefined;
}

// ── Gemini via generateContent ───────────────────────────────────────────────

async function reasonWithGemini(prompt: string, options: LlmOptions): Promise<VerdictResponse> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
  if (!apiKey) throw new Error("Missing env: GEMINI_API_KEY");

  const task = options.task ?? "default";
  const model = resolveModel(task);

  const resp = await fetch(`${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 256,
      },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gemini ${resp.status}: ${text}`);
  }

  const data = await resp.json() as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
    usageMetadata?: { totalTokenCount?: number };
  };

  const raw = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";
  if (!raw) throw new Error("Gemini returned empty content");
  return {
    ...parseVerdict(raw),
    model,
    usage: data.usageMetadata?.totalTokenCount ? { totalTokenCount: data.usageMetadata.totalTokenCount } : undefined,
  };
}

function resolveModel(task: LlmTask): string {
  const envKey = {
    high: "GEMINI_MODEL_HIGH",
    default: "GEMINI_MODEL_DEFAULT",
    lite: "GEMINI_MODEL_LITE",
    experimental: "GEMINI_MODEL_EXPERIMENTAL",
    "experimental-lite": "GEMINI_MODEL_EXPERIMENTAL_LITE",
  } as const;

  const override = process.env[envKey[task]];
  return override && override.trim() ? override.trim() : GEMINI_MODELS[task];
}

// ── JSON parser ───────────────────────────────────────────────────────────────

function parseVerdict(raw: string): Omit<VerdictResponse, "model"> {
  const cleaned = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/```(?:json)?[\s\S]*?```/g, (m) => m.replace(/```(?:json)?/g, ""))
    .replace(/```/g, "")
    .trim();

  let obj: unknown;
  try {
    obj = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(`LLM returned non-JSON: ${raw.slice(0, 200)}`);
    obj = JSON.parse(match[0]);
  }

  if (typeof obj !== "object" || obj === null) throw new Error("LLM returned null/non-object");

  const o = obj as Record<string, unknown>;
  const verdict = o["verdict"];
  const confidence = o["confidence"];
  const reason = o["reason"];

  if (verdict !== "BUY" && verdict !== "SKIP" && verdict !== "HOLD")
    throw new Error(`Invalid verdict: ${String(verdict)}`);
  if (typeof confidence !== "number" || confidence < 0 || confidence > 1)
    throw new Error(`Invalid confidence: ${String(confidence)}`);
  if (typeof reason !== "string" || !reason.trim())
    throw new Error("Missing reason");

  return { verdict, confidence, reason: reason.trim() };
}

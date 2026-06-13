/**
 * Server-side AiAssist gateway client (api.aiassist.net).
 *
 * The API key is read ONLY here, from process.env — it is never sent to the
 * browser. Every request carries `X-AiAssist-Provider` (Mark's rule). Provider
 * is resolved explicit → inferred-from-model → AIASSIST_DEFAULT_PROVIDER.
 *
 * Mirrors the verified `aiassist` skill (skills/aiassist/aiassist_api.py).
 */

const BASE = (process.env.AIASSIST_BASE_URL ?? "https://api.aiassist.net").replace(/\/+$/, "");
const KEY = process.env.AIASSIST_API_KEY ?? "";
const DEFAULT_PROVIDER = process.env.AIASSIST_DEFAULT_PROVIDER ?? "anthropic";
const DEFAULT_MODEL = process.env.AIASSIST_DEFAULT_MODEL ?? "claude-sonnet-4-6";

const MODEL_PROVIDER: ReadonlyArray<readonly [string, string]> = [
  ["claude", "anthropic"],
  ["gpt", "openai"], ["o1", "openai"], ["o3", "openai"],
  ["llama", "groq"], ["mixtral", "groq"], ["gemma", "groq"],
  ["gemini", "gemini"],
  ["mistral", "mistral"],
  ["deepseek", "deepseek"],
  ["grok", "xai"],
  ["sonar", "perplexity"],
  ["command", "cohere"],
];

export function hasCredentials(): boolean {
  return KEY.length > 0;
}

export function defaults(): { provider: string; model: string } {
  return { provider: DEFAULT_PROVIDER, model: DEFAULT_MODEL };
}

export function inferProvider(model?: string): string {
  if (model) {
    const m = model.toLowerCase();
    for (const [needle, provider] of MODEL_PROVIDER) if (m.includes(needle)) return provider;
  }
  return DEFAULT_PROVIDER;
}

function headers(provider?: string): Record<string, string> {
  return {
    Authorization: `Bearer ${KEY}`,
    "Content-Type": "application/json",
    // ALWAYS sent — never omitted.
    "X-AiAssist-Provider": provider ?? DEFAULT_PROVIDER,
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  contextWindow?: number;
  maxOutput?: number;
}
export interface ProviderInfo {
  id: string;
  label: string;
  isDefault: boolean;
  models: ModelInfo[];
}
export interface ProvidersResult {
  defaultProvider: string;
  providers: ProviderInfo[];
}

/** GET /v1/providers — normalized for the UI selectors + marquee. */
export async function listProviders(): Promise<ProvidersResult> {
  const res = await fetch(`${BASE}/v1/providers`, { headers: headers() });
  if (!res.ok) throw new Error(`AiAssist /v1/providers -> ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    default_provider?: string;
    providers?: Array<{
      id: string; name?: string; is_default?: boolean;
      models?: Array<{ id: string; name?: string; context_window?: number; max_output?: number }>;
    }>;
  };
  const providers: ProviderInfo[] = (data.providers ?? []).map((p) => ({
    id: p.id,
    label: p.name ?? p.id,
    isDefault: Boolean(p.is_default),
    models: (p.models ?? []).map((m) => ({
      id: m.id,
      name: m.name ?? m.id,
      contextWindow: m.context_window,
      maxOutput: m.max_output,
    })),
  }));
  return { defaultProvider: data.default_provider ?? DEFAULT_PROVIDER, providers };
}

export interface ChatArgs {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  model?: string;
  provider?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

/** POST /v1/chat/completions — returns the assistant text. */
export async function chat(args: ChatArgs): Promise<string> {
  const model = args.model ?? DEFAULT_MODEL;
  const provider = args.provider ?? inferProvider(model);
  const body: Record<string, unknown> = { model, messages: args.messages };
  if (args.temperature != null) body.temperature = args.temperature;
  if (args.maxTokens != null) body.max_tokens = args.maxTokens;
  if (args.systemPrompt) body.systemPrompt = args.systemPrompt;

  const res = await fetch(`${BASE}/v1/chat/completions`, {
    method: "POST",
    headers: headers(provider),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`AiAssist /v1/chat/completions -> ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}

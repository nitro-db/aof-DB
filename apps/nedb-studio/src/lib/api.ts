import type { GenerateResponse, ProvidersPayload, StudioStatus } from "./types";

/**
 * Browser → server API. The browser only ever talks to our own /api routes
 * (proxied to the Express server in dev). It never sees the AiAssist key.
 */

export async function getStatus(): Promise<StudioStatus> {
  const res = await fetch("/api/status");
  if (!res.ok) throw new Error(`/api/status -> ${res.status}`);
  return (await res.json()) as StudioStatus;
}

export async function getProviders(): Promise<ProvidersPayload> {
  const res = await fetch("/api/providers");
  if (!res.ok) throw new Error(`/api/providers -> ${res.status}`);
  return (await res.json()) as ProvidersPayload;
}

export async function generate(
  prompt: string,
  provider?: string,
  model?: string,
): Promise<GenerateResponse> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, provider, model }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`/api/generate -> ${res.status}: ${text}`);
  }
  return (await res.json()) as GenerateResponse;
}

export interface CompileNqlResult {
  nql: string;
  mode: "mock" | "live";
  error?: string;
}

/** Natural language → NQL. Schema is {collections, relations, indexes}. */
export async function compileNql(prompt: string, schema: unknown): Promise<CompileNqlResult> {
  const res = await fetch("/api/nql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, schema }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`/api/nql -> ${res.status}: ${text}`);
  }
  return (await res.json()) as CompileNqlResult;
}

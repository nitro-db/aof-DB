import { Router } from "express";

import { finalizeScaffold } from "../lib/scaffold";
import { matchTemplate, MOCK_PROVIDERS } from "../lib/mock";
import { heuristicNlToNql } from "../lib/nql";
import { validateScaffold } from "../lib/types";
import { chat, defaults, hasCredentials, listProviders } from "./aiassist";
import {
  extractJson,
  extractNql,
  nqlMessages,
  nqlSystem,
  runnerMessages,
  runnerSystem,
  sentinelMessages,
  sentinelSystem,
} from "./prompts";

/**
 * /api router. The AiAssist key never leaves this process. Every path degrades
 * gracefully to deterministic mock output, so the studio is always usable.
 */
export const api = Router();

api.get("/status", (_req, res) => {
  const d = defaults();
  res.json({ mode: hasCredentials() ? "live" : "mock", defaultProvider: d.provider, defaultModel: d.model });
});

// Providers + models for the UI selectors and marquee (bearer auth, server-side).
api.get("/providers", async (_req, res) => {
  if (!hasCredentials()) {
    res.json({ ...MOCK_PROVIDERS, mode: "mock" });
    return;
  }
  try {
    const result = await listProviders();
    res.json({ ...result, mode: "live" });
  } catch (err) {
    res.json({ ...MOCK_PROVIDERS, mode: "mock", error: String(err) });
  }
});

api.post("/generate", async (req, res) => {
  const prompt = String(req.body?.prompt ?? "").trim();
  const provider = req.body?.provider ? String(req.body.provider) : undefined;
  const model = req.body?.model ? String(req.body.model) : undefined;

  if (!prompt) {
    res.status(400).json({ error: "prompt is required" });
    return;
  }

  // Mock mode — no credentials configured.
  if (!hasCredentials()) {
    res.json({
      scaffold: matchTemplate(prompt),
      mode: "mock",
      notes: ["No AiAssist credentials configured — served a deterministic mock template."],
    });
    return;
  }

  const notes: string[] = [];
  try {
    // ── Runner: fast first-pass generation ──────────────────────────────────
    const raw = await chat({
      messages: [{ role: "system", content: runnerSystem() }, ...runnerMessages(prompt)],
      model,
      provider,
      temperature: 0.2,
      maxTokens: 4000,
    });
    let candidate = extractJson(raw);
    let result = validateScaffold(candidate);

    // ── Sentinel: validate / repair if the runner output is invalid ─────────
    if (!result.ok) {
      notes.push("Runner output failed validation; sentinel repaired it.");
      const repaired = await chat({
        messages: [
          { role: "system", content: sentinelSystem() },
          ...sentinelMessages(prompt, JSON.stringify(candidate), result.errors ?? []),
        ],
        model,
        provider,
        temperature: 0,
        maxTokens: 4000,
      });
      candidate = extractJson(repaired);
      result = validateScaffold(candidate);
    }

    // ── Guard: still invalid → deterministic mock fallback ──────────────────
    if (!result.ok || !result.scaffold) {
      res.json({
        scaffold: matchTemplate(prompt),
        mode: "mock",
        notes: [...notes, "Live generation failed validation twice; served a mock template.", ...(result.errors ?? []).slice(0, 5)],
      });
      return;
    }

    // Fill any server-owned artifacts (snippets/README) the model left empty.
    const scaffold = finalizeScaffold(result.scaffold);
    res.json({ scaffold, mode: "live", provider, model, notes });
  } catch (err) {
    res.json({
      scaffold: matchTemplate(prompt),
      mode: "mock",
      notes: ["Live generation error; served a mock template.", String(err)],
    });
  }
});

// Natural language → NQL (the query console). Compilation is server-side via
// AiAssist; execution happens in the browser against the scaffold's seed data.
api.post("/nql", async (req, res) => {
  const prompt = String(req.body?.prompt ?? "").trim();
  const schema = req.body?.schema;
  if (!prompt || !schema?.collections?.length) {
    res.status(400).json({ error: "prompt and schema are required" });
    return;
  }
  if (!hasCredentials()) {
    res.json({ nql: heuristicNlToNql(prompt, schema), mode: "mock" });
    return;
  }
  try {
    const raw = await chat({
      messages: [{ role: "system", content: nqlSystem(schema) }, ...nqlMessages(prompt)],
      temperature: 0,
      maxTokens: 160,
    });
    const nql = extractNql(raw) || heuristicNlToNql(prompt, schema);
    res.json({ nql, mode: "live" });
  } catch (err) {
    res.json({ nql: heuristicNlToNql(prompt, schema), mode: "mock", error: String(err) });
  }
});

import React from "react";
import type { ProviderInfo } from "../lib/types";
import { EXAMPLE_PROMPTS } from "../lib/mock";

interface Props {
  prompt: string;
  onPrompt: (v: string) => void;
  providers: ProviderInfo[];
  provider: string;
  onProvider: (v: string) => void;
  model: string;
  onModel: (v: string) => void;
  onGenerate: () => void;
  loading: boolean;
  mode: "mock" | "live";
}

export function PromptPanel(props: Props): React.ReactElement {
  const active = props.providers.find((p) => p.id === props.provider);
  const models = active?.models ?? [];

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-slate-300">DESCRIBE YOUR APP</h2>
        <span
          className={
            "rounded-full px-2.5 py-0.5 text-[11px] font-semibold " +
            (props.mode === "live"
              ? "bg-signal-green/15 text-signal-green"
              : "bg-signal-amber/15 text-signal-amber")
          }
          title={props.mode === "live" ? "AiAssist gateway connected" : "No credentials — deterministic mock templates"}
        >
          {props.mode === "live" ? "● live" : "● mock"}
        </span>
      </div>

      <textarea
        value={props.prompt}
        onChange={(e) => props.onPrompt(e.target.value)}
        placeholder="e.g. A booking app for a salon with stylists, services, and appointments…"
        spellCheck={false}
        className="glass-soft min-h-[140px] flex-1 resize-none rounded-xl p-3 text-sm text-slate-100 outline-none focus:border-accent/50"
      />

      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((ex) => (
          <button key={ex} onClick={() => props.onPrompt(ex)} className="chip">
            {ex}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Provider</span>
          <select
            value={props.provider}
            onChange={(e) => props.onProvider(e.target.value)}
            className="glass-soft rounded-lg px-2.5 py-2 text-sm text-slate-100 outline-none"
          >
            {props.providers.map((p) => (
              <option key={p.id} value={p.id} className="bg-ink-850">
                {p.label}
                {p.isDefault ? " (default)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Model</span>
          <select
            value={props.model}
            onChange={(e) => props.onModel(e.target.value)}
            className="glass-soft rounded-lg px-2.5 py-2 text-sm text-slate-100 outline-none"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id} className="bg-ink-850">
                {m.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        onClick={props.onGenerate}
        disabled={props.loading || props.prompt.trim().length === 0}
        className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        {props.loading ? "Generating…" : "Generate Schema"}
      </button>

      <p className="text-[11px] leading-relaxed text-slate-500">
        {props.mode === "live"
          ? "Routed through AiAssist. X-AiAssist-Provider is sent on every call; the API key stays server-side."
          : "Running deterministic templates. Add AiAssist credentials server-side to generate from any prompt."}
      </p>
    </div>
  );
}

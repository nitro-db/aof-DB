import React from "react";
import type { ProviderInfo } from "../lib/types";

/**
 * Seamless scrolling ticker of the provider/model pairs available on the
 * connected AiAssist account (or the mock set). Pauses on hover. This is the
 * "what can this gateway reach" surface — it makes the breadth tangible.
 */
export function Marquee({ providers }: { providers: ProviderInfo[] }): React.ReactElement | null {
  const items: Array<{ provider: string; model: string }> = [];
  for (const p of providers) {
    for (const m of p.models) items.push({ provider: p.label, model: m.name });
  }
  if (items.length === 0) return null;

  const row = [...items, ...items]; // duplicate for a seamless -50% loop

  return (
    <div className="marquee-mask overflow-hidden">
      <div className="animate-marquee flex items-center gap-2.5">
        {row.map((it, i) => (
          <span key={i} className="chip whitespace-nowrap">
            <span className="text-accent-soft">{it.provider}</span>
            <span className="text-slate-600">/</span>
            <span className="font-mono text-[11px] text-slate-300">{it.model}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

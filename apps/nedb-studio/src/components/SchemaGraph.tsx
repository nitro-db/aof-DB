import React, { useMemo, useState } from "react";
import type { Field, NEDBScaffold } from "../lib/types";

const CELL_W = 300;
const CELL_H = 252;
const NODE_W = 232;
const HEADER_H = 34;
const ROW_H = 22;
const PAD = 28;
const MAX_FIELDS = 7;

const KIND_COLOR: Record<string, string> = {
  eq: "#34d399",
  ordered: "#fbbf24",
  search: "#22d3ee",
};

interface GNode {
  name: string;
  fields: Field[];
  x: number;
  y: number;
  w: number;
  h: number;
  shown: number;
}

export function SchemaGraph({ scaffold }: { scaffold: NEDBScaffold }): React.ReactElement {
  const [hover, setHover] = useState<string | null>(null);

  const { nodes, pos, idx, width, height } = useMemo(() => {
    const n = Math.max(1, scaffold.collections.length);
    const cols = Math.max(1, Math.ceil(Math.sqrt(n)));
    const indexMap = new Map<string, string>();
    for (const i of scaffold.indexes) {
      const key = `${i.collection}.${i.field}`;
      if (!indexMap.has(key)) indexMap.set(key, i.kind);
    }
    const list: GNode[] = scaffold.collections.map((c, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const shown = Math.min(c.fields.length, MAX_FIELDS);
      const extra = c.fields.length > MAX_FIELDS ? ROW_H : 0;
      return {
        name: c.name,
        fields: c.fields,
        x: PAD + col * CELL_W,
        y: PAD + row * CELL_H,
        w: NODE_W,
        h: HEADER_H + shown * ROW_H + extra + 12,
        shown,
      };
    });
    const map = new Map(list.map((nd) => [nd.name, nd] as const));
    const rows = Math.ceil(n / cols);
    return {
      nodes: list,
      pos: map,
      idx: indexMap,
      width: PAD * 2 + cols * NODE_W + (cols - 1) * (CELL_W - NODE_W),
      height: PAD * 2 + rows * CELL_H,
    };
  }, [scaffold]);

  const center = (nd: GNode) => ({ x: nd.x + nd.w / 2, y: nd.y + nd.h / 2 });

  const isConnected = (name: string): boolean =>
    !hover ||
    hover === name ||
    scaffold.relations.some(
      (r) => (r.from === name && r.to === hover) || (r.to === name && r.from === hover),
    );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Database schema graph"
    >
      <defs>
        <marker id="arrow" markerWidth="9" markerHeight="9" refX="7.5" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L8,3 L0,6 Z" fill="#818cf8" />
        </marker>
      </defs>

      {/* relation edges */}
      {scaffold.relations.map((r, i) => {
        const a = pos.get(r.from);
        const b = pos.get(r.to);
        if (!a || !b) return null;
        const c1 = center(a);
        const c2 = center(b);
        const mx = (c1.x + c2.x) / 2;
        const my = (c1.y + c2.y) / 2;
        const active = !hover || hover === r.from || hover === r.to;
        return (
          <g key={`e-${i}`} opacity={active ? 1 : 0.12}>
            <path
              d={`M ${c1.x} ${c1.y} Q ${mx} ${my - 46} ${c2.x} ${c2.y}`}
              fill="none"
              stroke="#6366f1"
              strokeWidth={1.4}
              markerEnd="url(#arrow)"
            />
            <text x={mx} y={my - 26} textAnchor="middle" fontSize="10" fontFamily="JetBrains Mono, monospace" fill="#94a3b8">
              {r.relation} · {r.cardinality.replace(/_/g, " ")}
            </text>
          </g>
        );
      })}

      {/* entity cards */}
      {nodes.map((nd) => {
        const dim = hover != null && !isConnected(nd.name);
        const focused = hover === nd.name;
        return (
          <g
            key={nd.name}
            opacity={dim ? 0.22 : 1}
            onMouseEnter={() => setHover(nd.name)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: "pointer" }}
          >
            <rect
              x={nd.x}
              y={nd.y}
              width={nd.w}
              height={nd.h}
              rx={10}
              fill="#0e1322"
              stroke={focused ? "#818cf8" : "rgba(99,102,241,0.3)"}
              strokeWidth={focused ? 1.8 : 1}
            />
            <path
              d={`M ${nd.x} ${nd.y + 10} q 0 -10 10 -10 h ${nd.w - 20} q 10 0 10 10 v ${HEADER_H - 10} h ${-nd.w} z`}
              fill="rgba(99,102,241,0.16)"
            />
            <text x={nd.x + 12} y={nd.y + 22} fontSize="13" fontWeight={700} fontFamily="JetBrains Mono, monospace" fill="#ffffff">
              {nd.name}
            </text>

            {nd.fields.slice(0, nd.shown).map((f, fi) => {
              const kind = idx.get(`${nd.name}.${f.name}`);
              const yy = nd.y + HEADER_H + 16 + fi * ROW_H;
              return (
                <g key={f.name}>
                  {kind ? (
                    <circle cx={nd.x + 11} cy={yy - 4} r={3} fill={KIND_COLOR[kind] ?? "#94a3b8"}>
                      <title>{kind} index</title>
                    </circle>
                  ) : null}
                  <text x={nd.x + 22} y={yy} fontSize="11" fontFamily="JetBrains Mono, monospace" fill="#cbd5e1">
                    {f.name}
                    {f.required ? <tspan fill="#f87171"> *</tspan> : null}
                  </text>
                  <text x={nd.x + nd.w - 12} y={yy} textAnchor="end" fontSize="10" fontFamily="JetBrains Mono, monospace" fill="#64748b">
                    {f.type}
                  </text>
                </g>
              );
            })}
            {nd.fields.length > nd.shown ? (
              <text x={nd.x + 22} y={nd.y + HEADER_H + 16 + nd.shown * ROW_H} fontSize="10" fontFamily="JetBrains Mono, monospace" fill="#64748b">
                +{nd.fields.length - nd.shown} more fields
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

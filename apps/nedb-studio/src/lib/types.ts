import { z } from "zod";

/**
 * NEDBScaffold — the canonical artifact NEDB Studio produces.
 *
 * The Zod schema is the single source of truth. Every generated scaffold (mock
 * OR AiAssist) must pass `validateScaffold` before the UI renders it — this is
 * the "guard" stage of the runner → sentinel → guard pipeline, and it backs the
 * contract's "all schema objects must validate" quality gate.
 */

export const FieldType = z.enum([
  "string",
  "number",
  "boolean",
  "datetime",
  "json",
  "file",
  "reference",
]);
export type FieldType = z.infer<typeof FieldType>;

export const Cardinality = z.enum([
  "one_to_one",
  "one_to_many",
  "many_to_many",
]);
export type Cardinality = z.infer<typeof Cardinality>;

export const IndexKind = z.enum(["eq", "ordered", "search"]);
export type IndexKind = z.infer<typeof IndexKind>;

export const FieldSchema = z.object({
  name: z.string().min(1),
  type: FieldType,
  required: z.boolean().optional(),
  description: z.string().optional(),
});
export type Field = z.infer<typeof FieldSchema>;

export const CollectionSchema = z.object({
  name: z.string().min(1),
  fields: z.array(FieldSchema).min(1),
});
export type Collection = z.infer<typeof CollectionSchema>;

export const RelationSchema = z.object({
  from: z.string().min(1),
  relation: z.string().min(1),
  to: z.string().min(1),
  cardinality: Cardinality,
});
export type Relation = z.infer<typeof RelationSchema>;

export const IndexSchema = z.object({
  collection: z.string().min(1),
  field: z.string().min(1),
  kind: IndexKind,
});
export type Index = z.infer<typeof IndexSchema>;

export const NEDBScaffoldSchema = z.object({
  appName: z.string().min(1),
  description: z.string().min(1),
  collections: z.array(CollectionSchema).min(1),
  relations: z.array(RelationSchema),
  indexes: z.array(IndexSchema),
  seedData: z.record(z.array(z.any())),
  nqlExamples: z.array(z.string()),
  // Server-filled (buildScaffold). The model may return these empty; the server
  // generates them deterministically before the UI ever sees the scaffold.
  pythonSnippet: z.string().default(""),
  nodeSnippet: z.string().default(""),
  readmeExport: z.string().default(""),
});
export type NEDBScaffold = z.infer<typeof NEDBScaffoldSchema>;

export interface ValidationResult {
  ok: boolean;
  scaffold?: NEDBScaffold;
  errors?: string[];
}

/** Zod parse + referential-integrity checks (relations/indexes/seed must align). */
export function validateScaffold(raw: unknown): ValidationResult {
  const parsed = NEDBScaffoldSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map(
        (i) => `${i.path.join(".") || "(root)"}: ${i.message}`,
      ),
    };
  }
  const s = parsed.data;
  const names = new Set(s.collections.map((c) => c.name));
  const errors: string[] = [];

  for (const r of s.relations) {
    if (!names.has(r.from)) errors.push(`relation "${r.relation}" references unknown collection "${r.from}"`);
    if (!names.has(r.to)) errors.push(`relation "${r.relation}" references unknown collection "${r.to}"`);
  }
  for (const idx of s.indexes) {
    if (!names.has(idx.collection)) {
      errors.push(`index references unknown collection "${idx.collection}"`);
      continue;
    }
    const coll = s.collections.find((c) => c.name === idx.collection)!;
    if (!coll.fields.some((f) => f.name === idx.field)) {
      errors.push(`index references unknown field "${idx.collection}.${idx.field}"`);
    }
  }
  for (const key of Object.keys(s.seedData)) {
    if (!names.has(key)) errors.push(`seedData has rows for unknown collection "${key}"`);
  }

  if (errors.length) return { ok: false, errors };
  return { ok: true, scaffold: s };
}

export const ARTIFACT_TABS = [
  "Schema JSON",
  "Relations",
  "Indexes",
  "Seed Data",
  "NQL Queries",
  "Python",
  "Node",
  "README Export",
] as const;
export type ArtifactTab = (typeof ARTIFACT_TABS)[number];

export interface GenerateResponse {
  scaffold: NEDBScaffold;
  mode: "mock" | "live";
  provider?: string;
  model?: string;
  notes?: string[];
}

export interface ModelInfo {
  id: string;
  name: string;
  contextWindow?: number;
}

export interface ProviderInfo {
  id: string;
  label: string;
  isDefault?: boolean;
  models: ModelInfo[];
}

export interface ProvidersPayload {
  defaultProvider: string;
  providers: ProviderInfo[];
  mode: "mock" | "live";
  error?: string;
}

export interface StudioStatus {
  mode: "mock" | "live";
  defaultProvider: string;
  defaultModel: string;
}

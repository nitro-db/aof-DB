import { defineApp } from "@interchained/portal-contract";

/**
 * NEDB Studio — Portal contract (schema v1.1)
 *
 * This contract is the source of truth that portal-agent (runner / sentinel /
 * guard) and `portal audit` read when generating or reviewing any page. It
 * encodes who the product is for, what counts as success, which integrations
 * are in play, and the quality gates that turn soft warnings into hard failures.
 */
export default defineApp({
  name: "NEDB Studio",
  version: "1.1.0",
  description: "Prompt-to-database scaffolding for agent-native applications.",
  primaryAudience: [
    "Full-stack developers",
    "AI agent builders",
    "Solo founders",
    "Technical teams building local-first or verifiable apps",
  ],
  goals: [
    "Turn a natural-language app description into a validated NEDB schema in seconds",
    "Generate collections, fields, relations, indexes, search fields, and seed data",
    "Export ready-to-run Python and Node integration snippets and a README",
    "Make agent-native, verifiable database architecture feel like infrastructure, not a toy",
  ],

  brand: {
    voice: "infrastructure-grade, precise, developer-direct — no hype, no filler",
    colors: ["#06080f", "#6366f1", "#a78bfa", "#34d399", "#f8fafc"],
    fonts: ["Inter", "JetBrains Mono"],
    forbiddenPhrases: [
      "toy",
      "magic",
      "revolutionary",
      "game-changer",
      "world-class",
      "best-in-class",
      "seamless",
      "synergy",
    ],
  },

  data: {
    mockTemplates: "./src/lib/mock.ts",
    scaffoldSchema: "./src/lib/types.ts",
  },

  conversion: {
    primaryGoal: "Generate first schema",
    secondaryGoal: "Export scaffold",
    successEvents: [
      "schema_generated",
      "scaffold_exported",
      "nedb_engine_install_clicked",
      "github_repo_viewed",
      "python_snippet_copied",
      "node_snippet_copied",
    ],
  },

  seo: {
    enabled: true,
    primaryKeyword: "prompt to database scaffolding",
    titleTemplate: "%s | NEDB Studio",
    defaultDescription:
      "Describe an app in plain language and get a validated NEDB schema: collections, relations, indexes, seed data, NQL, plus Python and Node snippets.",
    sitemap: true,
    robots: true,
  },

  policies: {
    auth: "none",
    publishing: "human_review",
    accessibility: "strict",
    forbiddenClaims: [
      "guaranteed correct schema",
      "100% accurate",
      "zero bugs",
      "replaces a database engineer",
    ],
  },

  compliance: {
    requireHumanReviewFor: [
      "AiAssist provider or model defaults",
      "generated schema presented as production-ready",
      "performance or security claims about NEDB",
      "pricing or licensing statements",
    ],
  },

  integrations: {
    // AiAssist / AiAS is the ONLY AI gateway. No direct provider calls.
    aiassist: "required",
    nedbEngineNpm: "required",
    nedbEnginePypi: "required",
    github: "optional",
    itcAnchoring: "optional",
    analytics: "optional",
  },

  qualityGates: {
    maxBrokenLinks: 0,
    requireMetaTitle: true,
    requireMetaDescription: true,
    requireH1: true,
    requirePrimaryCTA: true,
    requireAltText: true,
    forbidPlaceholderCopy: true,
    forbidUnreplacedTokens: true,
  },

  pages: [
    {
      route: "/",
      purpose:
        "Land developers and agent builders, communicate prompt-to-database value, drive them into the studio",
      audience: "Developers and AI agent builders evaluating NEDB",
      primaryAction: "Generate Schema",
      seoKeyword: "prompt to database scaffolding",
    },
    {
      route: "/studio",
      purpose:
        "The workspace: describe an app, generate a validated NEDB scaffold, inspect the schema graph, export artifacts",
      audience: "Developers actively scaffolding a database",
      primaryAction: "Generate Schema",
      seoKeyword: "NEDB schema generator",
    },
    {
      route: "/about",
      purpose:
        "Explain the NEDB engine — replay-protected log, MVCC time-travel, relations, Cascade compression, Merkle roots — and why it matters for AI agents",
      audience: "Engineers evaluating the architecture",
      primaryAction: "Open the Studio",
      seoKeyword: "agent-native database architecture",
    },
    {
      route: "/docs",
      purpose:
        "Get developers running: install from npm and PyPI, use Python and Node, connect AiAssist, run mock mode, export a scaffold",
      audience: "Developers integrating NEDB",
      primaryAction: "Install nedb-engine",
      seoKeyword: "nedb-engine install docs",
    },
  ],
});

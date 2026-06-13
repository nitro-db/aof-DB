import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import cors from "cors";
import express from "express";

import { api } from "./src/server/generate";

/** Minimal .env loader (no dependency). Real env always wins. */
function loadEnv(): void {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnv();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/api", api);

const PORT = Number(process.env.PORT ?? 3001);

// In production the same server hosts the built Portal app + the API.
if (process.env.NODE_ENV === "production") {
  const dist = resolve(process.cwd(), "dist");
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(join(dist, "index.html")));
}

app.listen(PORT, () => {
  const mode = process.env.AIASSIST_API_KEY ? "live (AiAssist gateway)" : "mock (no credentials)";
  console.log(`NEDB Studio API listening on :${PORT} — ${mode}`);
});

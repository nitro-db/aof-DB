import { resolve } from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { portalPlugin } from "@interchained/portal-core/vite";

/**
 * Portal's `@portal/routes` virtual module emits relative specifiers
 * (`import Route0 from "./routes/index.page.tsx"`). On Vite 5.4.x those can't be
 * resolved from a `\0virtual:` importer, which throws:
 *   "Failed to resolve import './routes/index.page.tsx' from 'virtual:@portal/routes'".
 * This shim rewrites them to absolute paths — scoped strictly to that virtual module,
 * so it never touches normal app imports.
 */
function portalRouteResolver(): Plugin {
  let root = process.cwd();
  return {
    name: "portal-virtual-route-resolver",
    enforce: "pre",
    configResolved(config) {
      root = config.root;
    },
    resolveId(source, importer) {
      if (
        importer &&
        importer.includes("@portal/routes") &&
        (source.startsWith("./") || source.startsWith("../"))
      ) {
        return resolve(root, source);
      }
      return null;
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load .env so the dev proxy targets the SAME port the API server uses (PORT),
  // keeping web (:3000) and API in sync even when PORT is overridden.
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.STUDIO_API_URL || `http://localhost:${env.PORT || "3001"}`;

  return {
    plugins: [react(), portalPlugin(), portalRouteResolver()],
    server: {
      port: 3000,
      allowedHosts: true,
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
      },
    },
    resolve: {
      alias: { "@": "/src" },
    },
  };
});

/**
 * Maps the `@/*` import alias (tsconfig.json `paths`) for Vitest.
 *
 * A plain `resolve.alias` is used rather than `vite-tsconfig-paths`: that
 * plugin only applies `paths` to files included by tsconfig.json, and
 * tsconfig only includes `src/` (so `tsc` doesn't emit tests into dist/).
 * That left every `import ... from "@/..."` inside `test/` unresolved.
 *
 * This file uses the `.mts` extension so it is always loaded as ESM.
 */
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globals: true,
    // These tests hit a real Postgres database through Prisma, so they
    // must run one at a time to avoid racing each other on shared rows.
    fileParallelism: false,
  },
});

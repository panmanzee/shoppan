/**
 * `vite-tsconfig-paths` lets Vitest understand the `@/*` import alias
 * defined in tsconfig.json — without it, every `import ... from "@/..."`
 * in the test files (and anything they import) would fail to resolve.
 *
 * This file uses the `.mts` extension (not `.ts`) on purpose: package.json
 * has no `"type": "module"` field, so a plain `vitest.config.ts` is
 * ambiguous and Vite's config loader can bundle it as CommonJS, which
 * can't `require()` the ESM-only `vite-tsconfig-paths` package. `.mts` is
 * unambiguously ESM regardless of package.json, which fixes that.
 */
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // `root` is passed explicitly because on some setups (notably inside a
  // monorepo, or after a previous crashed run left a stale Vite cache)
  // the plugin can fail to auto-detect this package's tsconfig.json and
  // silently leaves "@/..." imports unresolved instead of erroring loudly.
  plugins: [tsconfigPaths({ root: "./" })],
  test: {
    environment: "node",
    globals: true,
    // These tests hit a real Postgres database through Prisma, so they
    // must run one at a time to avoid racing each other on shared rows.
    fileParallelism: false,
  },
});

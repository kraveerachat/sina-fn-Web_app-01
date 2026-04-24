import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Default ignored paths from eslint-config-next
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // ── Project-level rule overrides ──────────────────────────────────────────
  {
    rules: {
      // Allow _-prefixed params/vars as intentionally-unused (standard TS convention).
      // This covers stub functions, forward-declared params in interfaces, etc.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern:        "^_",
          varsIgnorePattern:        "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;

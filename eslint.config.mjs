import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Ban bare `new Date()` in src/ — use appNow()/appTodayISO() from dev-time.ts
  // so the dev panel time override works app-wide.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/lib/dev-time.ts",
      "src/**/__tests__/**",
      "src/app/api/**",          // Server-side routes use real time
      "src/store/**",            // Sync timestamps need real time
      "src/lib/sync.ts",         // Supabase sync uses real time
      "src/app/app/dev/page.tsx", // Dev panel has intentional fallback
    ],
    rules: {
      "no-restricted-syntax": [
        "warn",
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message:
            "Use appNow() or appTodayISO() from @/lib/dev-time instead of new Date(). This ensures the dev time override works.",
        },
      ],
    },
  },
]);

export default eslintConfig;

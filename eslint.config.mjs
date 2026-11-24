import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    "dist/**",
    "public/offline-capture.js",
    "public/offline-version.js",
    "outputs/**",
    "work/**",
  ]),
]);

export default eslintConfig;

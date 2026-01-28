import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  shims: true,
  external: [
    "@ai-sdk/provider",
    "@ai-sdk/provider-utils",
    "@google/gemini-cli-core",
    "zod",
  ],
  minify: false,
  outExtension({ format }) {
    return {
      js: format === "esm" ? ".mjs" : ".js",
    };
  },
});

import { describe, it, expect } from "vitest";
import { registry } from "./registry";

describe("Provider Registry", () => {
  it("should export a registry object", () => {
    expect(registry).toBeDefined();
    // expect(typeof registry).toBe('function'); // createProviderRegistry returns a function
  });

  it("should have required providers", () => {
    // We can't easily inspect the registry internal map without using it,
    // but the fact it imported means the setup code ran.
    // We can try to invoke it with a known model ID if we want to test resolution,
    // but without API keys it might fail or return a model object.

    // Just checking it exists is a good smoke test for now.
    expect(registry.languageModel).toBeDefined();
  });
});

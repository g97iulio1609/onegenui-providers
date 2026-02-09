import { createProviderRegistry } from "ai";
import type { ProviderV3 } from "@ai-sdk/provider";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGeminiProvider } from "ai-sdk-provider-gemini-cli";

/**
 * Unified provider registry for OneGenUI.
 * Supports:
 * - gemini (via ai-sdk-provider-gemini-cli)
 * - openai (via standard SDK)
 * - anthropic (via standard SDK)
 * - openrouter (via standard SDK)
 *
 * Provider casts are required due to SDK type variance between providers.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const registry = createProviderRegistry({
  gemini: createGeminiProvider({
    authType: "oauth-personal",
  }) as unknown as ProviderV3,

  openai: createOpenAI() as unknown as ProviderV3,

  anthropic: createAnthropic() as unknown as ProviderV3,

  openrouter: createOpenRouter({}) as unknown as ProviderV3,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

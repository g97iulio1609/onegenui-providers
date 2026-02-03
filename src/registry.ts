import { createProviderRegistry } from "ai";
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
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const registry: any = createProviderRegistry({
  // Gemini (Community CLI Provider - https://github.com/ben-vargas/ai-sdk-provider-gemini-cli)
  gemini: createGeminiProvider({
    authType: "oauth-personal",
  }) as any,

  // OpenAI
  openai: createOpenAI() as any,

  // Anthropic
  anthropic: createAnthropic() as any,

  // OpenRouter
  openrouter: createOpenRouter({
    name: "OneGenUI",
    extraBody: {
      "HTTP-Referer": "https://github.com/StartAD/OneGenUI",
      "X-Title": "OneGenUI",
    },
  } as any) as any,
});
/* eslint-enable @typescript-eslint/no-explicit-any */

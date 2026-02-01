import { createProviderRegistry } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGeminiProvider } from "./gemini-provider";

/**
 * Unified provider registry for OneGenUI.
 * Supports:
 * - gemini (via custom CLI provider)
 * - openai (via standard SDK)
 * - anthropic (via standard SDK)
 * - openrouter (via standard SDK)
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const registry: any = createProviderRegistry({
  // Gemini (Custom CLI Provider)
  gemini: createGeminiProvider() as any,

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

/**
 * Gemini finish reason mapping to AI SDK format
 */

import type { LanguageModelV3FinishReason } from "@ai-sdk/provider";

/**
 * Map Gemini finish reasons to Vercel AI SDK finish reasons.
 *
 * @param geminiReason - The finish reason from Gemini API
 * @returns The corresponding AI SDK finish reason with unified and raw values
 *
 * @remarks
 * Mappings:
 * - 'STOP' -> { unified: 'stop', raw: 'STOP' } (normal completion)
 * - 'MAX_TOKENS' -> { unified: 'length', raw: 'MAX_TOKENS' } (hit token limit)
 * - 'SAFETY'/'RECITATION' -> { unified: 'content-filter', raw } (content filtered)
 * - 'OTHER' -> { unified: 'other', raw: 'OTHER' } (other reason)
 * - undefined -> { unified: 'other', raw: undefined } (no reason provided)
 */
export function mapGeminiFinishReason(
  geminiReason?: string,
): LanguageModelV3FinishReason {
  switch (geminiReason) {
    case "STOP":
      return { unified: "stop", raw: geminiReason };
    case "MAX_TOKENS":
      return { unified: "length", raw: geminiReason };
    case "SAFETY":
    case "RECITATION":
      return { unified: "content-filter", raw: geminiReason };
    case "OTHER":
      return { unified: "other", raw: geminiReason };
    default:
      return { unified: "other", raw: geminiReason };
  }
}

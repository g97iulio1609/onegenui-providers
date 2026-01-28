/**
 * Generation config preparation for Gemini models
 */

import type {
  LanguageModelV3CallOptions,
  SharedV3Warning,
} from "@ai-sdk/provider";
import type { GenerateContentConfig } from "@google/genai";
import { mapGeminiToolConfig } from "../tool-mapper";
import {
  buildThinkingConfig,
  normalizeThinkingLevel,
  type ThinkingConfigInput,
} from "./thinking-config";

/**
 * Prepare generation config with proper handling for JSON mode and thinkingConfig.
 *
 * When JSON response format is requested WITHOUT a schema, we downgrade to
 * text/plain and emit a warning. This aligns with Claude-code provider behavior
 * and prevents raw fenced JSON from leaking to clients.
 *
 * When a schema IS provided, we use native responseJsonSchema for structured output.
 *
 * ThinkingConfig supports both Gemini 3 (thinkingLevel) and Gemini 2.5 (thinkingBudget).
 */
export function prepareGenerationConfig(
  options: LanguageModelV3CallOptions,
  settings?: Record<string, unknown>,
): {
  generationConfig: GenerateContentConfig;
  warnings: SharedV3Warning[];
} {
  const warnings: SharedV3Warning[] = [];

  // Extract schema if JSON mode with schema is requested
  const responseFormat = options.responseFormat;
  const isJsonMode = responseFormat?.type === "json";
  const schema = isJsonMode ? responseFormat.schema : undefined;
  const hasSchema = isJsonMode && schema !== undefined;

  // JSON without schema: downgrade to text/plain with warning
  if (isJsonMode && !hasSchema) {
    warnings.push({
      type: "unsupported",
      feature: "responseFormat",
      details:
        "JSON response format without a schema is not supported. Treating as plain text. Provide a schema for structured output.",
    });
  }

  // Handle thinkingConfig from options (call-time) and settings (model-level)
  const thinkingConfig = mergeThinkingConfig(settings, options);

  const generationConfig: GenerateContentConfig = {
    temperature:
      options.temperature ?? (settings?.temperature as number | undefined),
    topP: options.topP ?? (settings?.topP as number | undefined),
    topK: options.topK ?? (settings?.topK as number | undefined),
    maxOutputTokens:
      options.maxOutputTokens ??
      (settings?.maxOutputTokens as number | undefined),
    stopSequences: options.stopSequences,
    // Only use application/json when we have a schema to enforce it
    responseMimeType: hasSchema ? "application/json" : "text/plain",
    // Pass schema directly to Gemini API for native structured output
    responseJsonSchema: hasSchema ? schema : undefined,
    toolConfig: mapGeminiToolConfig(options),
    // Pass thinkingConfig for Gemini 3 (thinkingLevel) or Gemini 2.5 (thinkingBudget)
    thinkingConfig: thinkingConfig as GenerateContentConfig["thinkingConfig"],
  };

  return { generationConfig, warnings };
}

/**
 * Merge thinkingConfig from settings and call-time options.
 * Call-time options override settings per-field.
 * Invalid call-time thinkingLevel values fall back to settings.
 */
function mergeThinkingConfig(
  settings?: Record<string, unknown>,
  options?: LanguageModelV3CallOptions,
) {
  const settingsThinkingConfig = settings?.thinkingConfig as
    | ThinkingConfigInput
    | undefined;
  const optionsThinkingConfig = (options as Record<string, unknown> | undefined)
    ?.thinkingConfig as ThinkingConfigInput | undefined;

  // Validate call-time thinkingLevel before merging
  let effectiveOptionsThinking = optionsThinkingConfig;
  if (
    optionsThinkingConfig?.thinkingLevel !== undefined &&
    typeof optionsThinkingConfig.thinkingLevel === "string"
  ) {
    const normalized = normalizeThinkingLevel(
      optionsThinkingConfig.thinkingLevel,
    );
    if (normalized === undefined) {
      // Invalid thinkingLevel - remove it so settings value is preserved
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { thinkingLevel: _discarded, ...rest } = optionsThinkingConfig;
      effectiveOptionsThinking =
        Object.keys(rest).length > 0 ? rest : undefined;
    }
  }

  const mergedThinkingConfig =
    settingsThinkingConfig || effectiveOptionsThinking
      ? { ...settingsThinkingConfig, ...effectiveOptionsThinking }
      : undefined;

  return mergedThinkingConfig
    ? buildThinkingConfig(mergedThinkingConfig)
    : undefined;
}

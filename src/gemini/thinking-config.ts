/**
 * Thinking configuration for Gemini models
 */

import type { GenerateContentConfig } from "@google/genai";

/**
 * ThinkingLevel enum for Gemini 3 models.
 * Note: This is defined locally as @google/genai v1.30.0 doesn't export it yet.
 * Values match the official @google/genai v1.34.0 ThinkingLevel enum format.
 */
export enum ThinkingLevel {
  /** Minimizes latency and cost. Best for simple tasks. */
  LOW = "LOW",
  /** Balanced thinking for most tasks. (Gemini 3 Flash only) */
  MEDIUM = "MEDIUM",
  /** Maximizes reasoning depth. May take longer for first token. */
  HIGH = "HIGH",
  /** Matches "no thinking" for most queries. (Gemini 3 Flash only) */
  MINIMAL = "MINIMAL",
}

/**
 * Input interface for thinkingConfig settings.
 * Supports both Gemini 3 (thinkingLevel) and Gemini 2.5 (thinkingBudget) models.
 */
export interface ThinkingConfigInput {
  /**
   * Thinking level for Gemini 3 models (gemini-3-pro-preview, gemini-3-flash-preview).
   * Accepts case-insensitive strings ('high', 'HIGH', 'High') or ThinkingLevel enum.
   * Valid values: 'low', 'medium', 'high', 'minimal'
   */
  thinkingLevel?: string | ThinkingLevel;
  /**
   * Token budget for thinking in Gemini 2.5 models.
   * Common values: 0 (disabled), 512, 8192 (default), -1 (unlimited)
   */
  thinkingBudget?: number;
  /**
   * Whether to include thinking/reasoning in the response.
   */
  includeThoughts?: boolean;
}

/**
 * Extended ThinkingConfig type that includes thinkingLevel.
 */
export type ExtendedThinkingConfig = Omit<
  NonNullable<GenerateContentConfig["thinkingConfig"]>,
  "thinkingLevel"
> & {
  thinkingLevel?: ThinkingLevel;
};

/**
 * Normalize thinkingLevel string to ThinkingLevel enum (case-insensitive).
 * Returns undefined for invalid values.
 */
export function normalizeThinkingLevel(
  level: string,
): ThinkingLevel | undefined {
  const normalized = level.toUpperCase();
  switch (normalized) {
    case "LOW":
      return ThinkingLevel.LOW;
    case "MEDIUM":
      return ThinkingLevel.MEDIUM;
    case "HIGH":
      return ThinkingLevel.HIGH;
    case "MINIMAL":
      return ThinkingLevel.MINIMAL;
    default:
      return undefined;
  }
}

/**
 * Build thinkingConfig from user input, normalizing string thinkingLevel to enum.
 */
export function buildThinkingConfig(
  input: ThinkingConfigInput,
): ExtendedThinkingConfig {
  const config = {} as ExtendedThinkingConfig;

  // Handle thinkingLevel (string or enum)
  if (input.thinkingLevel !== undefined) {
    if (typeof input.thinkingLevel === "string") {
      const normalized = normalizeThinkingLevel(input.thinkingLevel);
      if (normalized !== undefined) {
        config.thinkingLevel = normalized;
      }
    } else {
      config.thinkingLevel = input.thinkingLevel;
    }
  }

  // Handle thinkingBudget (number)
  if (input.thinkingBudget !== undefined) {
    config.thinkingBudget = input.thinkingBudget;
  }

  // Handle includeThoughts (boolean)
  if (input.includeThoughts !== undefined) {
    config.includeThoughts = input.includeThoughts;
  }

  return config;
}

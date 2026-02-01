/**
 * Provider Cost Tracking
 * 
 * Tracks token usage and calculates costs for AI model providers.
 * Pricing data is based on public provider pricing as of 2026.
 * 
 * Note: Prices should be synced periodically with provider pricing pages.
 */

import { z } from "zod";

/**
 * Model pricing schema (per 1M tokens)
 */
export const ModelPricingSchema = z.object({
  /** Model identifier */
  modelId: z.string(),
  /** Provider name */
  provider: z.enum(["google", "openai", "anthropic", "openrouter"]),
  /** Input token price per 1M tokens (USD) */
  inputPricePerMillion: z.number().nonnegative(),
  /** Output token price per 1M tokens (USD) */
  outputPricePerMillion: z.number().nonnegative(),
  /** Optional cached input price per 1M tokens */
  cachedInputPricePerMillion: z.number().nonnegative().optional(),
  /** Last updated timestamp */
  updatedAt: z.date(),
});

export type ModelPricing = z.infer<typeof ModelPricingSchema>;

/**
 * Token usage for a single request
 */
export const TokenUsageSchema = z.object({
  /** Number of input/prompt tokens */
  inputTokens: z.number().int().nonnegative(),
  /** Number of output/completion tokens */
  outputTokens: z.number().int().nonnegative(),
  /** Optional cached input tokens */
  cachedInputTokens: z.number().int().nonnegative().optional(),
  /** Model identifier used */
  modelId: z.string(),
  /** Request timestamp */
  timestamp: z.date(),
});

export type TokenUsage = z.infer<typeof TokenUsageSchema>;

/**
 * Cost calculation result
 */
export interface CostCalculation {
  /** Total cost in USD */
  totalCost: number;
  /** Input cost in USD */
  inputCost: number;
  /** Output cost in USD */
  outputCost: number;
  /** Cached input cost in USD (if applicable) */
  cachedInputCost: number;
  /** Token usage details */
  usage: TokenUsage;
  /** Pricing used for calculation */
  pricing: ModelPricing;
}

/**
 * Default pricing for known models (per 1M tokens)
 * Updated: 2026-01
 * 
 * Note: These should be synced with actual provider pricing
 */
export const DEFAULT_MODEL_PRICING: Record<string, ModelPricing> = {
  // Google Gemini
  "gemini-2.0-flash-exp": {
    modelId: "gemini-2.0-flash-exp",
    provider: "google",
    inputPricePerMillion: 0.075,
    outputPricePerMillion: 0.30,
    cachedInputPricePerMillion: 0.01875,
    updatedAt: new Date("2026-01-01"),
  },
  "gemini-1.5-pro": {
    modelId: "gemini-1.5-pro",
    provider: "google",
    inputPricePerMillion: 1.25,
    outputPricePerMillion: 5.00,
    cachedInputPricePerMillion: 0.3125,
    updatedAt: new Date("2026-01-01"),
  },
  "gemini-1.5-flash": {
    modelId: "gemini-1.5-flash",
    provider: "google",
    inputPricePerMillion: 0.075,
    outputPricePerMillion: 0.30,
    cachedInputPricePerMillion: 0.01875,
    updatedAt: new Date("2026-01-01"),
  },
  
  // OpenAI
  "gpt-4o": {
    modelId: "gpt-4o",
    provider: "openai",
    inputPricePerMillion: 2.50,
    outputPricePerMillion: 10.00,
    cachedInputPricePerMillion: 1.25,
    updatedAt: new Date("2026-01-01"),
  },
  "gpt-4o-mini": {
    modelId: "gpt-4o-mini",
    provider: "openai",
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.60,
    cachedInputPricePerMillion: 0.075,
    updatedAt: new Date("2026-01-01"),
  },
  "o1": {
    modelId: "o1",
    provider: "openai",
    inputPricePerMillion: 15.00,
    outputPricePerMillion: 60.00,
    updatedAt: new Date("2026-01-01"),
  },
  "o1-mini": {
    modelId: "o1-mini",
    provider: "openai",
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 12.00,
    updatedAt: new Date("2026-01-01"),
  },
  
  // Anthropic
  "claude-3-5-sonnet": {
    modelId: "claude-3-5-sonnet",
    provider: "anthropic",
    inputPricePerMillion: 3.00,
    outputPricePerMillion: 15.00,
    cachedInputPricePerMillion: 0.30,
    updatedAt: new Date("2026-01-01"),
  },
  "claude-3-5-haiku": {
    modelId: "claude-3-5-haiku",
    provider: "anthropic",
    inputPricePerMillion: 0.80,
    outputPricePerMillion: 4.00,
    cachedInputPricePerMillion: 0.08,
    updatedAt: new Date("2026-01-01"),
  },
  "claude-3-opus": {
    modelId: "claude-3-opus",
    provider: "anthropic",
    inputPricePerMillion: 15.00,
    outputPricePerMillion: 75.00,
    cachedInputPricePerMillion: 1.50,
    updatedAt: new Date("2026-01-01"),
  },
};

/**
 * Calculate cost for a token usage
 */
export function calculateCost(
  usage: TokenUsage,
  pricing?: ModelPricing,
): CostCalculation {
  const modelPricing = pricing ?? getModelPricing(usage.modelId);
  
  if (!modelPricing) {
    throw new Error(`No pricing data for model: ${usage.modelId}`);
  }
  
  const inputCost = (usage.inputTokens / 1_000_000) * modelPricing.inputPricePerMillion;
  const outputCost = (usage.outputTokens / 1_000_000) * modelPricing.outputPricePerMillion;
  
  let cachedInputCost = 0;
  if (usage.cachedInputTokens && modelPricing.cachedInputPricePerMillion) {
    cachedInputCost =
      (usage.cachedInputTokens / 1_000_000) * modelPricing.cachedInputPricePerMillion;
  }
  
  return {
    totalCost: inputCost + outputCost + cachedInputCost,
    inputCost,
    outputCost,
    cachedInputCost,
    usage,
    pricing: modelPricing,
  };
}

/**
 * Get pricing for a model ID
 * Attempts to match model ID or model family
 */
export function getModelPricing(modelId: string): ModelPricing | null {
  // Exact match
  if (modelId in DEFAULT_MODEL_PRICING) {
    return DEFAULT_MODEL_PRICING[modelId];
  }
  
  // Try to find family match (e.g., "gpt-4o-2024-05-13" -> "gpt-4o")
  const modelIdLower = modelId.toLowerCase();
  for (const [key, pricing] of Object.entries(DEFAULT_MODEL_PRICING)) {
    if (modelIdLower.startsWith(key.toLowerCase())) {
      return pricing;
    }
  }
  
  return null;
}

/**
 * Accumulator for tracking costs across multiple requests
 */
export class CostTracker {
  private usages: CostCalculation[] = [];
  private customPricing: Map<string, ModelPricing> = new Map();
  
  /**
   * Add custom pricing for a model
   */
  addPricing(pricing: ModelPricing): void {
    this.customPricing.set(pricing.modelId, pricing);
  }
  
  /**
   * Track a request's token usage
   */
  track(usage: TokenUsage): CostCalculation {
    const pricing = this.customPricing.get(usage.modelId) ?? getModelPricing(usage.modelId);
    const calculation = calculateCost(usage, pricing ?? undefined);
    this.usages.push(calculation);
    return calculation;
  }
  
  /**
   * Get total cost across all tracked usages
   */
  getTotalCost(): number {
    return this.usages.reduce((sum, calc) => sum + calc.totalCost, 0);
  }
  
  /**
   * Get breakdown by provider
   */
  getCostByProvider(): Record<string, number> {
    const byProvider: Record<string, number> = {};
    for (const calc of this.usages) {
      const provider = calc.pricing.provider;
      byProvider[provider] = (byProvider[provider] ?? 0) + calc.totalCost;
    }
    return byProvider;
  }
  
  /**
   * Get breakdown by model
   */
  getCostByModel(): Record<string, number> {
    const byModel: Record<string, number> = {};
    for (const calc of this.usages) {
      const model = calc.pricing.modelId;
      byModel[model] = (byModel[model] ?? 0) + calc.totalCost;
    }
    return byModel;
  }
  
  /**
   * Get all tracked usages
   */
  getUsages(): CostCalculation[] {
    return [...this.usages];
  }
  
  /**
   * Reset the tracker
   */
  reset(): void {
    this.usages = [];
  }
  
  /**
   * Get summary statistics
   */
  getSummary(): {
    totalCost: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    requestCount: number;
  } {
    return {
      totalCost: this.getTotalCost(),
      totalInputTokens: this.usages.reduce((sum, c) => sum + c.usage.inputTokens, 0),
      totalOutputTokens: this.usages.reduce((sum, c) => sum + c.usage.outputTokens, 0),
      requestCount: this.usages.length,
    };
  }
}

/**
 * Format cost as currency string
 */
export function formatCost(cost: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(cost);
}

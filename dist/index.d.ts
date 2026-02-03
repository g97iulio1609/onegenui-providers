export { createGeminiProvider } from 'ai-sdk-provider-gemini-cli';
import { LanguageModel } from 'ai';
import { z } from 'zod';
export { LanguageModelV3, LanguageModelV3CallOptions, LanguageModelV3Content, LanguageModelV3FinishReason, LanguageModelV3FunctionTool, LanguageModelV3StreamPart, LanguageModelV3ToolCall, LanguageModelV3Usage, ProviderV3, SharedV3Warning } from '@ai-sdk/provider';

/**
 * Unified provider registry for OneGenUI.
 * Supports:
 * - gemini (via ai-sdk-provider-gemini-cli)
 * - openai (via standard SDK)
 * - anthropic (via standard SDK)
 * - openrouter (via standard SDK)
 */
declare const registry: any;

/**
 * Model Configuration Domain
 * Single source of truth for AI model configuration types and defaults
 */

declare const TaskTypeSchema: z.ZodEnum<{
    general: "general";
    deepresearch: "deepresearch";
    complex: "complex";
    vectorless: "vectorless";
    canvas: "canvas";
    vision: "vision";
}>;
type TaskType = z.infer<typeof TaskTypeSchema>;
declare const TASK_TYPES: TaskType[];
declare const ProviderSchema: z.ZodEnum<{
    gemini: "gemini";
    openai: "openai";
    anthropic: "anthropic";
    openrouter: "openrouter";
}>;
type Provider = z.infer<typeof ProviderSchema>;
declare const ModelConfigSchema: z.ZodObject<{
    modelId: z.ZodString;
    provider: z.ZodEnum<{
        gemini: "gemini";
        openai: "openai";
        anthropic: "anthropic";
        openrouter: "openrouter";
    }>;
    maxTokens: z.ZodDefault<z.ZodNumber>;
    temperature: z.ZodOptional<z.ZodNumber>;
}, z.core.$strip>;
type ModelConfig = z.infer<typeof ModelConfigSchema>;
declare const ModelConfigRecordSchema: z.ZodObject<{
    modelId: z.ZodString;
    provider: z.ZodEnum<{
        gemini: "gemini";
        openai: "openai";
        anthropic: "anthropic";
        openrouter: "openrouter";
    }>;
    maxTokens: z.ZodDefault<z.ZodNumber>;
    temperature: z.ZodOptional<z.ZodNumber>;
    id: z.ZodString;
    taskType: z.ZodEnum<{
        general: "general";
        deepresearch: "deepresearch";
        complex: "complex";
        vectorless: "vectorless";
        canvas: "canvas";
        vision: "vision";
    }>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
type ModelConfigRecord = z.infer<typeof ModelConfigRecordSchema>;
interface SupportedModel {
    provider: Provider;
    label: string;
    maxTokens: number;
}
declare const SUPPORTED_MODELS: Record<string, SupportedModel>;
type SupportedModelId = keyof typeof SUPPORTED_MODELS;
declare const DEFAULT_CONFIGS: Record<TaskType, ModelConfig>;

/**
 * Model Configuration Port
 * Interface for storing/retrieving AI model configurations
 * Follows Dependency Inversion Principle - core doesn't depend on infrastructure
 */

interface ModelConfigPort {
    /**
     * Get configuration for a specific task type
     * Falls back to "general" if not found, then to hardcoded defaults
     */
    getForTask(taskType: TaskType): Promise<ModelConfig>;
    /**
     * Get all configurations (for admin UI)
     */
    getAll(): Promise<ModelConfigRecord[]>;
    /**
     * Update a configuration by ID
     */
    update(id: string, data: Partial<ModelConfig>): Promise<ModelConfigRecord>;
    /**
     * Create a new configuration
     */
    create(data: Omit<ModelConfigRecord, "id" | "createdAt" | "updatedAt">): Promise<ModelConfigRecord>;
    /**
     * Delete a configuration by ID
     */
    delete(id: string): Promise<void>;
    /**
     * Invalidate any cached configurations
     */
    invalidateCache(): void;
}

/**
 * AI Model Use Case
 * Business logic for creating and managing AI models
 * Single Responsibility: orchestrates config retrieval and model creation
 */

/**
 * Inject a custom config adapter (e.g., Prisma adapter from dashboard)
 * Call this once at app startup
 */
declare function setConfigAdapter(adapter: ModelConfigPort): void;
/**
 * Get the current config adapter
 */
declare function getConfigAdapter(): ModelConfigPort;
/**
 * Create a language model instance for a specific task
 * Uses the registry to instantiate the correct provider
 */
declare function createModelForTask(taskType: TaskType): Promise<LanguageModel>;
/**
 * Create a language model instance from a config
 */
declare function createModelFromConfig(config: ModelConfig): LanguageModel;
/**
 * Get model configuration for a task (without creating the model)
 */
declare function getModelConfig(taskType: TaskType): Promise<ModelConfig>;
declare function getAllConfigs(): Promise<ModelConfigRecord[]>;
declare function updateConfig(id: string, data: Partial<ModelConfig>): Promise<ModelConfigRecord>;
declare function createConfig(data: Omit<ModelConfigRecord, "id" | "createdAt" | "updatedAt">): Promise<ModelConfigRecord>;
declare function deleteConfig(id: string): Promise<void>;
declare function invalidateCache(): void;

/**
 * Provider Cost Tracking
 *
 * Tracks token usage and calculates costs for AI model providers.
 * Pricing data is based on public provider pricing as of 2026.
 *
 * Note: Prices should be synced periodically with provider pricing pages.
 */

/**
 * Model pricing schema (per 1M tokens)
 */
declare const ModelPricingSchema: z.ZodObject<{
    modelId: z.ZodString;
    provider: z.ZodEnum<{
        openai: "openai";
        anthropic: "anthropic";
        openrouter: "openrouter";
        google: "google";
    }>;
    inputPricePerMillion: z.ZodNumber;
    outputPricePerMillion: z.ZodNumber;
    cachedInputPricePerMillion: z.ZodOptional<z.ZodNumber>;
    updatedAt: z.ZodDate;
}, z.core.$strip>;
type ModelPricing = z.infer<typeof ModelPricingSchema>;
/**
 * Token usage for a single request
 */
declare const TokenUsageSchema: z.ZodObject<{
    inputTokens: z.ZodNumber;
    outputTokens: z.ZodNumber;
    cachedInputTokens: z.ZodOptional<z.ZodNumber>;
    modelId: z.ZodString;
    timestamp: z.ZodDate;
}, z.core.$strip>;
type TokenUsage = z.infer<typeof TokenUsageSchema>;
/**
 * Cost calculation result
 */
interface CostCalculation {
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
declare const DEFAULT_MODEL_PRICING: Record<string, ModelPricing>;
/**
 * Calculate cost for a token usage
 */
declare function calculateCost(usage: TokenUsage, pricing?: ModelPricing): CostCalculation;
/**
 * Get pricing for a model ID
 * Attempts to match model ID or model family
 */
declare function getModelPricing(modelId: string): ModelPricing | null;
/**
 * Accumulator for tracking costs across multiple requests
 */
declare class CostTracker {
    private usages;
    private customPricing;
    /**
     * Add custom pricing for a model
     */
    addPricing(pricing: ModelPricing): void;
    /**
     * Track a request's token usage
     */
    track(usage: TokenUsage): CostCalculation;
    /**
     * Get total cost across all tracked usages
     */
    getTotalCost(): number;
    /**
     * Get breakdown by provider
     */
    getCostByProvider(): Record<string, number>;
    /**
     * Get breakdown by model
     */
    getCostByModel(): Record<string, number>;
    /**
     * Get all tracked usages
     */
    getUsages(): CostCalculation[];
    /**
     * Reset the tracker
     */
    reset(): void;
    /**
     * Get summary statistics
     */
    getSummary(): {
        totalCost: number;
        totalInputTokens: number;
        totalOutputTokens: number;
        requestCount: number;
    };
}
/**
 * Format cost as currency string
 */
declare function formatCost(cost: number, currency?: string): string;

/**
 * Memory Config Adapter
 * In-memory implementation of ModelConfigPort using hardcoded defaults
 * Used when no database is available (standalone packages)
 */

declare class MemoryConfigAdapter implements ModelConfigPort {
    private configs;
    constructor();
    private initDefaults;
    getForTask(taskType: TaskType): Promise<ModelConfig>;
    getAll(): Promise<ModelConfigRecord[]>;
    update(id: string, data: Partial<ModelConfig>): Promise<ModelConfigRecord>;
    create(data: Omit<ModelConfigRecord, "id" | "createdAt" | "updatedAt">): Promise<ModelConfigRecord>;
    delete(id: string): Promise<void>;
    invalidateCache(): void;
}

export { type CostCalculation, CostTracker, DEFAULT_CONFIGS, DEFAULT_MODEL_PRICING, MemoryConfigAdapter, type ModelConfig, type ModelConfigPort, type ModelConfigRecord, ModelConfigRecordSchema, ModelConfigSchema, type ModelPricing, ModelPricingSchema, type Provider, ProviderSchema, SUPPORTED_MODELS, type SupportedModel, type SupportedModelId, TASK_TYPES, type TaskType, TaskTypeSchema, type TokenUsage, TokenUsageSchema, calculateCost, createConfig, createModelForTask, createModelFromConfig, deleteConfig, formatCost, getAllConfigs, getConfigAdapter, getModelConfig, getModelPricing, invalidateCache, registry, setConfigAdapter, updateConfig };

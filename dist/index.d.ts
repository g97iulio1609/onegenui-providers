import { ProviderV3, LanguageModelV3, EmbeddingModelV3, ImageModelV3 } from '@ai-sdk/provider';
export { LanguageModelV3, LanguageModelV3CallOptions, LanguageModelV3Content, LanguageModelV3FinishReason, LanguageModelV3FunctionTool, LanguageModelV3StreamPart, LanguageModelV3ToolCall, LanguageModelV3Usage, ProviderV3, SharedV3Warning } from '@ai-sdk/provider';
import { GoogleAuth } from 'google-auth-library';
import { LanguageModel } from 'ai';
import { z } from 'zod';

/**
 * Unified provider registry for OneGenUI.
 * Supports:
 * - gemini (via custom CLI provider)
 * - openai (via standard SDK)
 * - anthropic (via standard SDK)
 * - openrouter (via standard SDK)
 */
declare const registry: any;

/**
 * Base options available for all authentication types
 */
interface BaseProviderOptions {
    /**
     * HTTP proxy URL to use for requests
     * Can also be set via HTTP_PROXY or HTTPS_PROXY environment variables
     */
    proxy?: string;
}
/**
 * Provider options for configuring Gemini authentication and behavior
 */
type GeminiProviderOptions = (GeminiApiKeyAuth & BaseProviderOptions) | (VertexAIAuth & BaseProviderOptions) | (OAuthAuth & BaseProviderOptions) | (GoogleAuthLibraryAuth & BaseProviderOptions) | ({
    authType?: undefined;
} & BaseProviderOptions);
/**
 * Gemini API key authentication (supports both AI SDK standard and Gemini-specific auth types)
 */
interface GeminiApiKeyAuth {
    authType: "api-key" | "gemini-api-key";
    apiKey?: string;
}
/**
 * Vertex AI authentication
 */
interface VertexAIAuth {
    authType: "vertex-ai";
    vertexAI: {
        projectId: string;
        location: string;
        apiKey?: string;
    };
}
/**
 * OAuth authentication (personal or service account)
 */
interface OAuthAuth {
    authType: "oauth" | "oauth-personal";
    cacheDir?: string;
}
/**
 * Google Auth Library authentication
 */
interface GoogleAuthLibraryAuth {
    authType: "google-auth-library";
    googleAuth?: GoogleAuth;
}
/**
 * Logger interface for provider diagnostics and debugging.
 *
 * Supports four log levels:
 * - `debug`: Detailed execution tracing (request/response, tool calls, stream events)
 * - `info`: General execution flow information (session initialization, completion)
 * - `warn`: Warnings about configuration issues or unexpected behavior
 * - `error`: Error messages for failures and exceptions
 *
 * When implementing a custom logger, all four methods must be provided.
 *
 * @example
 * ```typescript
 * const customLogger: Logger = {
 *   debug: (msg) => myLogger.debug(msg),
 *   info: (msg) => myLogger.info(msg),
 *   warn: (msg) => myLogger.warn(msg),
 *   error: (msg) => myLogger.error(msg),
 * };
 * ```
 */
interface Logger {
    /**
     * Log detailed execution tracing (only shown when verbose mode is enabled).
     * Used for request/response details, tool calls, stream events, and token usage.
     */
    debug(message: string): void;
    /**
     * Log general execution flow information (only shown when verbose mode is enabled).
     * Used for session initialization, request completion, and major state transitions.
     */
    info(message: string): void;
    /**
     * Log warnings about configuration issues or unexpected behavior.
     * Always shown regardless of verbose mode setting.
     */
    warn(message: string): void;
    /**
     * Log error messages for failures and exceptions.
     * Always shown regardless of verbose mode setting.
     */
    error(message: string): void;
}

interface GeminiProvider extends ProviderV3 {
    (modelId: string, settings?: Record<string, unknown>): LanguageModelV3;
    languageModel(modelId: string, settings?: Record<string, unknown>): LanguageModelV3;
    chat(modelId: string, settings?: Record<string, unknown>): LanguageModelV3;
    embeddingModel(modelId: string): EmbeddingModelV3;
    imageModel(modelId: string): ImageModelV3;
}
/**
 * Creates a new Gemini provider instance.
 *
 * @param options - Configuration options for the provider
 * @returns A configured provider function
 * @throws Error if authentication options are invalid
 *
 * @example
 * ```typescript
 * // Using API key authentication
 * const gemini = createGeminiProvider({
 *   authType: 'gemini-api-key',
 *   apiKey: process.env.GEMINI_API_KEY
 * });
 *
 * // Use with Vercel AI SDK
 * const model = gemini('gemini-1.5-flash');
 * const result = await generateText({
 *   model,
 *   prompt: 'Hello, world!'
 * });
 * ```
 */
declare function createGeminiProvider(options?: GeminiProviderOptions): GeminiProvider;

/**
 * Thinking configuration for Gemini models
 */

/**
 * ThinkingLevel enum for Gemini 3 models.
 * Note: This is defined locally as @google/genai v1.30.0 doesn't export it yet.
 * Values match the official @google/genai v1.34.0 ThinkingLevel enum format.
 */
declare enum ThinkingLevel {
    /** Minimizes latency and cost. Best for simple tasks. */
    LOW = "LOW",
    /** Balanced thinking for most tasks. (Gemini 3 Flash only) */
    MEDIUM = "MEDIUM",
    /** Maximizes reasoning depth. May take longer for first token. */
    HIGH = "HIGH",
    /** Matches "no thinking" for most queries. (Gemini 3 Flash only) */
    MINIMAL = "MINIMAL"
}
/**
 * Input interface for thinkingConfig settings.
 * Supports both Gemini 3 (thinkingLevel) and Gemini 2.5 (thinkingBudget) models.
 */
interface ThinkingConfigInput {
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

export { type CostCalculation, CostTracker, DEFAULT_CONFIGS, DEFAULT_MODEL_PRICING, type GeminiProvider, type GeminiProviderOptions, type Logger, MemoryConfigAdapter, type ModelConfig, type ModelConfigPort, type ModelConfigRecord, ModelConfigRecordSchema, ModelConfigSchema, type ModelPricing, ModelPricingSchema, type Provider, ProviderSchema, SUPPORTED_MODELS, type SupportedModel, type SupportedModelId, TASK_TYPES, type TaskType, TaskTypeSchema, type ThinkingConfigInput, ThinkingLevel, type TokenUsage, TokenUsageSchema, calculateCost, createConfig, createGeminiProvider, createModelForTask, createModelFromConfig, deleteConfig, formatCost, getAllConfigs, getConfigAdapter, getModelConfig, getModelPricing, invalidateCache, registry, setConfigAdapter, updateConfig };

// ─────────────────────────────────────────────────────────────────────────────
// Provider Registry
// ─────────────────────────────────────────────────────────────────────────────

export { registry } from "./registry";
// Re-export createGeminiProvider from community package for convenience
export { createGeminiProvider } from "ai-sdk-provider-gemini-cli";

// ─────────────────────────────────────────────────────────────────────────────
// AI Model Use Case (centralized model management)
// ─────────────────────────────────────────────────────────────────────────────

export {
  // Model creation
  createModelForTask,
  createModelFromConfig,
  getModelConfig,
  // Admin operations
  getAllConfigs,
  updateConfig,
  createConfig,
  deleteConfig,
  invalidateCache,
  // Adapter injection
  setConfigAdapter,
  getConfigAdapter,
  // Constants
  DEFAULT_CONFIGS,
  SUPPORTED_MODELS,
  TASK_TYPES,
} from "./use-cases/ai-model.use-case";

// ─────────────────────────────────────────────────────────────────────────────
// Domain Types & Schemas
// ─────────────────────────────────────────────────────────────────────────────

export type {
  TaskType,
  ModelConfig,
  ModelConfigRecord,
  Provider,
  SupportedModel,
  SupportedModelId,
} from "./domain/model-config.schema";

export {
  TaskTypeSchema,
  ProviderSchema,
  ModelConfigSchema,
  ModelConfigRecordSchema,
} from "./domain/model-config.schema";

// Cost Tracking
export {
  ModelPricingSchema,
  TokenUsageSchema,
  calculateCost,
  getModelPricing,
  formatCost,
  CostTracker,
  DEFAULT_MODEL_PRICING,
  type ModelPricing,
  type TokenUsage,
  type CostCalculation,
} from "./domain/cost-tracking";

// ─────────────────────────────────────────────────────────────────────────────
// Ports (for implementing custom adapters)
// ─────────────────────────────────────────────────────────────────────────────

export type { ModelConfigPort } from "./ports/model-config.port";

// ─────────────────────────────────────────────────────────────────────────────
// Adapters
// ─────────────────────────────────────────────────────────────────────────────

export { MemoryConfigAdapter } from "./adapters/memory-config.adapter";

// ─────────────────────────────────────────────────────────────────────────────
// Provider Types (re-export from AI SDK)
// ─────────────────────────────────────────────────────────────────────────────

export type {
  LanguageModelV3,
  LanguageModelV3FunctionTool,
  LanguageModelV3ToolCall,
  LanguageModelV3FinishReason,
  LanguageModelV3CallOptions,
  SharedV3Warning,
  LanguageModelV3StreamPart,
  LanguageModelV3Content,
  LanguageModelV3Usage,
  ProviderV3,
} from "@ai-sdk/provider";



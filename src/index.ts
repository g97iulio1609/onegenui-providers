// ─────────────────────────────────────────────────────────────────────────────
// Provider Registry
// ─────────────────────────────────────────────────────────────────────────────

export { registry } from "./registry";
export { createGeminiProvider } from "./gemini-provider";
export { ThinkingLevel } from "./gemini-language-model";

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

export type { GeminiProvider } from "./gemini-provider";
export type { GeminiProviderOptions, Logger } from "./types";
export type { ThinkingConfigInput } from "./gemini-language-model";

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


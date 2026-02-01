/**
 * Model Configuration Domain
 * Single source of truth for AI model configuration types and defaults
 */
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Task Types - what the model will be used for
// ─────────────────────────────────────────────────────────────────────────────

export const TaskTypeSchema = z.enum([
  "general",
  "deepresearch", 
  "complex",
  "vectorless",
  "canvas",
  "vision",
]);
export type TaskType = z.infer<typeof TaskTypeSchema>;

export const TASK_TYPES: TaskType[] = TaskTypeSchema.options;

// ─────────────────────────────────────────────────────────────────────────────
// Provider Types
// ─────────────────────────────────────────────────────────────────────────────

export const ProviderSchema = z.enum(["gemini", "openai", "anthropic", "openrouter"]);
export type Provider = z.infer<typeof ProviderSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Model Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const ModelConfigSchema = z.object({
  modelId: z.string(),
  provider: ProviderSchema,
  maxTokens: z.number().default(65000),
  temperature: z.number().min(0).max(2).optional(),
});
export type ModelConfig = z.infer<typeof ModelConfigSchema>;

export const ModelConfigRecordSchema = ModelConfigSchema.extend({
  id: z.string(),
  taskType: TaskTypeSchema,
  enabled: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type ModelConfigRecord = z.infer<typeof ModelConfigRecordSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Supported Models Registry
// ─────────────────────────────────────────────────────────────────────────────

export interface SupportedModel {
  provider: Provider;
  label: string;
  maxTokens: number;
}

export const SUPPORTED_MODELS: Record<string, SupportedModel> = {
  // Google Gemini
  "gemini-3-flash-preview": {
    provider: "gemini",
    label: "Gemini 3 Flash",
    maxTokens: 65000,
  },
  "gemini-3-pro-preview": {
    provider: "gemini",
    label: "Gemini 3 Pro",
    maxTokens: 65000,
  },
  // OpenAI
  "gpt-5.2": {
    provider: "openai",
    label: "GPT-5.2",
    maxTokens: 128000,
  },
  "gpt-4.1": {
    provider: "openai",
    label: "GPT-4.1",
    maxTokens: 128000,
  },
  // Anthropic Claude 4.5
  "claude-haiku-4.5": {
    provider: "anthropic",
    label: "Claude 4.5 Haiku",
    maxTokens: 200000,
  },
  "claude-sonnet-4.5": {
    provider: "anthropic",
    label: "Claude 4.5 Sonnet",
    maxTokens: 200000,
  },
  "claude-opus-4.5": {
    provider: "anthropic",
    label: "Claude 4.5 Opus",
    maxTokens: 200000,
  },
};

export type SupportedModelId = keyof typeof SUPPORTED_MODELS;

// ─────────────────────────────────────────────────────────────────────────────
// Default Configurations per Task
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_MAX_TOKENS = 65000;

export const DEFAULT_CONFIGS: Record<TaskType, ModelConfig> = {
  general: { modelId: "gemini-3-flash-preview", provider: "gemini", maxTokens: DEFAULT_MAX_TOKENS },
  deepresearch: { modelId: "gemini-3-flash-preview", provider: "gemini", maxTokens: DEFAULT_MAX_TOKENS },
  complex: { modelId: "gemini-3-pro-preview", provider: "gemini", maxTokens: DEFAULT_MAX_TOKENS },
  vectorless: { modelId: "gemini-3-flash-preview", provider: "gemini", maxTokens: DEFAULT_MAX_TOKENS },
  canvas: { modelId: "gemini-3-flash-preview", provider: "gemini", maxTokens: DEFAULT_MAX_TOKENS },
  vision: { modelId: "gemini-3-flash-preview", provider: "gemini", maxTokens: DEFAULT_MAX_TOKENS },
};

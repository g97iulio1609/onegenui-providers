/**
 * AI Model Use Case
 * Business logic for creating and managing AI models
 * Single Responsibility: orchestrates config retrieval and model creation
 */
import type { LanguageModel } from "ai";
import type { ModelConfigPort } from "../ports/model-config.port";
import type { TaskType, ModelConfig, ModelConfigRecord } from "../domain/model-config.schema";
import { DEFAULT_CONFIGS, SUPPORTED_MODELS, TASK_TYPES } from "../domain/model-config.schema";
import { registry } from "../registry";
import { MemoryConfigAdapter } from "../adapters/memory-config.adapter";

// ─────────────────────────────────────────────────────────────────────────────
// Singleton adapter with injection support
// ─────────────────────────────────────────────────────────────────────────────

let configAdapter: ModelConfigPort = new MemoryConfigAdapter();

/**
 * Inject a custom config adapter (e.g., Prisma adapter from dashboard)
 * Call this once at app startup
 */
export function setConfigAdapter(adapter: ModelConfigPort): void {
  configAdapter = adapter;
}

/**
 * Get the current config adapter
 */
export function getConfigAdapter(): ModelConfigPort {
  return configAdapter;
}

// ─────────────────────────────────────────────────────────────────────────────
// Model Creation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a language model instance for a specific task
 * Uses the registry to instantiate the correct provider
 */
export async function createModelForTask(taskType: TaskType): Promise<LanguageModel> {
  const config = await configAdapter.getForTask(taskType);
  return createModelFromConfig(config);
}

/**
 * Create a language model instance from a config
 */
export function createModelFromConfig(config: ModelConfig): LanguageModel {
  const { provider, modelId } = config;
  // Registry uses "provider:modelId" format
  return registry.languageModel(`${provider}:${modelId}`);
}

/**
 * Get model configuration for a task (without creating the model)
 */
export async function getModelConfig(taskType: TaskType): Promise<ModelConfig> {
  return configAdapter.getForTask(taskType);
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin Operations (passthrough to adapter)
// ─────────────────────────────────────────────────────────────────────────────

export async function getAllConfigs(): Promise<ModelConfigRecord[]> {
  return configAdapter.getAll();
}

export async function updateConfig(
  id: string,
  data: Partial<ModelConfig>,
): Promise<ModelConfigRecord> {
  return configAdapter.update(id, data);
}

export async function createConfig(
  data: Omit<ModelConfigRecord, "id" | "createdAt" | "updatedAt">,
): Promise<ModelConfigRecord> {
  return configAdapter.create(data);
}

export async function deleteConfig(id: string): Promise<void> {
  return configAdapter.delete(id);
}

export function invalidateCache(): void {
  configAdapter.invalidateCache();
}

// ─────────────────────────────────────────────────────────────────────────────
// Re-exports for convenience
// ─────────────────────────────────────────────────────────────────────────────

export { DEFAULT_CONFIGS, SUPPORTED_MODELS, TASK_TYPES };
export type { TaskType, ModelConfig, ModelConfigRecord };

/**
 * Memory Config Adapter
 * In-memory implementation of ModelConfigPort using hardcoded defaults
 * Used when no database is available (standalone packages)
 */
import type { ModelConfigPort } from "../ports/model-config.port";
import type { TaskType, ModelConfig, ModelConfigRecord } from "../domain/model-config.schema";
import { DEFAULT_CONFIGS } from "../domain/model-config.schema";

export class MemoryConfigAdapter implements ModelConfigPort {
  private configs: Map<string, ModelConfigRecord> = new Map();
  
  constructor() {
    this.initDefaults();
  }

  private initDefaults(): void {
    const now = new Date();
    Object.entries(DEFAULT_CONFIGS).forEach(([taskType, config]) => {
      const id = `default-${taskType}`;
      this.configs.set(id, {
        id,
        taskType: taskType as TaskType,
        ...config,
        enabled: true,
        createdAt: now,
        updatedAt: now,
      });
    });
  }

  async getForTask(taskType: TaskType): Promise<ModelConfig> {
    // Find config for this task
    for (const config of this.configs.values()) {
      if (config.taskType === taskType && config.enabled) {
        return {
          modelId: config.modelId,
          provider: config.provider,
          maxTokens: config.maxTokens,
          temperature: config.temperature,
        };
      }
    }
    
    // Fallback to general
    for (const config of this.configs.values()) {
      if (config.taskType === "general" && config.enabled) {
        return {
          modelId: config.modelId,
          provider: config.provider,
          maxTokens: config.maxTokens,
          temperature: config.temperature,
        };
      }
    }
    
    // Ultimate fallback
    return DEFAULT_CONFIGS.general;
  }

  async getAll(): Promise<ModelConfigRecord[]> {
    return Array.from(this.configs.values());
  }

  async update(id: string, data: Partial<ModelConfig>): Promise<ModelConfigRecord> {
    const existing = this.configs.get(id);
    if (!existing) {
      throw new Error(`Config not found: ${id}`);
    }
    
    const updated: ModelConfigRecord = {
      ...existing,
      ...data,
      updatedAt: new Date(),
    };
    this.configs.set(id, updated);
    return updated;
  }

  async create(data: Omit<ModelConfigRecord, "id" | "createdAt" | "updatedAt">): Promise<ModelConfigRecord> {
    const id = `custom-${Date.now()}`;
    const now = new Date();
    const record: ModelConfigRecord = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.configs.set(id, record);
    return record;
  }

  async delete(id: string): Promise<void> {
    this.configs.delete(id);
  }

  invalidateCache(): void {
    // No-op for memory adapter
  }
}

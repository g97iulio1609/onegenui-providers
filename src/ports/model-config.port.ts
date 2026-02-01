/**
 * Model Configuration Port
 * Interface for storing/retrieving AI model configurations
 * Follows Dependency Inversion Principle - core doesn't depend on infrastructure
 */
import type { TaskType, ModelConfig, ModelConfigRecord } from "../domain/model-config.schema";

export interface ModelConfigPort {
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

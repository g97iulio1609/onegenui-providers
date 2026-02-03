// src/registry.ts
import { createProviderRegistry } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createGeminiProvider } from "ai-sdk-provider-gemini-cli";
var registry = createProviderRegistry({
  // Gemini (Community CLI Provider - https://github.com/ben-vargas/ai-sdk-provider-gemini-cli)
  gemini: createGeminiProvider({
    authType: "oauth-personal"
  }),
  // OpenAI
  openai: createOpenAI(),
  // Anthropic
  anthropic: createAnthropic(),
  // OpenRouter
  openrouter: createOpenRouter({
    name: "OneGenUI",
    extraBody: {
      "HTTP-Referer": "https://github.com/StartAD/OneGenUI",
      "X-Title": "OneGenUI"
    }
  })
});

// src/index.ts
import { createGeminiProvider as createGeminiProvider2 } from "ai-sdk-provider-gemini-cli";

// src/domain/model-config.schema.ts
import { z } from "zod";
var TaskTypeSchema = z.enum([
  "general",
  "deepresearch",
  "complex",
  "vectorless",
  "canvas",
  "vision"
]);
var TASK_TYPES = TaskTypeSchema.options;
var ProviderSchema = z.enum(["gemini", "openai", "anthropic", "openrouter"]);
var ModelConfigSchema = z.object({
  modelId: z.string(),
  provider: ProviderSchema,
  maxTokens: z.number().default(65e3),
  temperature: z.number().min(0).max(2).optional()
});
var ModelConfigRecordSchema = ModelConfigSchema.extend({
  id: z.string(),
  taskType: TaskTypeSchema,
  enabled: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
});
var SUPPORTED_MODELS = {
  // Google Gemini
  "gemini-3-flash-preview": {
    provider: "gemini",
    label: "Gemini 3 Flash",
    maxTokens: 65e3
  },
  "gemini-3-pro-preview": {
    provider: "gemini",
    label: "Gemini 3 Pro",
    maxTokens: 65e3
  },
  // OpenAI
  "gpt-5.2": {
    provider: "openai",
    label: "GPT-5.2",
    maxTokens: 128e3
  },
  "gpt-4.1": {
    provider: "openai",
    label: "GPT-4.1",
    maxTokens: 128e3
  },
  // Anthropic Claude 4.5
  "claude-haiku-4.5": {
    provider: "anthropic",
    label: "Claude 4.5 Haiku",
    maxTokens: 2e5
  },
  "claude-sonnet-4.5": {
    provider: "anthropic",
    label: "Claude 4.5 Sonnet",
    maxTokens: 2e5
  },
  "claude-opus-4.5": {
    provider: "anthropic",
    label: "Claude 4.5 Opus",
    maxTokens: 2e5
  }
};
var DEFAULT_MAX_TOKENS = 65e3;
var DEFAULT_CONFIGS = {
  general: { modelId: "gemini-3-flash-preview", provider: "gemini", maxTokens: DEFAULT_MAX_TOKENS },
  deepresearch: { modelId: "gemini-3-flash-preview", provider: "gemini", maxTokens: DEFAULT_MAX_TOKENS },
  complex: { modelId: "gemini-3-pro-preview", provider: "gemini", maxTokens: DEFAULT_MAX_TOKENS },
  vectorless: { modelId: "gemini-3-flash-preview", provider: "gemini", maxTokens: DEFAULT_MAX_TOKENS },
  canvas: { modelId: "gemini-3-flash-preview", provider: "gemini", maxTokens: DEFAULT_MAX_TOKENS },
  vision: { modelId: "gemini-3-flash-preview", provider: "gemini", maxTokens: DEFAULT_MAX_TOKENS }
};

// src/adapters/memory-config.adapter.ts
var MemoryConfigAdapter = class {
  constructor() {
    this.configs = /* @__PURE__ */ new Map();
    this.initDefaults();
  }
  initDefaults() {
    const now = /* @__PURE__ */ new Date();
    Object.entries(DEFAULT_CONFIGS).forEach(([taskType, config]) => {
      const id = `default-${taskType}`;
      this.configs.set(id, {
        id,
        taskType,
        ...config,
        enabled: true,
        createdAt: now,
        updatedAt: now
      });
    });
  }
  async getForTask(taskType) {
    for (const config of this.configs.values()) {
      if (config.taskType === taskType && config.enabled) {
        return {
          modelId: config.modelId,
          provider: config.provider,
          maxTokens: config.maxTokens,
          temperature: config.temperature
        };
      }
    }
    for (const config of this.configs.values()) {
      if (config.taskType === "general" && config.enabled) {
        return {
          modelId: config.modelId,
          provider: config.provider,
          maxTokens: config.maxTokens,
          temperature: config.temperature
        };
      }
    }
    return DEFAULT_CONFIGS.general;
  }
  async getAll() {
    return Array.from(this.configs.values());
  }
  async update(id, data) {
    const existing = this.configs.get(id);
    if (!existing) {
      throw new Error(`Config not found: ${id}`);
    }
    const updated = {
      ...existing,
      ...data,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.configs.set(id, updated);
    return updated;
  }
  async create(data) {
    const id = `custom-${Date.now()}`;
    const now = /* @__PURE__ */ new Date();
    const record = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.configs.set(id, record);
    return record;
  }
  async delete(id) {
    this.configs.delete(id);
  }
  invalidateCache() {
  }
};

// src/use-cases/ai-model.use-case.ts
var configAdapter = new MemoryConfigAdapter();
function setConfigAdapter(adapter) {
  configAdapter = adapter;
}
function getConfigAdapter() {
  return configAdapter;
}
async function createModelForTask(taskType) {
  const config = await configAdapter.getForTask(taskType);
  return createModelFromConfig(config);
}
function createModelFromConfig(config) {
  const { provider, modelId } = config;
  return registry.languageModel(`${provider}:${modelId}`);
}
async function getModelConfig(taskType) {
  return configAdapter.getForTask(taskType);
}
async function getAllConfigs() {
  return configAdapter.getAll();
}
async function updateConfig(id, data) {
  return configAdapter.update(id, data);
}
async function createConfig(data) {
  return configAdapter.create(data);
}
async function deleteConfig(id) {
  return configAdapter.delete(id);
}
function invalidateCache() {
  configAdapter.invalidateCache();
}

// src/domain/cost-tracking.ts
import { z as z2 } from "zod";
var ModelPricingSchema = z2.object({
  /** Model identifier */
  modelId: z2.string(),
  /** Provider name */
  provider: z2.enum(["google", "openai", "anthropic", "openrouter"]),
  /** Input token price per 1M tokens (USD) */
  inputPricePerMillion: z2.number().nonnegative(),
  /** Output token price per 1M tokens (USD) */
  outputPricePerMillion: z2.number().nonnegative(),
  /** Optional cached input price per 1M tokens */
  cachedInputPricePerMillion: z2.number().nonnegative().optional(),
  /** Last updated timestamp */
  updatedAt: z2.date()
});
var TokenUsageSchema = z2.object({
  /** Number of input/prompt tokens */
  inputTokens: z2.number().int().nonnegative(),
  /** Number of output/completion tokens */
  outputTokens: z2.number().int().nonnegative(),
  /** Optional cached input tokens */
  cachedInputTokens: z2.number().int().nonnegative().optional(),
  /** Model identifier used */
  modelId: z2.string(),
  /** Request timestamp */
  timestamp: z2.date()
});
var DEFAULT_MODEL_PRICING = {
  // Google Gemini
  "gemini-2.0-flash-exp": {
    modelId: "gemini-2.0-flash-exp",
    provider: "google",
    inputPricePerMillion: 0.075,
    outputPricePerMillion: 0.3,
    cachedInputPricePerMillion: 0.01875,
    updatedAt: /* @__PURE__ */ new Date("2026-01-01")
  },
  "gemini-1.5-pro": {
    modelId: "gemini-1.5-pro",
    provider: "google",
    inputPricePerMillion: 1.25,
    outputPricePerMillion: 5,
    cachedInputPricePerMillion: 0.3125,
    updatedAt: /* @__PURE__ */ new Date("2026-01-01")
  },
  "gemini-1.5-flash": {
    modelId: "gemini-1.5-flash",
    provider: "google",
    inputPricePerMillion: 0.075,
    outputPricePerMillion: 0.3,
    cachedInputPricePerMillion: 0.01875,
    updatedAt: /* @__PURE__ */ new Date("2026-01-01")
  },
  // OpenAI
  "gpt-4o": {
    modelId: "gpt-4o",
    provider: "openai",
    inputPricePerMillion: 2.5,
    outputPricePerMillion: 10,
    cachedInputPricePerMillion: 1.25,
    updatedAt: /* @__PURE__ */ new Date("2026-01-01")
  },
  "gpt-4o-mini": {
    modelId: "gpt-4o-mini",
    provider: "openai",
    inputPricePerMillion: 0.15,
    outputPricePerMillion: 0.6,
    cachedInputPricePerMillion: 0.075,
    updatedAt: /* @__PURE__ */ new Date("2026-01-01")
  },
  "o1": {
    modelId: "o1",
    provider: "openai",
    inputPricePerMillion: 15,
    outputPricePerMillion: 60,
    updatedAt: /* @__PURE__ */ new Date("2026-01-01")
  },
  "o1-mini": {
    modelId: "o1-mini",
    provider: "openai",
    inputPricePerMillion: 3,
    outputPricePerMillion: 12,
    updatedAt: /* @__PURE__ */ new Date("2026-01-01")
  },
  // Anthropic
  "claude-3-5-sonnet": {
    modelId: "claude-3-5-sonnet",
    provider: "anthropic",
    inputPricePerMillion: 3,
    outputPricePerMillion: 15,
    cachedInputPricePerMillion: 0.3,
    updatedAt: /* @__PURE__ */ new Date("2026-01-01")
  },
  "claude-3-5-haiku": {
    modelId: "claude-3-5-haiku",
    provider: "anthropic",
    inputPricePerMillion: 0.8,
    outputPricePerMillion: 4,
    cachedInputPricePerMillion: 0.08,
    updatedAt: /* @__PURE__ */ new Date("2026-01-01")
  },
  "claude-3-opus": {
    modelId: "claude-3-opus",
    provider: "anthropic",
    inputPricePerMillion: 15,
    outputPricePerMillion: 75,
    cachedInputPricePerMillion: 1.5,
    updatedAt: /* @__PURE__ */ new Date("2026-01-01")
  }
};
function calculateCost(usage, pricing) {
  const modelPricing = pricing ?? getModelPricing(usage.modelId);
  if (!modelPricing) {
    throw new Error(`No pricing data for model: ${usage.modelId}`);
  }
  const inputCost = usage.inputTokens / 1e6 * modelPricing.inputPricePerMillion;
  const outputCost = usage.outputTokens / 1e6 * modelPricing.outputPricePerMillion;
  let cachedInputCost = 0;
  if (usage.cachedInputTokens && modelPricing.cachedInputPricePerMillion) {
    cachedInputCost = usage.cachedInputTokens / 1e6 * modelPricing.cachedInputPricePerMillion;
  }
  return {
    totalCost: inputCost + outputCost + cachedInputCost,
    inputCost,
    outputCost,
    cachedInputCost,
    usage,
    pricing: modelPricing
  };
}
function getModelPricing(modelId) {
  if (modelId in DEFAULT_MODEL_PRICING) {
    return DEFAULT_MODEL_PRICING[modelId];
  }
  const modelIdLower = modelId.toLowerCase();
  for (const [key, pricing] of Object.entries(DEFAULT_MODEL_PRICING)) {
    if (modelIdLower.startsWith(key.toLowerCase())) {
      return pricing;
    }
  }
  return null;
}
var CostTracker = class {
  constructor() {
    this.usages = [];
    this.customPricing = /* @__PURE__ */ new Map();
  }
  /**
   * Add custom pricing for a model
   */
  addPricing(pricing) {
    this.customPricing.set(pricing.modelId, pricing);
  }
  /**
   * Track a request's token usage
   */
  track(usage) {
    const pricing = this.customPricing.get(usage.modelId) ?? getModelPricing(usage.modelId);
    const calculation = calculateCost(usage, pricing ?? void 0);
    this.usages.push(calculation);
    return calculation;
  }
  /**
   * Get total cost across all tracked usages
   */
  getTotalCost() {
    return this.usages.reduce((sum, calc) => sum + calc.totalCost, 0);
  }
  /**
   * Get breakdown by provider
   */
  getCostByProvider() {
    const byProvider = {};
    for (const calc of this.usages) {
      const provider = calc.pricing.provider;
      byProvider[provider] = (byProvider[provider] ?? 0) + calc.totalCost;
    }
    return byProvider;
  }
  /**
   * Get breakdown by model
   */
  getCostByModel() {
    const byModel = {};
    for (const calc of this.usages) {
      const model = calc.pricing.modelId;
      byModel[model] = (byModel[model] ?? 0) + calc.totalCost;
    }
    return byModel;
  }
  /**
   * Get all tracked usages
   */
  getUsages() {
    return [...this.usages];
  }
  /**
   * Reset the tracker
   */
  reset() {
    this.usages = [];
  }
  /**
   * Get summary statistics
   */
  getSummary() {
    return {
      totalCost: this.getTotalCost(),
      totalInputTokens: this.usages.reduce((sum, c) => sum + c.usage.inputTokens, 0),
      totalOutputTokens: this.usages.reduce((sum, c) => sum + c.usage.outputTokens, 0),
      requestCount: this.usages.length
    };
  }
};
function formatCost(cost, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 4,
    maximumFractionDigits: 6
  }).format(cost);
}
export {
  CostTracker,
  DEFAULT_CONFIGS,
  DEFAULT_MODEL_PRICING,
  MemoryConfigAdapter,
  ModelConfigRecordSchema,
  ModelConfigSchema,
  ModelPricingSchema,
  ProviderSchema,
  SUPPORTED_MODELS,
  TASK_TYPES,
  TaskTypeSchema,
  TokenUsageSchema,
  calculateCost,
  createConfig,
  createGeminiProvider2 as createGeminiProvider,
  createModelForTask,
  createModelFromConfig,
  deleteConfig,
  formatCost,
  getAllConfigs,
  getConfigAdapter,
  getModelConfig,
  getModelPricing,
  invalidateCache,
  registry,
  setConfigAdapter,
  updateConfig
};
//# sourceMappingURL=index.mjs.map
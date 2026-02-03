"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  CostTracker: () => CostTracker,
  DEFAULT_CONFIGS: () => DEFAULT_CONFIGS,
  DEFAULT_MODEL_PRICING: () => DEFAULT_MODEL_PRICING,
  MemoryConfigAdapter: () => MemoryConfigAdapter,
  ModelConfigRecordSchema: () => ModelConfigRecordSchema,
  ModelConfigSchema: () => ModelConfigSchema,
  ModelPricingSchema: () => ModelPricingSchema,
  ProviderSchema: () => ProviderSchema,
  SUPPORTED_MODELS: () => SUPPORTED_MODELS,
  TASK_TYPES: () => TASK_TYPES,
  TaskTypeSchema: () => TaskTypeSchema,
  TokenUsageSchema: () => TokenUsageSchema,
  calculateCost: () => calculateCost,
  createConfig: () => createConfig,
  createGeminiProvider: () => import_ai_sdk_provider_gemini_cli2.createGeminiProvider,
  createModelForTask: () => createModelForTask,
  createModelFromConfig: () => createModelFromConfig,
  deleteConfig: () => deleteConfig,
  formatCost: () => formatCost,
  getAllConfigs: () => getAllConfigs,
  getConfigAdapter: () => getConfigAdapter,
  getModelConfig: () => getModelConfig,
  getModelPricing: () => getModelPricing,
  invalidateCache: () => invalidateCache,
  registry: () => registry,
  setConfigAdapter: () => setConfigAdapter,
  updateConfig: () => updateConfig
});
module.exports = __toCommonJS(index_exports);

// src/registry.ts
var import_ai = require("ai");
var import_openai = require("@ai-sdk/openai");
var import_anthropic = require("@ai-sdk/anthropic");
var import_ai_sdk_provider = require("@openrouter/ai-sdk-provider");
var import_ai_sdk_provider_gemini_cli = require("ai-sdk-provider-gemini-cli");
var registry = (0, import_ai.createProviderRegistry)({
  // Gemini (Community CLI Provider - https://github.com/ben-vargas/ai-sdk-provider-gemini-cli)
  gemini: (0, import_ai_sdk_provider_gemini_cli.createGeminiProvider)({
    authType: "oauth-personal"
  }),
  // OpenAI
  openai: (0, import_openai.createOpenAI)(),
  // Anthropic
  anthropic: (0, import_anthropic.createAnthropic)(),
  // OpenRouter
  openrouter: (0, import_ai_sdk_provider.createOpenRouter)({
    name: "OneGenUI",
    extraBody: {
      "HTTP-Referer": "https://github.com/StartAD/OneGenUI",
      "X-Title": "OneGenUI"
    }
  })
});

// src/index.ts
var import_ai_sdk_provider_gemini_cli2 = require("ai-sdk-provider-gemini-cli");

// src/domain/model-config.schema.ts
var import_zod = require("zod");
var TaskTypeSchema = import_zod.z.enum([
  "general",
  "deepresearch",
  "complex",
  "vectorless",
  "canvas",
  "vision"
]);
var TASK_TYPES = TaskTypeSchema.options;
var ProviderSchema = import_zod.z.enum(["gemini", "openai", "anthropic", "openrouter"]);
var ModelConfigSchema = import_zod.z.object({
  modelId: import_zod.z.string(),
  provider: ProviderSchema,
  maxTokens: import_zod.z.number().default(65e3),
  temperature: import_zod.z.number().min(0).max(2).optional()
});
var ModelConfigRecordSchema = ModelConfigSchema.extend({
  id: import_zod.z.string(),
  taskType: TaskTypeSchema,
  enabled: import_zod.z.boolean().default(true),
  createdAt: import_zod.z.date(),
  updatedAt: import_zod.z.date()
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
var import_zod2 = require("zod");
var ModelPricingSchema = import_zod2.z.object({
  /** Model identifier */
  modelId: import_zod2.z.string(),
  /** Provider name */
  provider: import_zod2.z.enum(["google", "openai", "anthropic", "openrouter"]),
  /** Input token price per 1M tokens (USD) */
  inputPricePerMillion: import_zod2.z.number().nonnegative(),
  /** Output token price per 1M tokens (USD) */
  outputPricePerMillion: import_zod2.z.number().nonnegative(),
  /** Optional cached input price per 1M tokens */
  cachedInputPricePerMillion: import_zod2.z.number().nonnegative().optional(),
  /** Last updated timestamp */
  updatedAt: import_zod2.z.date()
});
var TokenUsageSchema = import_zod2.z.object({
  /** Number of input/prompt tokens */
  inputTokens: import_zod2.z.number().int().nonnegative(),
  /** Number of output/completion tokens */
  outputTokens: import_zod2.z.number().int().nonnegative(),
  /** Optional cached input tokens */
  cachedInputTokens: import_zod2.z.number().int().nonnegative().optional(),
  /** Model identifier used */
  modelId: import_zod2.z.string(),
  /** Request timestamp */
  timestamp: import_zod2.z.date()
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
  createGeminiProvider,
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
});
//# sourceMappingURL=index.js.map
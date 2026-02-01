var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/registry.ts
import { createProviderRegistry } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// src/gemini-provider.ts
import { NoSuchModelError } from "@ai-sdk/provider";

// src/gemini-language-model.ts
import { randomUUID as randomUUID3 } from "crypto";

// src/gemini/thinking-config.ts
var ThinkingLevel = /* @__PURE__ */ ((ThinkingLevel2) => {
  ThinkingLevel2["LOW"] = "LOW";
  ThinkingLevel2["MEDIUM"] = "MEDIUM";
  ThinkingLevel2["HIGH"] = "HIGH";
  ThinkingLevel2["MINIMAL"] = "MINIMAL";
  return ThinkingLevel2;
})(ThinkingLevel || {});
function normalizeThinkingLevel(level) {
  const normalized = level.toUpperCase();
  switch (normalized) {
    case "LOW":
      return "LOW" /* LOW */;
    case "MEDIUM":
      return "MEDIUM" /* MEDIUM */;
    case "HIGH":
      return "HIGH" /* HIGH */;
    case "MINIMAL":
      return "MINIMAL" /* MINIMAL */;
    default:
      return void 0;
  }
}
function buildThinkingConfig(input) {
  const config = {};
  if (input.thinkingLevel !== void 0) {
    if (typeof input.thinkingLevel === "string") {
      const normalized = normalizeThinkingLevel(input.thinkingLevel);
      if (normalized !== void 0) {
        config.thinkingLevel = normalized;
      }
    } else {
      config.thinkingLevel = input.thinkingLevel;
    }
  }
  if (input.thinkingBudget !== void 0) {
    config.thinkingBudget = input.thinkingBudget;
  }
  if (input.includeThoughts !== void 0) {
    config.includeThoughts = input.includeThoughts;
  }
  return config;
}

// src/gemini/finish-reason.ts
function mapGeminiFinishReason(geminiReason) {
  switch (geminiReason) {
    case "STOP":
      return { unified: "stop", raw: geminiReason };
    case "MAX_TOKENS":
      return { unified: "length", raw: geminiReason };
    case "SAFETY":
    case "RECITATION":
      return { unified: "content-filter", raw: geminiReason };
    case "OTHER":
      return { unified: "other", raw: geminiReason };
    default:
      return { unified: "other", raw: geminiReason };
  }
}

// src/tool-mapper.ts
import {
  FunctionCallingConfigMode
} from "@google/genai";
import { z } from "zod";
function mapToolsToGeminiFormat(tools) {
  const functionDeclarations = [];
  for (const tool of tools) {
    functionDeclarations.push({
      name: tool.name,
      description: tool.description,
      parameters: convertToolParameters(tool.inputSchema)
    });
  }
  return [{ functionDeclarations }];
}
function convertZodToJsonSchema(zodSchema) {
  const zodWithToJSONSchema = z;
  if (zodWithToJSONSchema.toJSONSchema && typeof zodWithToJSONSchema.toJSONSchema === "function") {
    try {
      return zodWithToJSONSchema.toJSONSchema(zodSchema);
    } catch {
    }
  }
  try {
    const zodToJsonSchemaModule = __require("zod-to-json-schema");
    return zodToJsonSchemaModule.zodToJsonSchema(zodSchema);
  } catch {
  }
  console.warn(
    "Unable to convert Zod schema to JSON Schema. For Zod v3, install zod-to-json-schema. For Zod v4, use z.toJSONSchema() function."
  );
  return { type: "object" };
}
function convertToolParameters(parameters) {
  if (isJsonSchema(parameters)) {
    return cleanJsonSchema(parameters);
  }
  if (isZodSchema(parameters)) {
    const jsonSchema = convertZodToJsonSchema(parameters);
    return cleanJsonSchema(jsonSchema);
  }
  return parameters;
}
function isJsonSchema(obj) {
  return typeof obj === "object" && obj !== null && ("type" in obj || "properties" in obj || "$schema" in obj);
}
function isZodSchema(obj) {
  return typeof obj === "object" && obj !== null && "_def" in obj && typeof obj._def === "object";
}
function cleanJsonSchema(schema) {
  if (typeof schema !== "object" || schema === null) {
    return schema;
  }
  const cleaned = { ...schema };
  delete cleaned.$schema;
  delete cleaned.$ref;
  delete cleaned.$defs;
  delete cleaned.definitions;
  if ("const" in cleaned) {
    const constValue = cleaned.const;
    delete cleaned.const;
    cleaned.enum = [constValue];
  }
  if (cleaned.properties && typeof cleaned.properties === "object") {
    const cleanedProps = {};
    for (const [key, value] of Object.entries(cleaned.properties)) {
      cleanedProps[key] = cleanJsonSchema(value);
    }
    cleaned.properties = cleanedProps;
  }
  if (cleaned.items) {
    cleaned.items = cleanJsonSchema(cleaned.items);
  }
  if (cleaned.additionalProperties && typeof cleaned.additionalProperties === "object") {
    cleaned.additionalProperties = cleanJsonSchema(
      cleaned.additionalProperties
    );
  }
  for (const key of [
    "allOf",
    "anyOf",
    "oneOf",
    "all_of",
    "any_of",
    "one_of"
  ]) {
    const arrayProp = cleaned[key];
    if (Array.isArray(arrayProp)) {
      cleaned[key] = arrayProp.map(
        (item) => cleanJsonSchema(item)
      );
    }
  }
  if (cleaned.properties && cleaned.type === void 0) {
    cleaned.type = "object";
  }
  return cleaned;
}
function mapGeminiToolConfig(options) {
  if (options.toolChoice) {
    const allowedFunctionNames = options.toolChoice.type === "tool" ? [options.toolChoice.toolName] : void 0;
    return {
      functionCallingConfig: {
        allowedFunctionNames,
        mode: mapToolChoiceToGeminiFormat(options.toolChoice)
      }
    };
  }
  return void 0;
}
function mapToolChoiceToGeminiFormat(toolChoice) {
  switch (toolChoice.type) {
    case "auto":
      return FunctionCallingConfigMode.AUTO;
    case "none":
      return FunctionCallingConfigMode.NONE;
    case "required":
    case "tool":
      return FunctionCallingConfigMode.ANY;
    default:
      return FunctionCallingConfigMode.MODE_UNSPECIFIED;
  }
}

// src/gemini/generation-config.ts
function prepareGenerationConfig(options, settings) {
  const warnings = [];
  const responseFormat = options.responseFormat;
  const isJsonMode = responseFormat?.type === "json";
  const schema = isJsonMode ? responseFormat.schema : void 0;
  const hasSchema = isJsonMode && schema !== void 0;
  if (isJsonMode && !hasSchema) {
    warnings.push({
      type: "unsupported",
      feature: "responseFormat",
      details: "JSON response format without a schema is not supported. Treating as plain text. Provide a schema for structured output."
    });
  }
  const thinkingConfig = mergeThinkingConfig(settings, options);
  const generationConfig = {
    temperature: options.temperature ?? settings?.temperature,
    topP: options.topP ?? settings?.topP,
    topK: options.topK ?? settings?.topK,
    maxOutputTokens: options.maxOutputTokens ?? settings?.maxOutputTokens,
    stopSequences: options.stopSequences,
    // Only use application/json when we have a schema to enforce it
    responseMimeType: hasSchema ? "application/json" : "text/plain",
    // Pass schema directly to Gemini API for native structured output
    responseJsonSchema: hasSchema ? schema : void 0,
    toolConfig: mapGeminiToolConfig(options),
    // Pass thinkingConfig for Gemini 3 (thinkingLevel) or Gemini 2.5 (thinkingBudget)
    thinkingConfig
  };
  return { generationConfig, warnings };
}
function mergeThinkingConfig(settings, options) {
  const settingsThinkingConfig = settings?.thinkingConfig;
  const optionsThinkingConfig = options?.thinkingConfig;
  let effectiveOptionsThinking = optionsThinkingConfig;
  if (optionsThinkingConfig?.thinkingLevel !== void 0 && typeof optionsThinkingConfig.thinkingLevel === "string") {
    const normalized = normalizeThinkingLevel(
      optionsThinkingConfig.thinkingLevel
    );
    if (normalized === void 0) {
      const { thinkingLevel: _discarded, ...rest } = optionsThinkingConfig;
      effectiveOptionsThinking = Object.keys(rest).length > 0 ? rest : void 0;
    }
  }
  const mergedThinkingConfig = settingsThinkingConfig || effectiveOptionsThinking ? { ...settingsThinkingConfig, ...effectiveOptionsThinking } : void 0;
  return mergedThinkingConfig ? buildThinkingConfig(mergedThinkingConfig) : void 0;
}

// src/client.ts
import { randomUUID } from "crypto";
import {
  createContentGenerator,
  createContentGeneratorConfig,
  AuthType
} from "@google/gemini-cli-core";
async function initializeGeminiClient(options, modelId) {
  let authType;
  if (options.authType === "api-key" || options.authType === "gemini-api-key") {
    authType = AuthType.USE_GEMINI;
  } else if (options.authType === "vertex-ai") {
    authType = AuthType.USE_VERTEX_AI;
  } else if (options.authType === "oauth" || options.authType === "oauth-personal") {
    authType = AuthType.LOGIN_WITH_GOOGLE;
  } else if (options.authType === "google-auth-library") {
    authType = AuthType.USE_GEMINI;
  }
  const sessionId = randomUUID();
  const baseConfig = {
    // Required methods (currently working)
    getModel: () => modelId,
    getProxy: () => options.proxy || process.env.HTTP_PROXY || process.env.HTTPS_PROXY || void 0,
    getUsageStatisticsEnabled: () => false,
    // Disable telemetry by default
    getContentGeneratorConfig: () => ({
      authType,
      // Keep as AuthType | undefined for consistency
      model: modelId,
      apiKey: "apiKey" in options ? options.apiKey : void 0,
      vertexai: options.authType === "vertex-ai" ? true : void 0,
      proxy: options.proxy
    }),
    // Core safety methods - most likely to be called
    getSessionId: () => sessionId,
    getDebugMode: () => false,
    getTelemetryEnabled: () => false,
    getTargetDir: () => process.cwd(),
    getFullContext: () => false,
    getIdeMode: () => false,
    getCoreTools: () => [],
    getExcludeTools: () => [],
    getMaxSessionTurns: () => 100,
    getFileFilteringRespectGitIgnore: () => true,
    // OAuth-specific methods (required for LOGIN_WITH_GOOGLE auth)
    isBrowserLaunchSuppressed: () => false,
    // Allow browser launch for OAuth flow
    // NEW in 0.20.0 - JIT Context & Memory
    getContextManager: () => void 0,
    getGlobalMemory: () => "",
    getEnvironmentMemory: () => "",
    // NEW in 0.20.0 - Hook System
    getHookSystem: () => void 0,
    // NEW in 0.20.0 - Model Availability Service (replaces getUseModelRouter)
    getModelAvailabilityService: () => void 0,
    // NEW in 0.20.0 - Shell Timeout (default: 2 minutes)
    getShellToolInactivityTimeout: () => 12e4,
    // NEW in 0.20.0 - Experiments (async getter)
    getExperimentsAsync: () => Promise.resolve(void 0)
  };
  const configMock = new Proxy(baseConfig, {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      if (typeof prop === "string") {
        if (prop.startsWith("get") || prop.startsWith("is") || prop.startsWith("has")) {
          if (process.env.DEBUG) {
            console.warn(
              `[ai-sdk-provider-gemini-cli] Unknown config method called: ${prop}()`
            );
          }
          return () => {
            if (prop.startsWith("is") || prop.startsWith("has")) {
              return false;
            }
            if (prop.startsWith("get")) {
              if (prop.includes("Enabled") || prop.includes("Mode")) {
                return false;
              }
              if (prop.includes("Registry") || prop.includes("Client") || prop.includes("Service") || prop.includes("Manager")) {
                return void 0;
              }
              if (prop.includes("Memory")) {
                return "";
              }
              if (prop.includes("Timeout")) {
                return 12e4;
              }
              if (prop.includes("Config") || prop.includes("Options")) {
                return {};
              }
              if (prop.includes("Command") || prop.includes("Path")) {
                return void 0;
              }
              return void 0;
            }
            return void 0;
          };
        }
      }
      return void 0;
    }
  });
  const config = await createContentGeneratorConfig(
    configMock,
    authType
  );
  if ((options.authType === "api-key" || options.authType === "gemini-api-key") && options.apiKey) {
    config.apiKey = options.apiKey;
  } else if (options.authType === "vertex-ai" && options.vertexAI) {
    config.vertexai = true;
  }
  const client = await createContentGenerator(
    config,
    configMock,
    sessionId
  );
  return { client, config, sessionId };
}

// src/error.ts
import { APICallError, LoadAPIKeyError } from "@ai-sdk/provider";
function createAPICallError({
  message,
  code,
  exitCode,
  stderr,
  promptExcerpt,
  isRetryable = false,
  statusCode = 500
}) {
  return new APICallError({
    url: "gemini-cli-core://command",
    requestBodyValues: promptExcerpt ? { prompt: promptExcerpt } : {},
    statusCode,
    responseHeaders: {},
    message,
    data: {
      code,
      exitCode,
      stderr
    },
    isRetryable
  });
}
function createAuthenticationError({
  message
}) {
  return new LoadAPIKeyError({
    message
  });
}
function createTimeoutError({
  message,
  promptExcerpt
}) {
  return createAPICallError({
    message,
    code: "TIMEOUT",
    promptExcerpt,
    isRetryable: true,
    statusCode: 504
  });
}
function isAuthenticationError(error) {
  if (error instanceof LoadAPIKeyError) {
    return true;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes("unauthorized") || message.includes("authentication") || message.includes("api key") || message.includes("credentials");
  }
  return false;
}
function isTimeoutError(error) {
  if (error instanceof APICallError) {
    return error.statusCode === 504 || error.data?.code === "TIMEOUT";
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes("timeout") || message.includes("timed out");
  }
  return false;
}
function mapGeminiError(error) {
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      throw error;
    }
    const message = error.message.toLowerCase();
    if (isAuthenticationError(error)) {
      return createAuthenticationError({
        message: error.message
      });
    }
    if (message.includes("rate limit") || message.includes("quota")) {
      return createAPICallError({
        message: error.message,
        code: "RATE_LIMIT",
        isRetryable: true,
        statusCode: 429
      });
    }
    if (isTimeoutError(error)) {
      return createTimeoutError({
        message: error.message
      });
    }
    if (message.includes("not found") || message.includes("no such model") || message.includes("model") && (message.includes("invalid") || message.includes("not found"))) {
      return createAPICallError({
        message: error.message,
        code: "MODEL_NOT_FOUND",
        isRetryable: false,
        statusCode: 404
      });
    }
    if (message.includes("invalid") || message.includes("bad request")) {
      return createAPICallError({
        message: error.message,
        code: "INVALID_REQUEST",
        isRetryable: false,
        statusCode: 400
      });
    }
    return createAPICallError({
      message: error.message,
      code: "INTERNAL_ERROR",
      isRetryable: true,
      statusCode: 500
    });
  }
  return createAPICallError({
    message: "An unknown error occurred",
    code: "UNKNOWN_ERROR",
    isRetryable: true,
    statusCode: 500
  });
}

// src/logger.ts
var defaultLogger = {
  debug: (message) => console.debug(`[DEBUG] ${message}`),
  info: (message) => console.info(`[INFO] ${message}`),
  warn: (message) => console.warn(`[WARN] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`)
};
var noopLogger = {
  debug: () => {
  },
  info: () => {
  },
  warn: () => {
  },
  error: () => {
  }
};
function getLogger(logger) {
  if (logger === false) {
    return noopLogger;
  }
  if (logger === void 0) {
    return defaultLogger;
  }
  return logger;
}
function createVerboseLogger(logger, verbose = false) {
  if (verbose) {
    return logger;
  }
  return {
    debug: () => {
    },
    // Suppressed in non-verbose mode
    info: () => {
    },
    // Suppressed in non-verbose mode
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger)
  };
}

// src/message-mapper.ts
function mapPromptToGeminiFormat(options) {
  const messages = options.prompt;
  const contents = [];
  let systemInstruction;
  for (const message of messages) {
    switch (message.role) {
      case "system":
        systemInstruction = {
          role: "user",
          parts: [{ text: message.content }]
        };
        break;
      case "user":
        contents.push(mapUserMessage(message));
        break;
      case "assistant":
        contents.push(mapAssistantMessage(message));
        break;
      case "tool": {
        const parts = [];
        for (const part of message.content) {
          if (part.type === "tool-result") {
            const output = part.output;
            let resultValue;
            if (output.type === "text" || output.type === "error-text") {
              resultValue = { result: output.value };
            } else if (output.type === "json" || output.type === "error-json") {
              const jsonValue = output.value;
              if (jsonValue !== null && typeof jsonValue === "object" && !Array.isArray(jsonValue)) {
                resultValue = jsonValue;
              } else {
                resultValue = { result: jsonValue };
              }
            } else if (output.type === "execution-denied") {
              resultValue = {
                result: `[Execution denied${output.reason ? `: ${output.reason}` : ""}]`
              };
            } else if (output.type === "content") {
              const textContent = output.value.filter(
                (p) => p.type === "text"
              ).map((p) => p.text).join("\n");
              resultValue = { result: textContent };
            } else {
              resultValue = { result: "[Unknown output type]" };
            }
            parts.push({
              functionResponse: {
                name: part.toolName,
                response: resultValue
              }
            });
          }
        }
        contents.push({
          role: "user",
          parts
        });
        break;
      }
    }
  }
  return { contents, systemInstruction };
}
function mapUserMessage(message) {
  const parts = [];
  for (const part of message.content) {
    switch (part.type) {
      case "text":
        parts.push({ text: part.text });
        break;
      case "file": {
        const mediaType = part.mediaType || "application/octet-stream";
        if (mediaType.startsWith("image/") || mediaType.startsWith("audio/") || mediaType.startsWith("video/") || mediaType === "application/pdf") {
          parts.push(mapFilePart(part));
        } else {
          throw new Error(`Unsupported file type: ${mediaType}`);
        }
        break;
      }
    }
  }
  return { role: "user", parts };
}
function mapAssistantMessage(message) {
  const parts = [];
  for (const part of message.content) {
    switch (part.type) {
      case "text":
        parts.push({ text: part.text });
        break;
      case "tool-call": {
        const providerMetadata = part.providerMetadata;
        const geminiCliMetadata = providerMetadata?.["gemini-cli"];
        const providerOptions = part.providerOptions;
        const geminiCliOptions = providerOptions?.["gemini-cli"];
        const thoughtSignature = geminiCliMetadata?.thoughtSignature || geminiCliOptions?.thoughtSignature;
        const geminiPart = {
          functionCall: {
            name: part.toolName,
            args: part.input || {}
          },
          ...thoughtSignature ? { thoughtSignature } : {}
        };
        parts.push(geminiPart);
        break;
      }
    }
  }
  return { role: "model", parts };
}
function mapFilePart(part) {
  if (part.data instanceof URL) {
    throw new Error(
      "URL files are not supported by Gemini CLI Core. Please provide base64-encoded data."
    );
  }
  const mimeType = part.mediaType || "application/octet-stream";
  let base64Data;
  if (typeof part.data === "string") {
    base64Data = part.data;
  } else if (part.data instanceof Uint8Array) {
    base64Data = Buffer.from(part.data).toString("base64");
  } else {
    throw new Error("Unsupported file format");
  }
  return {
    inlineData: {
      mimeType,
      data: base64Data
    }
  };
}

// src/gemini/language-model/request-builder.ts
function buildGeminiRequest(modelId, options, settings, logger) {
  const { contents, systemInstruction } = mapPromptToGeminiFormat(options);
  logger.debug(
    `[gemini-cli] Request mode: ${options.responseFormat?.type === "json" ? "object-json" : "regular"}, response format: ${options.responseFormat?.type ?? "none"}`
  );
  logger.debug(`[gemini-cli] Converted ${options.prompt.length} messages`);
  const { generationConfig, warnings } = prepareGenerationConfig(
    options,
    settings
  );
  let tools;
  if (options.tools) {
    const functionTools = options.tools.filter(
      (tool) => tool.type === "function"
    );
    if (functionTools.length > 0) {
      tools = mapToolsToGeminiFormat(functionTools);
    }
  }
  const request = {
    model: modelId,
    contents,
    config: {
      ...generationConfig,
      systemInstruction,
      tools
    }
  };
  return {
    request,
    generationConfig,
    warnings,
    contents,
    systemInstruction,
    tools
  };
}

// src/gemini/language-model/response-parser.ts
import { randomUUID as randomUUID2 } from "crypto";
function parseGenerateResponse(response, logger) {
  const candidate = response.candidates?.[0];
  const responseContent = candidate?.content;
  const content = [];
  let hasToolCalls = false;
  if (responseContent?.parts) {
    for (const part of responseContent.parts) {
      if (part.text) {
        content.push({
          type: "text",
          text: part.text
        });
      } else if (part.functionCall) {
        hasToolCalls = true;
        content.push({
          type: "tool-call",
          toolCallId: randomUUID2(),
          toolName: part.functionCall.name || "",
          input: JSON.stringify(part.functionCall.args || {}),
          ...part.thoughtSignature ? {
            providerMetadata: {
              "gemini-cli": {
                thoughtSignature: part.thoughtSignature
              }
            }
          } : {}
        });
      }
    }
  }
  const inputTokens = response.usageMetadata?.promptTokenCount || 0;
  const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
  const totalTokens = inputTokens + outputTokens;
  const usage = {
    inputTokens: {
      total: inputTokens,
      noCache: void 0,
      cacheRead: void 0,
      cacheWrite: void 0
    },
    outputTokens: {
      total: outputTokens,
      text: void 0,
      reasoning: void 0
    }
  };
  logger.debug(
    `[gemini-cli] Token usage - Input: ${inputTokens}, Output: ${outputTokens}, Total: ${totalTokens}`
  );
  const finishReason = hasToolCalls ? {
    unified: "tool-calls",
    raw: candidate?.finishReason
  } : mapGeminiFinishReason(candidate?.finishReason);
  logger.debug(`[gemini-cli] Finish reason: ${finishReason.unified}`);
  return {
    content,
    finishReason,
    usage,
    inputTokens,
    outputTokens
  };
}

// src/gemini/language-model/abort-handler.ts
function setupAbortHandler(signal) {
  if (!signal) {
    return { checkAborted: () => {
    } };
  }
  if (signal.aborted) {
    const abortError = new Error("Request aborted");
    abortError.name = "AbortError";
    throw abortError;
  }
  const listener = () => {
  };
  signal.addEventListener("abort", listener, { once: true });
  const checkAborted = () => {
    if (signal.aborted) {
      const abortError = new Error("Request aborted");
      abortError.name = "AbortError";
      throw abortError;
    }
  };
  return { listener, checkAborted };
}
function cleanupAbortHandler(signal, listener) {
  if (signal && listener) {
    signal.removeEventListener("abort", listener);
  }
}

// src/gemini-language-model.ts
var GeminiLanguageModel = class {
  constructor(options) {
    this.specificationVersion = "v3";
    this.provider = "gemini-cli-core";
    this.defaultObjectGenerationMode = "json";
    this.supportsImageUrls = false;
    this.supportedUrls = {};
    this.supportsStructuredOutputs = true;
    this.modelId = options.modelId;
    this.providerOptions = options.providerOptions;
    this.settings = options.settings;
    const baseLogger = getLogger(options.settings?.logger);
    this.logger = createVerboseLogger(
      baseLogger,
      options.settings?.verbose ?? false
    );
  }
  async ensureInitialized() {
    if (this.contentGenerator && this.config) {
      return { contentGenerator: this.contentGenerator, config: this.config };
    }
    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }
    await this.initPromise;
    return { contentGenerator: this.contentGenerator, config: this.config };
  }
  async initialize() {
    try {
      const { client, config } = await initializeGeminiClient(
        this.providerOptions,
        this.modelId
      );
      this.contentGenerator = client;
      this.config = config;
    } catch (error) {
      throw new Error(`Failed to initialize Gemini model: ${String(error)}`);
    }
  }
  async doGenerate(options) {
    this.logger.debug(
      `[gemini-cli] Starting doGenerate request with model: ${this.modelId}`
    );
    try {
      const { contentGenerator } = await this.ensureInitialized();
      const {
        request,
        generationConfig,
        warnings,
        contents,
        systemInstruction,
        tools
      } = buildGeminiRequest(this.modelId, options, this.settings, this.logger);
      const { listener, checkAborted } = setupAbortHandler(options.abortSignal);
      let response;
      const startTime = Date.now();
      try {
        this.logger.debug("[gemini-cli] Executing generateContent request");
        response = await contentGenerator.generateContent(
          request,
          randomUUID3()
        );
        const duration = Date.now() - startTime;
        this.logger.info(
          `[gemini-cli] Request completed - Duration: ${duration}ms`
        );
        checkAborted();
      } finally {
        cleanupAbortHandler(options.abortSignal, listener);
      }
      const parsed = parseGenerateResponse(response, this.logger);
      return {
        content: parsed.content,
        finishReason: parsed.finishReason,
        usage: parsed.usage,
        rawCall: {
          rawPrompt: { contents, systemInstruction, generationConfig, tools },
          rawSettings: generationConfig
        },
        rawResponse: { body: response },
        response: {
          id: randomUUID3(),
          timestamp: /* @__PURE__ */ new Date(),
          modelId: this.modelId
        },
        warnings
      };
    } catch (error) {
      this.logger.debug(
        `[gemini-cli] Error during doGenerate: ${error instanceof Error ? error.message : String(error)}`
      );
      throw mapGeminiError(error);
    }
  }
  async doStream(options) {
    this.logger.debug(
      `[gemini-cli] Starting doStream request with model: ${this.modelId}`
    );
    try {
      const { contentGenerator } = await this.ensureInitialized();
      const {
        request,
        generationConfig,
        warnings,
        contents,
        systemInstruction,
        tools
      } = buildGeminiRequest(this.modelId, options, this.settings, this.logger);
      this.logger.debug(
        `[gemini-cli] Stream mode: ${options.responseFormat?.type === "json" ? "object-json" : "regular"}`
      );
      if (options.responseFormat?.type === "json") {
        this.logger.debug(
          `[gemini-cli] JSON Schema: ${JSON.stringify(options.responseFormat.schema, null, 2).slice(0, 500)}`
        );
        this.logger.debug(
          `[gemini-cli] generationConfig.responseMimeType: ${generationConfig.responseMimeType}`
        );
        this.logger.debug(
          `[gemini-cli] generationConfig.responseJsonSchema: ${JSON.stringify(generationConfig.responseJsonSchema, null, 2)?.slice(0, 500)}`
        );
      }
      const { listener, checkAborted } = setupAbortHandler(options.abortSignal);
      let streamResponse;
      try {
        this.logger.debug(
          "[gemini-cli] Starting generateContentStream request"
        );
        streamResponse = await contentGenerator.generateContentStream(
          request,
          randomUUID3()
        );
        checkAborted();
      } catch (error) {
        cleanupAbortHandler(options.abortSignal, listener);
        throw error;
      }
      const modelId = this.modelId;
      const logger = this.logger;
      const streamWarnings = warnings;
      const abortSignal = options.abortSignal;
      const abortListener = listener;
      const stream = new ReadableStream({
        async start(controller) {
          try {
            if (abortSignal?.aborted) {
              const abortError = new Error("Request aborted");
              abortError.name = "AbortError";
              controller.error(abortError);
              return;
            }
            let totalInputTokens = 0;
            let totalOutputTokens = 0;
            let textPartId;
            let hasToolCalls = false;
            controller.enqueue({
              type: "stream-start",
              warnings: streamWarnings
            });
            const streamStartTime = Date.now();
            logger.debug("[gemini-cli] Stream started, processing chunks");
            for await (const chunk of streamResponse) {
              if (abortSignal?.aborted) {
                const abortError = new Error("Request aborted");
                abortError.name = "AbortError";
                controller.error(abortError);
                return;
              }
              const candidate = chunk.candidates?.[0];
              const content = candidate?.content;
              if (chunk.usageMetadata) {
                totalInputTokens = chunk.usageMetadata.promptTokenCount || 0;
                totalOutputTokens = chunk.usageMetadata.candidatesTokenCount || 0;
              }
              if (content?.parts) {
                for (const part of content.parts) {
                  if (part.text) {
                    if (!textPartId) {
                      textPartId = randomUUID3();
                      controller.enqueue({
                        type: "text-start",
                        id: textPartId
                      });
                    }
                    controller.enqueue({
                      type: "text-delta",
                      id: textPartId,
                      delta: part.text
                    });
                  } else if (part.functionCall) {
                    hasToolCalls = true;
                    const geminiPart = part;
                    controller.enqueue({
                      type: "tool-call",
                      toolCallId: randomUUID3(),
                      toolName: part.functionCall.name || "",
                      input: JSON.stringify(part.functionCall.args || {}),
                      ...geminiPart.thoughtSignature ? {
                        providerMetadata: {
                          "gemini-cli": {
                            thoughtSignature: geminiPart.thoughtSignature
                          }
                        }
                      } : {}
                    });
                  }
                }
              }
              if (candidate?.finishReason) {
                const duration = Date.now() - streamStartTime;
                logger.info(
                  `[gemini-cli] Stream completed - Duration: ${duration}ms`
                );
                logger.debug(
                  `[gemini-cli] Stream token usage - Input: ${totalInputTokens}, Output: ${totalOutputTokens}`
                );
                if (textPartId) {
                  controller.enqueue({ type: "text-end", id: textPartId });
                }
                const finishReason = hasToolCalls ? {
                  unified: "tool-calls",
                  raw: candidate.finishReason
                } : mapGeminiFinishReason(candidate.finishReason);
                logger.debug(
                  `[gemini-cli] Stream finish reason: ${finishReason.unified}`
                );
                controller.enqueue({
                  type: "response-metadata",
                  id: randomUUID3(),
                  timestamp: /* @__PURE__ */ new Date(),
                  modelId
                });
                controller.enqueue({
                  type: "finish",
                  finishReason,
                  usage: {
                    inputTokens: {
                      total: totalInputTokens,
                      noCache: void 0,
                      cacheRead: void 0,
                      cacheWrite: void 0
                    },
                    outputTokens: {
                      total: totalOutputTokens,
                      text: void 0,
                      reasoning: void 0
                    }
                  }
                });
              }
            }
            logger.debug("[gemini-cli] Stream finalized, closing stream");
            controller.close();
          } catch (error) {
            logger.debug(
              `[gemini-cli] Error during doStream: ${error instanceof Error ? error.message : String(error)}`
            );
            controller.error(mapGeminiError(error));
          } finally {
            cleanupAbortHandler(abortSignal, abortListener);
          }
        },
        cancel: () => {
          cleanupAbortHandler(abortSignal, abortListener);
        }
      });
      return {
        stream,
        rawCall: {
          rawPrompt: { contents, systemInstruction, generationConfig, tools },
          rawSettings: generationConfig
        }
      };
    } catch (error) {
      this.logger.debug(
        `[gemini-cli] Error creating stream: ${error instanceof Error ? error.message : String(error)}`
      );
      throw mapGeminiError(error);
    }
  }
};

// src/validation.ts
function validateAuthOptions(options = {}) {
  const authType = options.authType || "oauth-personal";
  switch (authType) {
    case "api-key":
    case "gemini-api-key":
      if (!("apiKey" in options) || !options.apiKey) {
        throw new Error(`API key is required for ${authType} auth type`);
      }
      return { ...options, authType };
    case "vertex-ai":
      if ("vertexAI" in options && options.vertexAI) {
        if (!options.vertexAI.projectId || options.vertexAI.projectId.trim() === "") {
          throw new Error("Project ID is required for vertex-ai auth type");
        }
        if (!options.vertexAI.location || options.vertexAI.location.trim() === "") {
          throw new Error("Location is required for vertex-ai auth type");
        }
      } else {
        throw new Error(
          "Vertex AI configuration is required for vertex-ai auth type"
        );
      }
      return { ...options, authType };
    case "oauth":
    case "oauth-personal":
      return { ...options, authType };
    case "google-auth-library":
      if (!("googleAuth" in options) || !options.googleAuth) {
        throw new Error(
          "Google Auth Library instance is required for google-auth-library auth type"
        );
      }
      return { ...options, authType };
    default:
      throw new Error(`Invalid auth type: ${String(authType)}`);
  }
}

// src/gemini-provider.ts
function createGeminiProvider(options = {}) {
  const validatedOptions = validateAuthOptions(options);
  const createLanguageModel = (modelId, settings) => {
    return new GeminiLanguageModel({
      modelId,
      providerOptions: validatedOptions,
      settings: {
        maxOutputTokens: 65536,
        // 64K output tokens for Gemini 2.5 models
        ...settings
      }
    });
  };
  const provider = Object.assign(
    function(modelId, settings) {
      if (new.target) {
        throw new Error(
          "The provider function cannot be called with the new keyword."
        );
      }
      return createLanguageModel(modelId, settings);
    },
    {
      specificationVersion: "v3",
      languageModel: createLanguageModel,
      chat: createLanguageModel,
      embeddingModel: (modelId) => {
        throw new NoSuchModelError({
          modelId,
          modelType: "embeddingModel",
          message: `Gemini provider does not support embedding models.`
        });
      },
      imageModel: (modelId) => {
        throw new NoSuchModelError({
          modelId,
          modelType: "imageModel",
          message: `Gemini provider does not support image models.`
        });
      }
    }
  );
  return provider;
}

// src/registry.ts
var registry = createProviderRegistry({
  // Gemini (Custom CLI Provider)
  gemini: createGeminiProvider(),
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

// src/domain/model-config.schema.ts
import { z as z2 } from "zod";
var TaskTypeSchema = z2.enum([
  "general",
  "deepresearch",
  "complex",
  "vectorless",
  "canvas",
  "vision"
]);
var TASK_TYPES = TaskTypeSchema.options;
var ProviderSchema = z2.enum(["gemini", "openai", "anthropic", "openrouter"]);
var ModelConfigSchema = z2.object({
  modelId: z2.string(),
  provider: ProviderSchema,
  maxTokens: z2.number().default(65e3),
  temperature: z2.number().min(0).max(2).optional()
});
var ModelConfigRecordSchema = ModelConfigSchema.extend({
  id: z2.string(),
  taskType: TaskTypeSchema,
  enabled: z2.boolean().default(true),
  createdAt: z2.date(),
  updatedAt: z2.date()
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
import { z as z3 } from "zod";
var ModelPricingSchema = z3.object({
  /** Model identifier */
  modelId: z3.string(),
  /** Provider name */
  provider: z3.enum(["google", "openai", "anthropic", "openrouter"]),
  /** Input token price per 1M tokens (USD) */
  inputPricePerMillion: z3.number().nonnegative(),
  /** Output token price per 1M tokens (USD) */
  outputPricePerMillion: z3.number().nonnegative(),
  /** Optional cached input price per 1M tokens */
  cachedInputPricePerMillion: z3.number().nonnegative().optional(),
  /** Last updated timestamp */
  updatedAt: z3.date()
});
var TokenUsageSchema = z3.object({
  /** Number of input/prompt tokens */
  inputTokens: z3.number().int().nonnegative(),
  /** Number of output/completion tokens */
  outputTokens: z3.number().int().nonnegative(),
  /** Optional cached input tokens */
  cachedInputTokens: z3.number().int().nonnegative().optional(),
  /** Model identifier used */
  modelId: z3.string(),
  /** Request timestamp */
  timestamp: z3.date()
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
  ThinkingLevel,
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
};
//# sourceMappingURL=index.mjs.map
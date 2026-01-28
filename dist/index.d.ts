import { ProviderV3, LanguageModelV3, EmbeddingModelV3, ImageModelV3 } from '@ai-sdk/provider';
export { LanguageModelV3, LanguageModelV3CallOptions, LanguageModelV3Content, LanguageModelV3FinishReason, LanguageModelV3FunctionTool, LanguageModelV3StreamPart, LanguageModelV3ToolCall, LanguageModelV3Usage, ProviderV3, SharedV3Warning } from '@ai-sdk/provider';
import { GoogleAuth } from 'google-auth-library';

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
 * Unified provider registry for OneGenUI.
 * Supports:
 * - gemini (via custom CLI provider)
 * - openai (via standard SDK)
 * - anthropic (via standard SDK)
 * - openrouter (via standard SDK)
 */
declare const registry: any;

export { type GeminiProvider, type GeminiProviderOptions, type Logger, type ThinkingConfigInput, ThinkingLevel, createGeminiProvider, registry };

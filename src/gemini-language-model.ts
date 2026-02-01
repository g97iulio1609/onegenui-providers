import { randomUUID } from "node:crypto";
import type {
  LanguageModelV3,
  LanguageModelV3CallOptions,
  SharedV3Warning,
  LanguageModelV3FinishReason,
  LanguageModelV3StreamPart,
  LanguageModelV3Content,
  LanguageModelV3Usage,
} from "@ai-sdk/provider";
import type {
  ContentGenerator,
  ContentGeneratorConfig,
} from "@google/gemini-cli-core";

import {
  ThinkingLevel,
  type ThinkingConfigInput,
  mapGeminiFinishReason,
} from "./gemini";
import { initializeGeminiClient } from "./client";
import { mapGeminiError } from "./error";
import type { GeminiProviderOptions, Logger } from "./types";
import { getLogger, createVerboseLogger } from "./logger";
import {
  buildGeminiRequest,
  parseGenerateResponse,
  setupAbortHandler,
  cleanupAbortHandler,
} from "./gemini/language-model";

// Re-export ThinkingLevel for external use
export { ThinkingLevel };
export type { ThinkingConfigInput };

export interface GeminiLanguageModelOptions {
  modelId: string;
  providerOptions: GeminiProviderOptions;
  settings?: Record<string, unknown> & {
    logger?: Logger | false;
    verbose?: boolean;
  };
}

export class GeminiLanguageModel implements LanguageModelV3 {
  readonly specificationVersion = "v3" as const;
  readonly provider = "gemini-cli-core";
  readonly defaultObjectGenerationMode = "json" as const;
  readonly supportsImageUrls = false;
  readonly supportedUrls = {};
  readonly supportsStructuredOutputs = true;

  private contentGenerator?: ContentGenerator;
  private config?: ContentGeneratorConfig;
  private initPromise?: Promise<void>;

  readonly modelId: string;
  readonly settings?: Record<string, unknown>;
  private providerOptions: GeminiProviderOptions;
  private logger: Logger;

  constructor(options: GeminiLanguageModelOptions) {
    this.modelId = options.modelId;
    this.providerOptions = options.providerOptions;
    this.settings = options.settings;

    const baseLogger = getLogger(options.settings?.logger);
    this.logger = createVerboseLogger(
      baseLogger,
      options.settings?.verbose ?? false,
    );
  }

  private async ensureInitialized(): Promise<{
    contentGenerator: ContentGenerator;
    config: ContentGeneratorConfig;
  }> {
    if (this.contentGenerator && this.config) {
      return { contentGenerator: this.contentGenerator, config: this.config };
    }

    if (!this.initPromise) {
      this.initPromise = this.initialize();
    }

    await this.initPromise;
    return { contentGenerator: this.contentGenerator!, config: this.config! };
  }

  private async initialize(): Promise<void> {
    try {
      const { client, config } = await initializeGeminiClient(
        this.providerOptions,
        this.modelId,
      );
      this.contentGenerator = client;
      this.config = config;
    } catch (error) {
      throw new Error(`Failed to initialize Gemini model: ${String(error)}`);
    }
  }

  async doGenerate(options: LanguageModelV3CallOptions): Promise<{
    content: LanguageModelV3Content[];
    finishReason: LanguageModelV3FinishReason;
    usage: LanguageModelV3Usage;
    rawCall: { rawPrompt: unknown; rawSettings: Record<string, unknown> };
    rawResponse?: { body?: unknown };
    response?: { id?: string; timestamp?: Date; modelId?: string };
    warnings: SharedV3Warning[];
  }> {
    this.logger.debug(
      `[gemini-cli] Starting doGenerate request with model: ${this.modelId}`,
    );

    try {
      const { contentGenerator } = await this.ensureInitialized();
      const {
        request,
        generationConfig,
        warnings,
        contents,
        systemInstruction,
        tools,
      } = buildGeminiRequest(this.modelId, options, this.settings, this.logger);

      const { listener, checkAborted } = setupAbortHandler(options.abortSignal);

      let response;
      const startTime = Date.now();
      try {
        this.logger.debug("[gemini-cli] Executing generateContent request");
        response = await contentGenerator.generateContent(
          request,
          randomUUID(),
        );
        const duration = Date.now() - startTime;
        this.logger.info(
          `[gemini-cli] Request completed - Duration: ${duration}ms`,
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
          rawSettings: generationConfig,
        },
        rawResponse: { body: response },
        response: {
          id: randomUUID(),
          timestamp: new Date(),
          modelId: this.modelId,
        },
        warnings,
      };
    } catch (error) {
      this.logger.debug(
        `[gemini-cli] Error during doGenerate: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw mapGeminiError(error);
    }
  }

  async doStream(options: LanguageModelV3CallOptions): Promise<{
    stream: ReadableStream<LanguageModelV3StreamPart>;
    rawCall: { rawPrompt: unknown; rawSettings: Record<string, unknown> };
  }> {
    this.logger.debug(
      `[gemini-cli] Starting doStream request with model: ${this.modelId}`,
    );

    try {
      const { contentGenerator } = await this.ensureInitialized();
      const {
        request,
        generationConfig,
        warnings,
        contents,
        systemInstruction,
        tools,
      } = buildGeminiRequest(this.modelId, options, this.settings, this.logger);

      this.logger.debug(
        `[gemini-cli] Stream mode: ${options.responseFormat?.type === "json" ? "object-json" : "regular"}`,
      );

      // Log schema info for debugging structured output issues
      if (options.responseFormat?.type === "json") {
        this.logger.debug(
          `[gemini-cli] JSON Schema: ${JSON.stringify(options.responseFormat.schema, null, 2).slice(0, 500)}`,
        );
        this.logger.debug(
          `[gemini-cli] generationConfig.responseMimeType: ${(generationConfig as Record<string, unknown>).responseMimeType}`,
        );
        this.logger.debug(
          `[gemini-cli] generationConfig.responseJsonSchema: ${JSON.stringify((generationConfig as Record<string, unknown>).responseJsonSchema, null, 2)?.slice(0, 500)}`,
        );
      }

      const { listener, checkAborted } = setupAbortHandler(options.abortSignal);

      let streamResponse;
      try {
        this.logger.debug(
          "[gemini-cli] Starting generateContentStream request",
        );
        streamResponse = await contentGenerator.generateContentStream(
          request,
          randomUUID(),
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

      const stream = new ReadableStream<LanguageModelV3StreamPart>({
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
            let textPartId: string | undefined;
            let hasToolCalls = false;

            controller.enqueue({
              type: "stream-start",
              warnings: streamWarnings,
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
                totalOutputTokens =
                  chunk.usageMetadata.candidatesTokenCount || 0;
              }

              if (content?.parts) {
                for (const part of content.parts) {
                  if (part.text) {
                    if (!textPartId) {
                      textPartId = randomUUID();
                      controller.enqueue({
                        type: "text-start",
                        id: textPartId,
                      });
                    }
                    controller.enqueue({
                      type: "text-delta",
                      id: textPartId,
                      delta: part.text,
                    });
                  } else if (part.functionCall) {
                    hasToolCalls = true;
                    const geminiPart = part as { thoughtSignature?: string };
                    controller.enqueue({
                      type: "tool-call",
                      toolCallId: randomUUID(),
                      toolName: part.functionCall.name || "",
                      input: JSON.stringify(part.functionCall.args || {}),
                      ...(geminiPart.thoughtSignature
                        ? {
                            providerMetadata: {
                              "gemini-cli": {
                                thoughtSignature: geminiPart.thoughtSignature,
                              },
                            },
                          }
                        : {}),
                    });
                  }
                }
              }

              if (candidate?.finishReason) {
                const duration = Date.now() - streamStartTime;
                logger.info(
                  `[gemini-cli] Stream completed - Duration: ${duration}ms`,
                );
                logger.debug(
                  `[gemini-cli] Stream token usage - Input: ${totalInputTokens}, Output: ${totalOutputTokens}`,
                );

                if (textPartId) {
                  controller.enqueue({ type: "text-end", id: textPartId });
                }

                const finishReason = hasToolCalls
                  ? ({
                      unified: "tool-calls",
                      raw: candidate.finishReason,
                    } as LanguageModelV3FinishReason)
                  : mapGeminiFinishReason(candidate.finishReason);

                logger.debug(
                  `[gemini-cli] Stream finish reason: ${finishReason.unified}`,
                );

                controller.enqueue({
                  type: "response-metadata",
                  id: randomUUID(),
                  timestamp: new Date(),
                  modelId: modelId,
                });

                controller.enqueue({
                  type: "finish",
                  finishReason,
                  usage: {
                    inputTokens: {
                      total: totalInputTokens,
                      noCache: undefined,
                      cacheRead: undefined,
                      cacheWrite: undefined,
                    },
                    outputTokens: {
                      total: totalOutputTokens,
                      text: undefined,
                      reasoning: undefined,
                    },
                  },
                });
              }
            }

            logger.debug("[gemini-cli] Stream finalized, closing stream");
            controller.close();
          } catch (error) {
            logger.debug(
              `[gemini-cli] Error during doStream: ${error instanceof Error ? error.message : String(error)}`,
            );
            controller.error(mapGeminiError(error));
          } finally {
            cleanupAbortHandler(abortSignal, abortListener);
          }
        },
        cancel: () => {
          cleanupAbortHandler(abortSignal, abortListener);
        },
      });

      return {
        stream,
        rawCall: {
          rawPrompt: { contents, systemInstruction, generationConfig, tools },
          rawSettings: generationConfig,
        },
      };
    } catch (error) {
      this.logger.debug(
        `[gemini-cli] Error creating stream: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw mapGeminiError(error);
    }
  }
}

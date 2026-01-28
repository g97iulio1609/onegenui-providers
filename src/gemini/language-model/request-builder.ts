import type {
  LanguageModelV3CallOptions,
  LanguageModelV3FunctionTool,
  SharedV3Warning,
} from "@ai-sdk/provider";
import type { GenerateContentParameters } from "@google/genai";
import type { Logger } from "../../types";
import { mapPromptToGeminiFormat } from "../../message-mapper";
import { mapToolsToGeminiFormat } from "../../tool-mapper";
import { prepareGenerationConfig } from "..";

export interface BuildRequestResult {
  request: GenerateContentParameters;
  generationConfig: Record<string, unknown>;
  warnings: SharedV3Warning[];
  contents: unknown;
  systemInstruction: unknown;
  tools: unknown;
}

/**
 * Builds a GenerateContentParameters request from AI SDK options
 */
export function buildGeminiRequest(
  modelId: string,
  options: LanguageModelV3CallOptions,
  settings: Record<string, unknown> | undefined,
  logger: Logger,
): BuildRequestResult {
  // Map the prompt to Gemini format
  const { contents, systemInstruction } = mapPromptToGeminiFormat(options);

  logger.debug(
    `[gemini-cli] Request mode: ${options.responseFormat?.type === "json" ? "object-json" : "regular"}, response format: ${options.responseFormat?.type ?? "none"}`,
  );

  logger.debug(`[gemini-cli] Converted ${options.prompt.length} messages`);

  // Prepare generation config
  const { generationConfig, warnings } = prepareGenerationConfig(
    options,
    settings,
  );

  // Map tools if provided
  let tools;
  if (options.tools) {
    const functionTools = options.tools.filter(
      (tool): tool is LanguageModelV3FunctionTool => tool.type === "function",
    );
    if (functionTools.length > 0) {
      tools = mapToolsToGeminiFormat(functionTools);
    }
  }

  // Create the request parameters
  const request: GenerateContentParameters = {
    model: modelId,
    contents,
    config: {
      ...generationConfig,
      systemInstruction: systemInstruction,
      tools: tools,
    },
  };

  return {
    request,
    generationConfig: generationConfig as Record<string, unknown>,
    warnings,
    contents,
    systemInstruction,
    tools,
  };
}

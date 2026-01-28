import { randomUUID } from "node:crypto";
import type {
  LanguageModelV3Content,
  LanguageModelV3FinishReason,
  LanguageModelV3Usage,
} from "@ai-sdk/provider";
import type { Logger } from "../../types";
import { mapGeminiFinishReason } from "..";

interface GeminiPart {
  text?: string;
  functionCall?: {
    name?: string;
    args?: Record<string, unknown>;
  };
  thoughtSignature?: string;
}

interface GeminiCandidate {
  content?: {
    parts?: GeminiPart[];
  };
  finishReason?: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
}

export interface ParsedGenerateResponse {
  content: LanguageModelV3Content[];
  finishReason: LanguageModelV3FinishReason;
  usage: LanguageModelV3Usage;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Parse a non-streaming Gemini response into AI SDK v3 format
 */
export function parseGenerateResponse(
  response: GeminiResponse,
  logger: Logger,
): ParsedGenerateResponse {
  const candidate = response.candidates?.[0];
  const responseContent = candidate?.content;

  // Build content array
  const content: LanguageModelV3Content[] = [];
  let hasToolCalls = false;

  if (responseContent?.parts) {
    for (const part of responseContent.parts) {
      if (part.text) {
        content.push({
          type: "text",
          text: part.text,
        });
      } else if (part.functionCall) {
        hasToolCalls = true;
        content.push({
          type: "tool-call",
          toolCallId: randomUUID(),
          toolName: part.functionCall.name || "",
          input: JSON.stringify(part.functionCall.args || {}),
          ...(part.thoughtSignature
            ? {
                providerMetadata: {
                  "gemini-cli": {
                    thoughtSignature: part.thoughtSignature,
                  },
                },
              }
            : {}),
        } as LanguageModelV3Content);
      }
    }
  }

  // Calculate token usage
  const inputTokens = response.usageMetadata?.promptTokenCount || 0;
  const outputTokens = response.usageMetadata?.candidatesTokenCount || 0;
  const totalTokens = inputTokens + outputTokens;

  const usage: LanguageModelV3Usage = {
    inputTokens: {
      total: inputTokens,
      noCache: undefined,
      cacheRead: undefined,
      cacheWrite: undefined,
    },
    outputTokens: {
      total: outputTokens,
      text: undefined,
      reasoning: undefined,
    },
  };

  logger.debug(
    `[gemini-cli] Token usage - Input: ${inputTokens}, Output: ${outputTokens}, Total: ${totalTokens}`,
  );

  // Determine finish reason
  const finishReason = hasToolCalls
    ? ({
        unified: "tool-calls",
        raw: candidate?.finishReason,
      } as LanguageModelV3FinishReason)
    : mapGeminiFinishReason(candidate?.finishReason);

  logger.debug(`[gemini-cli] Finish reason: ${finishReason.unified}`);

  return {
    content,
    finishReason,
    usage,
    inputTokens,
    outputTokens,
  };
}

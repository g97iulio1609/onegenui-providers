# AGENTS.md - @onegenui/providers

Unified AI SDK provider registry for OneGenUI. Supports Gemini, OpenAI, Anthropic, and OpenRouter.

## Purpose

This package provides:
- **Provider Registry**: Unified access to multiple AI providers
- **Gemini Provider**: Custom Gemini implementation with streaming
- **Model Mapping**: Consistent model naming across providers
- **Tool Integration**: Convert tools for each provider format

## File Structure

```
src/
├── index.ts                    # Public exports
├── registry.ts                 # Provider registry
├── types.ts                    # Common types
├── client.ts                   # HTTP client utilities
├── error.ts                    # Error handling
├── logger.ts                   # Logging
├── validation.ts               # Input validation
├── gemini-provider.ts          # Gemini provider factory
├── gemini-language-model.ts    # Gemini model (NEEDS REFACTORING)
├── message-mapper.ts           # Message format conversion
└── tool-mapper.ts              # Tool format conversion
```

## Key Exports

```typescript
export { createProviderRegistry, getProvider } from './registry';
export { createGeminiProvider } from './gemini-provider';
export type { ProviderConfig, ModelConfig } from './types';
```

## Supported Providers

| Provider | Package | Models |
|----------|---------|--------|
| Gemini | Built-in | gemini-2.0-flash, gemini-1.5-pro |
| OpenAI | `@ai-sdk/openai` | gpt-4, gpt-3.5-turbo |
| Anthropic | `@ai-sdk/anthropic` | claude-3-opus, claude-3-sonnet |
| OpenRouter | `@openrouter/ai-sdk-provider` | Various |

## Development Guidelines

- Support streaming for all providers
- Handle rate limiting and errors gracefully
- Provide consistent API across providers
- Log API calls for debugging (redact sensitive data)
- Support tool/function calling

## Refactoring Priorities (from toBeta.md)

| File | LOC | Priority | Action |
|------|-----|----------|--------|
| `gemini-language-model.ts` | 841 | P1 | Split config, streaming, mapping, tools |

### Target Structure for gemini-language-model

```
gemini/
├── index.ts              # Public API
├── types.ts              # Gemini-specific types
├── config.ts             # Model configuration
├── streaming.ts          # Stream handling
├── message-mapper.ts     # Message format conversion
└── tool-handler.ts       # Tool/function calling
```

## Testing

```bash
pnpm --filter @onegenui/providers test
pnpm --filter @onegenui/providers type-check
```

## Dependencies

- `@ai-sdk/anthropic` ^1.1.6
- `@ai-sdk/openai` ^1.1.9
- `@ai-sdk/provider` ^3.0.0
- `@google/gemini-cli-core` 0.22.4
- `@google/genai` 1.30.0
- `@openrouter/ai-sdk-provider` ^0.0.5
- `zod` ^3.0.0 || ^4.0.0 (peer)

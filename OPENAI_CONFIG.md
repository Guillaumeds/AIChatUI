# 🔄 Switch to OpenAI Configuration

The app currently uses **xAI (Grok)** models by default. To switch to **OpenAI**, follow these steps:

## 1. Update Environment Variables

In your `.env.local`, replace:
```env
XAI_API_KEY=your-xai-key
```

With:
```env
OPENAI_API_KEY=sk-your-openai-key-here
```

## 2. Update Provider Configuration

Edit `lib/ai/providers.ts` and replace the xAI configuration:

```typescript
import { openai } from '@ai-sdk/openai';

// Replace the existing provider configuration with:
export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': openai('gpt-4o'),
        'chat-model-reasoning': wrapLanguageModel({
          model: openai('o1-preview'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': openai('gpt-4o-mini'),
        'artifact-model': openai('gpt-4o'),
      },
      imageModels: {
        'small-model': openai.imageModel('dall-e-3'),
      },
    });
```

## 3. Install OpenAI SDK

Add the OpenAI SDK dependency:
```bash
npm install @ai-sdk/openai
```

## 4. Update Imports

In `lib/ai/providers.ts`, change the import:
```typescript
// Remove this line:
import { xai } from '@ai-sdk/xai';

// Add this line:
import { openai } from '@ai-sdk/openai';
```

## 5. Restart Development Server

```bash
npm run dev
```

## Available OpenAI Models

- **gpt-4o**: Latest GPT-4 Omni model
- **gpt-4o-mini**: Faster, cheaper version
- **o1-preview**: Advanced reasoning model
- **dall-e-3**: Image generation model

## Cost Considerations

OpenAI pricing (approximate):
- **gpt-4o**: $15/1M input tokens, $60/1M output tokens
- **gpt-4o-mini**: $0.15/1M input tokens, $0.60/1M output tokens
- **o1-preview**: $15/1M input tokens, $60/1M output tokens

xAI Grok pricing is generally competitive with OpenAI.

Choose based on your needs:
- **OpenAI**: More established, extensive documentation
- **xAI**: Newer, potentially more innovative features

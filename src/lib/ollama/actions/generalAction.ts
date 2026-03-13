import { updateMessageContent } from '@store/slices/chatsSlice';
import {
  extractPartialResponse,
  ollamaClient,
  parseGeneralResponse,
} from '../ollama.service';
import { GENERAL_PROMPT } from '../prompts';
import { GENERAL_SCHEMA } from '../schemas';
import type { ActionHandler, ActionResult, StepContext, StepRuntime } from './types';

const MAX_CONTEXT_MESSAGES = 5;

export const generalAction = {
  type: 'general',
  description: 'General conversational response about cooking, nutrition, and meal planning',
  isMultiStep: false,

  async execute(
    model: string,
    context: StepContext<Record<string, unknown>>,
    runtime: StepRuntime,
  ): Promise<ActionResult<Record<string, unknown>>> {
    const { messages, chatId, messageId } = context;
    const { dispatch, abortSignal } = runtime;

    const stream = await ollamaClient.chat({
      model,
      messages: [
        { role: 'system', content: GENERAL_PROMPT },
        ...messages.slice(-MAX_CONTEXT_MESSAGES).map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.rawContent ?? m.content,
        })),
      ],
      stream: true,
      format: GENERAL_SCHEMA,
    });

    let rawContent = '';

    for await (const chunk of stream) {
      if (abortSignal?.aborted) {
        stream.abort();
        break;
      }

      rawContent += chunk.message.content;

      const displayContent = extractPartialResponse(rawContent);

      if (displayContent) {
        dispatch(updateMessageContent({ chatId, messageId, content: displayContent }));
      }
    }

    const parsed = parseGeneralResponse(rawContent);
    const content = parsed?.response ?? rawContent;

    return { type: 'general', data: { content, rawContent } };
  },
} satisfies ActionHandler<Record<string, unknown>>;

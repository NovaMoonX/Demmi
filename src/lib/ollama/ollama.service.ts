import { Ollama } from 'ollama/browser';
import { ChatMessage } from '@lib/chat';

const SYSTEM_PROMPT =
  'You are Demmi\'s AI assistant, specialized in helping users with cooking, recipes, meal planning, ingredients, and nutrition. ' +
  'Help users discover new meals, plan their weekly menu, understand ingredient combinations, and make informed food choices. ' +
  'Be concise, friendly, and practical.';

export const ollamaClient = new Ollama();

export async function listLocalModels(): Promise<string[]> {
  const response = await ollamaClient.list();
  return response.models.map((m) => m.name);
}

export async function* streamChatResponse(
  model: string,
  messages: ChatMessage[],
): AsyncGenerator<string> {
  const ollamaMessages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const stream = await ollamaClient.chat({
    model,
    messages: ollamaMessages,
    stream: true,
  });

  for await (const chunk of stream) {
    yield chunk.message.content;
  }
}

import { join } from '@moondreamsdev/dreamer-ui/utils';
import { ChatMessage as ChatMessageType } from '@lib/chat';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={join(
        'flex w-full mb-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={join(
          'max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-accent text-accent-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        {isStreaming && message.content === '' ? (
          <div className="flex gap-1">
            <span className="animate-bounce">●</span>
            <span className="animate-bounce [animation-delay:0.2s]">●</span>
            <span className="animate-bounce [animation-delay:0.4s]">●</span>
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words">
            {message.content}
            {isStreaming && <span className="ml-0.5 inline-block w-0.5 h-4 bg-current animate-pulse align-middle" />}
          </div>
        )}
      </div>
    </div>
  );
}

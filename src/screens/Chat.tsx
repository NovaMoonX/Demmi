import { useState, useRef, useEffect } from 'react';
import { Button } from '@moondreamsdev/dreamer-ui/components';
import { Textarea } from '@moondreamsdev/dreamer-ui/components';
import { ScrollArea } from '@moondreamsdev/dreamer-ui/components';
import { join } from '@moondreamsdev/dreamer-ui/utils';
import { ChevronLeft, ChevronRight } from '@moondreamsdev/dreamer-ui/symbols';
import { ChatHistory } from '@components/ChatHistory';
import { ChatMessage } from '@components/ChatMessage';
import {
  ChatConversation,
  ChatMessage as ChatMessageType,
  mockChatConversations,
  generateMockResponse,
} from '@lib/chat';

const CHAT_HISTORY_WIDTH = 256; // Width in pixels (matches w-64 = 16rem = 256px)

export function Chat() {
  const [conversations, setConversations] = useState<ChatConversation[]>(mockChatConversations);
  const [currentChatId, setCurrentChatId] = useState<string | null>(mockChatConversations[0]?.id || null);
  const [inputValue, setInputValue] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentChat = conversations.find((c) => c.id === currentChatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) {
      return;
    }

    const messageContent = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    // Create user message
    const userMessage: ChatMessageType = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: Date.now(),
    };

    // If no current chat, create a new one
    if (!currentChatId) {
      const newChat: ChatConversation = {
        id: `chat-${Date.now()}`,
        title: messageContent.slice(0, 50) + (messageContent.length > 50 ? '...' : ''),
        messages: [userMessage],
        isPinned: false,
        lastUpdated: Date.now(),
      };

      setConversations((prev) => [newChat, ...prev]);
      setCurrentChatId(newChat.id);

      // Simulate AI response
      setTimeout(() => {
        const assistantMessage: ChatMessageType = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: generateMockResponse(messageContent),
          timestamp: Date.now(),
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === newChat.id
              ? {
                  ...c,
                  messages: [...c.messages, assistantMessage],
                  lastUpdated: Date.now(),
                }
              : c
          )
        );
        setIsSending(false);
      }, 1000);
    } else {
      // Add message to existing chat
      setConversations((prev) =>
        prev.map((c) =>
          c.id === currentChatId
            ? {
                ...c,
                messages: [...c.messages, userMessage],
                lastUpdated: Date.now(),
              }
            : c
        )
      );

      // Simulate AI response
      setTimeout(() => {
        const assistantMessage: ChatMessageType = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: generateMockResponse(messageContent),
          timestamp: Date.now(),
        };

        setConversations((prev) =>
          prev.map((c) =>
            c.id === currentChatId
              ? {
                  ...c,
                  messages: [...c.messages, assistantMessage],
                  lastUpdated: Date.now(),
                }
              : c
          )
        );
        setIsSending(false);
      }, 1000);
    }
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
    setInputValue('');
  };

  const handleTogglePin = (chatId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === chatId ? { ...c, isPinned: !c.isPinned } : c
      )
    );
  };

  const handleDeleteChat = (chatId: string) => {
    setConversations((prev) => {
      const remainingChats = prev.filter((c) => c.id !== chatId);
      
      if (chatId === currentChatId) {
        setCurrentChatId(remainingChats[0]?.id || null);
      }
      
      return remainingChats;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Chat History Sidebar */}
      <div
        className={join(
          'transition-all duration-300 border-r border-border',
          isHistoryOpen ? 'w-64' : 'w-0'
        )}
      >
        {isHistoryOpen && (
          <ChatHistory
            conversations={conversations}
            currentChatId={currentChatId}
            onSelectChat={setCurrentChatId}
            onNewChat={handleNewChat}
            onTogglePin={handleTogglePin}
            onDeleteChat={handleDeleteChat}
          />
        )}
      </div>

      {/* Toggle History Button */}
      <button
        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
        className="absolute left-0 top-4 z-10 p-2 bg-card border border-border rounded-r-lg hover:bg-muted transition-colors"
        style={{
          left: isHistoryOpen ? `${CHAT_HISTORY_WIDTH}px` : '0px',
          transition: 'left 0.3s',
        }}
        aria-label={isHistoryOpen ? 'Hide history' : 'Show history'}
      >
        {isHistoryOpen ? (
          <ChevronLeft className="size-4 text-foreground" />
        ) : (
          <ChevronRight className="size-4 text-foreground" />
        )}
      </button>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Chat Header */}
        <div className="border-b border-border p-4 bg-card">
          <h2 className="text-lg font-semibold text-foreground">
            {currentChat?.title || 'New Chat'}
          </h2>
          {currentChat && (
            <p className="text-sm text-muted-foreground">
              {currentChat.messages.length} message{currentChat.messages.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4 md:p-6">
          {currentChat ? (
            <div className="max-w-4xl mx-auto">
              {currentChat.messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isSending && (
                <div className="flex justify-start mb-4">
                  <div className="max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 bg-muted text-foreground">
                    <div className="flex gap-1">
                      <span className="animate-bounce">●</span>
                      <span className="animate-bounce [animation-delay:0.2s]">●</span>
                      <span className="animate-bounce [animation-delay:0.4s]">●</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4 max-w-md">
                <div className="text-6xl">💬</div>
                <h2 className="text-2xl font-bold text-foreground">
                  Start a New Conversation
                </h2>
                <p className="text-muted-foreground">
                  Ask me anything about cooking, recipes, meal planning, or ingredients!
                </p>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-card">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              className="flex-1 min-h-[44px] max-h-[200px] resize-none"
              disabled={isSending}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isSending}
              variant="primary"
              className="self-end"
            >
              ➤
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;

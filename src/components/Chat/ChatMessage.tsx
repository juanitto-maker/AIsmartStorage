// ============================================================================
// ChatMessage Component - Individual chat message display
// ============================================================================

import { Component, Show, createMemo } from 'solid-js';
import type { ChatMessage as ChatMessageType } from '../../types';
import { cn } from '../../utils/helpers';
import { SparklesIcon } from '../Common/Icons';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: Component<ChatMessageProps> = (props) => {
  const isUser = () => props.message.role === 'user';
  const isAssistant = () => props.message.role === 'assistant';

  // Simple markdown-like rendering for messages
  const formattedContent = createMemo(() => {
    let content = props.message.content;

    // Convert **bold** to <strong>
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert *italic* to <em>
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Convert `code` to <code>
    content = content.replace(/`(.*?)`/g, '<code class="px-1 py-0.5 bg-dark-700 rounded text-accent-info">$1</code>');

    // Convert - list items
    content = content.replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>');

    // Convert newlines to <br>
    content = content.replace(/\n/g, '<br>');

    return content;
  });

  const formatTime = () => {
    const date = new Date(props.message.timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      class={cn(
        'flex gap-3 animate-fade-in',
        isUser() && 'flex-row-reverse'
      )}
    >
      {/* Avatar */}
      <div
        class={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser() ? 'bg-accent-primary' : 'bg-accent-secondary'
        )}
      >
        <Show when={isUser()} fallback={<SparklesIcon size={16} class="text-white" />}>
          <span class="text-white text-sm font-medium">U</span>
        </Show>
      </div>

      {/* Message bubble */}
      <div
        class={cn(
          'flex-1 max-w-[85%]',
          isUser() && 'flex flex-col items-end'
        )}
      >
        <div
          class={cn(
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
            isUser()
              ? 'bg-accent-primary text-white rounded-tr-sm'
              : 'bg-dark-800 text-dark-100 rounded-tl-sm border border-dark-700'
          )}
          innerHTML={formattedContent()}
        />

        {/* Timestamp */}
        <span class="text-xs text-dark-600 mt-1 px-1">
          {formatTime()}
        </span>
      </div>
    </div>
  );
};

// Loading message with typing indicator
export const TypingIndicator: Component = () => (
  <div class="flex gap-3 animate-fade-in">
    <div class="flex-shrink-0 w-8 h-8 rounded-full bg-accent-secondary flex items-center justify-center">
      <SparklesIcon size={16} class="text-white" />
    </div>
    <div class="bg-dark-800 px-4 py-3 rounded-2xl rounded-tl-sm border border-dark-700">
      <div class="flex gap-1">
        <span class="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style="animation-delay: 0ms" />
        <span class="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style="animation-delay: 150ms" />
        <span class="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style="animation-delay: 300ms" />
      </div>
    </div>
  </div>
);

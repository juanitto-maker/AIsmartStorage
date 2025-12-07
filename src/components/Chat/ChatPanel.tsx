// ============================================================================
// ChatPanel Component - Main chat interface
// ============================================================================

import { Component, For, Show, createEffect, onMount } from 'solid-js';
import { chatStore, historyStore } from '../../stores';
import { ChatMessage, TypingIndicator } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { MessageCircleIcon, RefreshIcon } from '../Common/Icons';

export const ChatPanel: Component = () => {
  let messagesContainerRef: HTMLDivElement | undefined;

  const messages = () => chatStore.messages();
  const isProcessing = () => chatStore.isProcessing();
  const modelLoading = () => chatStore.modelLoading();
  const modelStatus = () => chatStore.modelStatus();

  // Initialize history store and AI model on mount
  onMount(async () => {
    await historyStore.init();
    // Initialize AI model in background
    chatStore.initAI();
  });

  // Auto-scroll to bottom when new messages arrive
  createEffect(() => {
    const _ = messages().length; // Track changes
    if (messagesContainerRef) {
      setTimeout(() => {
        messagesContainerRef!.scrollTop = messagesContainerRef!.scrollHeight;
      }, 100);
    }
  });

  const handleClearChat = () => {
    if (confirm('Clear chat history?')) {
      chatStore.clearChat();
    }
  };

  return (
    <div class="flex flex-col h-full bg-dark-900">
      {/* Header */}
      <div class="flex-shrink-0 p-3 border-b border-dark-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <MessageCircleIcon size={20} class="text-accent-info" />
            <h2 class="text-sm font-semibold text-dark-100">AI Assistant</h2>
            <Show
              when={!modelLoading()}
              fallback={
                <span class="px-2 py-0.5 bg-accent-warning/20 text-accent-warning text-xs rounded-full animate-pulse">
                  Loading...
                </span>
              }
            >
              <span class="px-2 py-0.5 bg-accent-success/20 text-accent-success text-xs rounded-full">
                {modelStatus()?.modelName || 'SmolLM2'}
              </span>
            </Show>
          </div>
          <button
            onClick={handleClearChat}
            class="p-1.5 rounded hover:bg-dark-700 text-dark-400 hover:text-dark-200 transition-colors"
            title="Clear chat"
          >
            <RefreshIcon size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        class="flex-1 overflow-y-auto p-4 space-y-4"
      >
        <For each={messages()}>
          {(message) => <ChatMessage message={message} />}
        </For>

        {/* Typing indicator */}
        <Show when={isProcessing()}>
          <TypingIndicator />
        </Show>
      </div>

      {/* Input */}
      <ChatInput />
    </div>
  );
};

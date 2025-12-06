// ============================================================================
// ChatInput Component - Message input with suggestions
// ============================================================================

import { Component, Show, For, createSignal } from 'solid-js';
import { chatStore } from '../../stores';
import { SendIcon } from '../Common/Icons';
import type { ChatSuggestion } from '../../types';

export const ChatInput: Component = () => {
  let inputRef: HTMLTextAreaElement | undefined;
  const [isFocused, setIsFocused] = createSignal(false);

  const inputValue = () => chatStore.inputValue();
  const isProcessing = () => chatStore.isProcessing();
  const suggestions = () => chatStore.suggestions();

  const handleSubmit = (e?: Event) => {
    e?.preventDefault();
    const value = inputValue().trim();
    if (value && !isProcessing()) {
      chatStore.sendMessage(value);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    chatStore.setInputValue(target.value);

    // Auto-resize textarea
    target.style.height = 'auto';
    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
  };

  const handleSuggestionClick = (suggestion: ChatSuggestion) => {
    chatStore.useSuggestion(suggestion);
  };

  return (
    <div class="border-t border-dark-700 bg-dark-850">
      {/* Suggestions */}
      <Show when={!inputValue() && !isProcessing()}>
        <div class="px-3 pt-3 pb-2">
          <div class="flex flex-wrap gap-2">
            <For each={suggestions()}>
              {(suggestion) => (
                <button
                  onClick={() => handleSuggestionClick(suggestion)}
                  class="flex items-center gap-1.5 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 border border-dark-700 rounded-full text-xs text-dark-300 hover:text-dark-100 transition-colors"
                >
                  <span>{suggestion.icon}</span>
                  <span>{suggestion.text}</span>
                </button>
              )}
            </For>
          </div>
        </div>
      </Show>

      {/* Input area */}
      <div class="p-3">
        <form onSubmit={handleSubmit} class="relative">
          <textarea
            ref={inputRef}
            value={inputValue()}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Type a message..."
            disabled={isProcessing()}
            rows={1}
            class="w-full px-4 py-3 pr-12 bg-dark-800 border border-dark-700 rounded-xl text-sm text-dark-100 placeholder-dark-500 resize-none focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/25 disabled:opacity-50 transition-all"
            style="min-height: 48px; max-height: 120px;"
          />
          <button
            type="submit"
            disabled={!inputValue().trim() || isProcessing()}
            class="absolute right-2 bottom-2 w-8 h-8 flex items-center justify-center bg-accent-primary hover:bg-accent-primary/90 disabled:bg-dark-700 disabled:text-dark-500 text-white rounded-lg transition-colors"
          >
            <SendIcon size={16} />
          </button>
        </form>

        {/* Privacy note */}
        <p class="mt-2 text-center text-xs text-dark-600">
          100% local processing - your files never leave your device
        </p>
      </div>
    </div>
  );
};

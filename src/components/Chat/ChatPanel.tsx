// ============================================================================
// ChatPanel Component - Main chat interface
// ============================================================================

import { Component, For, Show, createEffect, onMount, createSignal } from 'solid-js';
import { chatStore, historyStore, aiStore } from '../../stores';
import { ChatMessage, TypingIndicator } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { MessageCircleIcon, RefreshIcon, DownloadIcon } from '../Common/Icons';

export const ChatPanel: Component = () => {
  let messagesContainerRef: HTMLDivElement | undefined;
  const [showDownloadDialog, setShowDownloadDialog] = createSignal(false);

  const messages = () => chatStore.messages();
  const isProcessing = () => chatStore.isProcessing();

  // Initialize stores on mount
  onMount(async () => {
    await historyStore.init();
    await aiStore.init();

    // Show download dialog if model not downloaded (after init completes)
    // Wait a brief moment to let any state transitions settle
    setTimeout(() => {
      if (aiStore.needsDownload()) {
        setShowDownloadDialog(true);
      }
    }, 100);
  });

  // Handle download click
  const handleDownload = async () => {
    await aiStore.downloadModel();
    if (aiStore.isReady()) {
      setShowDownloadDialog(false);
    }
  };

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
            <span
              class={`px-2 py-0.5 text-xs rounded-full ${aiStore.statusBadgeClass()}`}
              onClick={() => aiStore.needsDownload() && setShowDownloadDialog(true)}
              style={{ cursor: aiStore.needsDownload() ? 'pointer' : 'default' }}
            >
              <Show when={aiStore.isReady()}>Ready</Show>
              <Show when={aiStore.isDownloading()}>
                Downloading... {Math.round(aiStore.status().progress || 0)}%
              </Show>
              <Show when={aiStore.isLoading()}>Loading...</Show>
              <Show when={aiStore.hasError()}>Error</Show>
              <Show when={aiStore.needsDownload()}>No Model</Show>
            </span>
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

      {/* Download Dialog Modal */}
      <Show when={showDownloadDialog()}>
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-dark-800 rounded-lg p-6 max-w-md w-full mx-4 border border-dark-700 shadow-xl">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-accent-info/20 flex items-center justify-center">
                <DownloadIcon size={20} class="text-accent-info" />
              </div>
              <div>
                <h3 class="text-lg font-semibold text-dark-100">Download AI Model</h3>
                <p class="text-sm text-dark-400">Required for local AI assistance</p>
              </div>
            </div>

            <div class="mb-4">
              <p class="text-sm text-dark-300 mb-3">
                Smart Storage AI needs to download a small language model (~92MB) to provide
                intelligent file organization suggestions. This only happens once.
              </p>

              <div class="bg-dark-900 rounded-lg p-3 text-xs text-dark-400">
                <div class="flex justify-between mb-1">
                  <span>Model:</span>
                  <span class="text-dark-200">SmolLM2-135M-Instruct</span>
                </div>
                <div class="flex justify-between mb-1">
                  <span>Size:</span>
                  <span class="text-dark-200">~92 MB</span>
                </div>
                <div class="flex justify-between">
                  <span>Privacy:</span>
                  <span class="text-accent-success">100% Local</span>
                </div>
              </div>
            </div>

            {/* Progress bar when downloading */}
            <Show when={aiStore.isDownloading()}>
              <div class="mb-4">
                <div class="flex justify-between text-xs text-dark-400 mb-1">
                  <span>Downloading...</span>
                  <span>{Math.round(aiStore.status().progress || 0)}%</span>
                </div>
                <div class="w-full bg-dark-700 rounded-full h-2">
                  <div
                    class="bg-accent-info h-2 rounded-full transition-all duration-300"
                    style={{ width: `${aiStore.status().progress || 0}%` }}
                  />
                </div>
              </div>
            </Show>

            <Show when={aiStore.isLoading()}>
              <div class="mb-4 text-center text-sm text-dark-300">
                <div class="animate-pulse">Loading model into memory...</div>
              </div>
            </Show>

            <Show when={aiStore.hasError()}>
              <div class="mb-4 p-3 bg-accent-error/10 border border-accent-error/30 rounded-lg">
                <p class="text-sm text-accent-error">
                  {aiStore.status().message || 'Download failed. Please try again.'}
                </p>
              </div>
            </Show>

            <div class="flex gap-3">
              <button
                onClick={() => setShowDownloadDialog(false)}
                class="flex-1 px-4 py-2 text-sm rounded-lg border border-dark-600 text-dark-300 hover:bg-dark-700 transition-colors"
                disabled={aiStore.isDownloading() || aiStore.isLoading()}
              >
                Later
              </button>
              <button
                onClick={handleDownload}
                class="flex-1 px-4 py-2 text-sm rounded-lg bg-accent-info text-white hover:bg-accent-info/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={aiStore.isDownloading() || aiStore.isLoading()}
              >
                <Show when={aiStore.isDownloading() || aiStore.isLoading()} fallback="Download Now">
                  {aiStore.isDownloading() ? 'Downloading...' : 'Loading...'}
                </Show>
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};

// ============================================================================
// Model Download Modal - First launch download dialog
// ============================================================================

import { Component, Show, createMemo } from 'solid-js';
import { modelStore } from '../../stores';
import { cn } from '../../utils/helpers';

export const ModelDownloadModal: Component = () => {
  const state = modelStore.modelState;
  const progress = modelStore.downloadProgress;
  const config = modelStore.modelConfig;
  const error = modelStore.error;
  const showModal = modelStore.showDownloadModal;

  const isDownloading = createMemo(() =>
    state() === 'downloading' || state() === 'verifying'
  );

  const progressBarWidth = createMemo(() => {
    const p = progress();
    return `${Math.min(100, p.percentage)}%`;
  });

  const downloadedText = createMemo(() => {
    const p = progress();
    return `${modelStore.formatBytes(p.downloaded)} / ${modelStore.formatBytes(p.total)}`;
  });

  return (
    <Show when={showModal()}>
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div class="bg-dark-900 border border-dark-700 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div class="p-6 border-b border-dark-700">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center">
                <BrainIcon class="w-6 h-6 text-accent-primary" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-white">
                  {isDownloading() ? 'Downloading AI Model' : 'Download AI Model?'}
                </h2>
                <p class="text-sm text-dark-400">
                  {config()?.model_name || 'SmolLM2-135M-Instruct'}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div class="p-6 space-y-4">
            <Show when={!isDownloading() && state() !== 'error'}>
              <p class="text-dark-300 text-sm leading-relaxed">
                Smart Storage AI needs to download a small AI model to work offline.
                This is a one-time download.
              </p>

              <div class="bg-dark-800 rounded-lg p-4 space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-dark-400">Size</span>
                  <span class="text-white font-medium">
                    ~{modelStore.modelSizeMB()} MB
                  </span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-dark-400">Source</span>
                  <span class="text-white font-medium">HuggingFace</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-dark-400">After download</span>
                  <span class="text-green-400 font-medium">100% Offline</span>
                </div>
              </div>
            </Show>

            <Show when={isDownloading()}>
              <div class="space-y-3">
                <div class="flex justify-between text-sm">
                  <span class="text-dark-400">{progress().status}</span>
                  <span class="text-white font-medium">{progress().percentage.toFixed(1)}%</span>
                </div>

                {/* Progress bar */}
                <div class="h-3 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    class={cn(
                      "h-full rounded-full transition-all duration-300",
                      state() === 'verifying'
                        ? "bg-yellow-500 animate-pulse"
                        : "bg-accent-primary"
                    )}
                    style={{ width: progressBarWidth() }}
                  />
                </div>

                <p class="text-dark-400 text-xs text-center">
                  {downloadedText()}
                </p>
              </div>
            </Show>

            <Show when={state() === 'error'}>
              <div class="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p class="text-red-400 text-sm font-medium mb-2">Download Failed</p>
                <p class="text-red-300 text-xs">{error()}</p>
              </div>
            </Show>
          </div>

          {/* Footer */}
          <div class="p-6 pt-0 flex gap-3">
            <Show when={!isDownloading() && state() !== 'error'}>
              <button
                onClick={() => modelStore.dismissModal()}
                class="flex-1 px-4 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Skip for Now
              </button>
              <button
                onClick={() => modelStore.startDownload()}
                class="flex-1 px-4 py-3 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Download ({modelStore.modelSizeMB()} MB)
              </button>
            </Show>

            <Show when={isDownloading()}>
              <button
                onClick={() => modelStore.cancelDownload()}
                class="flex-1 px-4 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </Show>

            <Show when={state() === 'error'}>
              <button
                onClick={() => modelStore.dismissModal()}
                class="flex-1 px-4 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Close
              </button>
              <button
                onClick={() => modelStore.retryDownload()}
                class="flex-1 px-4 py-3 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Retry
              </button>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
};

// Brain icon for the modal
const BrainIcon: Component<{ class?: string }> = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class={props.class}
  >
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
  </svg>
);

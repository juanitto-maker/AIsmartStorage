// ============================================================================
// Model Store - Manages AI model download state
// ============================================================================

import { createSignal, createMemo } from 'solid-js';

// Check if running in Tauri environment
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

// Types
export interface ModelConfig {
  model_name: string;
  download_url: string;
  file_name: string;
  size_bytes: number;
  checksum_sha256: string;
}

export interface ModelStatus {
  exists: boolean;
  path: string | null;
  config: ModelConfig;
}

export interface DownloadProgress {
  downloaded: number;
  total: number;
  percentage: number;
  status: string;
}

export type ModelState =
  | 'checking'      // Checking if model exists
  | 'not_found'     // Model not downloaded
  | 'prompt'        // Showing download prompt
  | 'downloading'   // Download in progress
  | 'verifying'     // Verifying checksum
  | 'ready'         // Model ready to use
  | 'error';        // Error occurred

// State
const [modelState, setModelState] = createSignal<ModelState>('checking');
const [modelConfig, setModelConfig] = createSignal<ModelConfig | null>(null);
const [modelPath, setModelPath] = createSignal<string | null>(null);
const [downloadProgress, setDownloadProgress] = createSignal<DownloadProgress>({
  downloaded: 0,
  total: 0,
  percentage: 0,
  status: '',
});
const [error, setError] = createSignal<string | null>(null);
const [showDownloadModal, setShowDownloadModal] = createSignal(false);

// Computed
const isModelReady = createMemo(() => modelState() === 'ready');
const isDownloading = createMemo(() => modelState() === 'downloading');
const modelSizeMB = createMemo(() => {
  const config = modelConfig();
  return config ? Math.round(config.size_bytes / 1024 / 1024) : 0;
});

/**
 * Initialize model store - check if model exists
 */
async function init(): Promise<void> {
  if (!isTauri) {
    // In web mode, simulate model ready for demo
    console.log('Web mode: Simulating model ready state');
    setModelState('ready');
    return;
  }

  setModelState('checking');
  setError(null);

  try {
    // Dynamic import for Tauri
    const { invoke } = await import('@tauri-apps/api/core');
    const { listen } = await import('@tauri-apps/api/event');

    // Listen for download progress events
    await listen<DownloadProgress>('model-download-progress', (event) => {
      setDownloadProgress(event.payload);

      if (event.payload.status.includes('Verifying')) {
        setModelState('verifying');
      }
    });

    // Check if model exists
    const status = await invoke<ModelStatus>('check_model_exists');
    setModelConfig(status.config);

    if (status.exists && status.path) {
      setModelPath(status.path);
      setModelState('ready');
      console.log('AI model ready:', status.path);
    } else {
      setModelState('not_found');
      setShowDownloadModal(true);
    }
  } catch (err) {
    console.error('Error checking model:', err);
    setError(String(err));
    setModelState('error');
  }
}

/**
 * Start downloading the model
 */
async function startDownload(): Promise<void> {
  if (!isTauri) {
    console.log('Web mode: Cannot download model');
    return;
  }

  setModelState('downloading');
  setError(null);
  setDownloadProgress({
    downloaded: 0,
    total: modelConfig()?.size_bytes || 0,
    percentage: 0,
    status: 'Starting download...',
  });

  try {
    const { invoke } = await import('@tauri-apps/api/core');

    const path = await invoke<string>('download_model');
    setModelPath(path);
    setModelState('ready');
    setShowDownloadModal(false);
    console.log('Model downloaded successfully:', path);
  } catch (err) {
    console.error('Download failed:', err);
    setError(String(err));
    setModelState('error');
  }
}

/**
 * Cancel ongoing download
 */
async function cancelDownload(): Promise<void> {
  if (!isTauri) return;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('cancel_download');
    setModelState('not_found');
    setShowDownloadModal(false);
    setDownloadProgress({
      downloaded: 0,
      total: 0,
      percentage: 0,
      status: '',
    });
  } catch (err) {
    console.error('Cancel failed:', err);
  }
}

/**
 * Retry download after error
 */
function retryDownload(): void {
  setError(null);
  setModelState('not_found');
  startDownload();
}

/**
 * Dismiss the download modal (skip download for now)
 */
function dismissModal(): void {
  setShowDownloadModal(false);
}

/**
 * Show the download modal
 */
function promptDownload(): void {
  setShowDownloadModal(true);
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Export store
export const modelStore = {
  // State
  modelState,
  modelConfig,
  modelPath,
  downloadProgress,
  error,
  showDownloadModal,

  // Computed
  isModelReady,
  isDownloading,
  modelSizeMB,

  // Actions
  init,
  startDownload,
  cancelDownload,
  retryDownload,
  dismissModal,
  promptDownload,

  // Helpers
  formatBytes,
};

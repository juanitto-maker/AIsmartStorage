// ============================================================================
// AI Store - Manages AI model status and inference
// ============================================================================

import { createSignal, createEffect } from 'solid-js';
import type { AiStatus, AiStatusType, DownloadProgress } from '../types';

// Check if running in Tauri environment
const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

// Dynamic import for Tauri APIs
let invoke: ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null;
let listen: ((event: string, handler: (event: { payload: unknown }) => void) => Promise<() => void>) | null = null;

// Initialize Tauri APIs
async function initTauriApis() {
  if (isTauri() && !invoke) {
    try {
      const core = await import('@tauri-apps/api/core');
      const event = await import('@tauri-apps/api/event');
      invoke = core.invoke;
      listen = event.listen;
    } catch (e) {
      console.warn('Failed to load Tauri APIs:', e);
    }
  }
}

// State
const [status, setStatus] = createSignal<AiStatus>({ type: 'not_downloaded' });
const [downloadProgress, setDownloadProgress] = createSignal<DownloadProgress | null>(null);
const [isInitialized, setIsInitialized] = createSignal(false);

// Computed helpers
const isReady = () => status().type === 'ready';
const isDownloading = () => status().type === 'downloading';
const isLoading = () => status().type === 'loading';
const hasError = () => status().type === 'error';
const needsDownload = () => status().type === 'not_downloaded';

// Status display text
const statusText = () => {
  const s = status();
  switch (s.type) {
    case 'not_downloaded':
      return 'Download Required';
    case 'downloading':
      return `Downloading... ${Math.round(s.progress || 0)}%`;
    case 'loading':
      return 'Loading...';
    case 'ready':
      return 'Ready';
    case 'error':
      return `Error: ${s.message || 'Unknown error'}`;
    default:
      return 'Unknown';
  }
};

// Status badge class
const statusBadgeClass = () => {
  const s = status();
  switch (s.type) {
    case 'ready':
      return 'bg-accent-success/20 text-accent-success';
    case 'downloading':
    case 'loading':
      return 'bg-accent-warning/20 text-accent-warning';
    case 'error':
      return 'bg-accent-error/20 text-accent-error';
    default:
      return 'bg-dark-600/20 text-dark-400';
  }
};

// Parse status from backend
function parseBackendStatus(backendStatus: unknown): AiStatus {
  if (typeof backendStatus === 'string') {
    switch (backendStatus) {
      case 'not_downloaded':
        return { type: 'not_downloaded' };
      case 'loading':
        return { type: 'loading' };
      case 'ready':
        return { type: 'ready' };
      default:
        return { type: 'not_downloaded' };
    }
  }

  if (typeof backendStatus === 'object' && backendStatus !== null) {
    const obj = backendStatus as Record<string, unknown>;

    if ('downloading' in obj) {
      const downloading = obj.downloading as { progress: number };
      return { type: 'downloading', progress: downloading.progress };
    }

    if ('error' in obj) {
      const error = obj.error as { message: string };
      return { type: 'error', message: error.message };
    }
  }

  return { type: 'not_downloaded' };
}

// Initialize AI and check model status
async function init(): Promise<void> {
  if (isInitialized()) return;

  await initTauriApis();

  if (!isTauri() || !invoke) {
    // In web mode, use mock "ready" status for demo
    setStatus({ type: 'ready' });
    setIsInitialized(true);
    return;
  }

  try {
    // Set up event listeners for status updates
    if (listen) {
      listen('ai-status', (event) => {
        const newStatus = parseBackendStatus(event.payload);
        setStatus(newStatus);
      });

      listen('download-progress', (event) => {
        const progress = event.payload as DownloadProgress;
        setDownloadProgress(progress);
      });
    }

    // Check current model status
    const result = await invoke('init_ai');
    const parsedStatus = parseBackendStatus(result);
    setStatus(parsedStatus);
    setIsInitialized(true);
  } catch (error) {
    console.error('AI init error:', error);
    setStatus({ type: 'error', message: String(error) });
    setIsInitialized(true);
  }
}

// Download the model
async function downloadModel(): Promise<boolean> {
  if (!isTauri() || !invoke) {
    // Mock download for web demo
    setStatus({ type: 'downloading', progress: 0 });

    // Simulate download progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise((r) => setTimeout(r, 100));
      setStatus({ type: 'downloading', progress: i });
    }

    setStatus({ type: 'loading' });
    await new Promise((r) => setTimeout(r, 500));
    setStatus({ type: 'ready' });
    return true;
  }

  try {
    setStatus({ type: 'downloading', progress: 0 });
    await invoke('download_model');

    // After download completes, load the model
    setStatus({ type: 'loading' });
    await invoke('load_model');

    setStatus({ type: 'ready' });
    return true;
  } catch (error) {
    console.error('Download error:', error);
    setStatus({ type: 'error', message: String(error) });
    return false;
  }
}

// Generate AI response
async function generateResponse(prompt: string): Promise<string> {
  if (!isTauri() || !invoke) {
    // Return mock response for web demo
    return generateMockResponse(prompt);
  }

  if (!isReady()) {
    throw new Error('Model not ready');
  }

  try {
    const response = await invoke('generate_response', { prompt });
    return response as string;
  } catch (error) {
    console.error('Generate response error:', error);
    throw error;
  }
}

// Mock response for web demo
function generateMockResponse(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();

  if (lowerPrompt.includes('organize') || lowerPrompt.includes('sort')) {
    return "I'll help you organize your files. I can sort them by type, date, or size. Just tell me which method you prefer!";
  }

  if (lowerPrompt.includes('find') || lowerPrompt.includes('search')) {
    return "I'll search through your files to find what you're looking for. The results will appear in the file browser.";
  }

  if (lowerPrompt.includes('space') || lowerPrompt.includes('storage')) {
    return "I'll analyze your storage usage and show you what's taking up the most space.";
  }

  if (lowerPrompt.includes('help')) {
    return "I can help you organize files by type/date/size, search for specific files, and analyze storage usage. Just ask!";
  }

  return "I understand. How can I help you organize your files today?";
}

// Export store
export const aiStore = {
  // State
  status,
  downloadProgress,
  isInitialized,

  // Computed
  isReady,
  isDownloading,
  isLoading,
  hasError,
  needsDownload,
  statusText,
  statusBadgeClass,

  // Actions
  init,
  downloadModel,
  generateResponse,
};

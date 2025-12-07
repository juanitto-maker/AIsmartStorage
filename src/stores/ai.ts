// ============================================================================
// AI Store - Manages AI model status and inference
// Uses wllama (WebAssembly llama.cpp) for browser-based inference
// ============================================================================

import { createSignal } from 'solid-js';
import type { AiStatus, DownloadProgress } from '../types';

// Model configuration
const MODEL_URL = 'https://huggingface.co/bartowski/SmolLM2-135M-Instruct-GGUF/resolve/main/SmolLM2-135M-Instruct-Q4_K_M.gguf';
const MODEL_SIZE_MB = 92;
const MODEL_STORAGE_KEY = 'smartstorage_ai_model';
const MODEL_DOWNLOADED_KEY = 'smartstorage_model_downloaded';

// Embedded model state
let embeddedModelAvailable = false;

// Check if running in Tauri environment
const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

// Check if running in Capacitor (Android/iOS)
const isCapacitor = () => {
  return typeof window !== 'undefined' && 'Capacitor' in window;
};

// Paths to try for embedded model (in order of preference)
const EMBEDDED_MODEL_PATHS = [
  '/models/smollm2-135m-instruct-q4_k_m.gguf',
  './models/smollm2-135m-instruct-q4_k_m.gguf',
  'models/smollm2-135m-instruct-q4_k_m.gguf',
  '/public/models/smollm2-135m-instruct-q4_k_m.gguf',
];

// Store which path works for later loading
let workingModelPath: string | null = null;

// Check if embedded model is available (Android APK)
async function checkEmbeddedModel(): Promise<boolean> {
  if (!isCapacitor()) {
    console.log('Not running in Capacitor, skipping embedded model check');
    return false;
  }

  console.log('Checking for embedded AI model in APK assets...');

  // Try each path - use GET with range header to just check if file exists
  // HEAD requests often don't work on Android local assets
  for (const path of EMBEDDED_MODEL_PATHS) {
    try {
      console.log(`Trying path: ${path}`);
      const response = await fetch(path, {
        method: 'GET',
        headers: {
          'Range': 'bytes=0-1024' // Only fetch first 1KB to verify file exists
        }
      });

      if (response.ok || response.status === 206) {
        // Check if it looks like a GGUF file (magic number: 0x46554747 = "GGUF")
        const buffer = await response.arrayBuffer();
        const view = new DataView(buffer);
        if (buffer.byteLength >= 4) {
          const magic = view.getUint32(0, true);
          if (magic === 0x46554747) { // "GGUF" in little-endian
            console.log(`Embedded AI model found at: ${path}`);
            workingModelPath = path;
            embeddedModelAvailable = true;
            return true;
          }
        }
        // Even without magic check, if we got data and response is ok
        if (buffer.byteLength > 0) {
          console.log(`File found at ${path} (${buffer.byteLength} bytes preview)`);
          workingModelPath = path;
          embeddedModelAvailable = true;
          return true;
        }
      }
    } catch (e) {
      console.log(`Path ${path} failed:`, e);
    }
  }

  console.log('No embedded AI model found, will use download');
  return false;
}

// Dynamic import for Tauri APIs
let invoke: ((cmd: string, args?: Record<string, unknown>) => Promise<unknown>) | null = null;
let listen: ((event: string, handler: (event: { payload: unknown }) => void) => Promise<() => void>) | null = null;

// Wllama instance for web inference
let wllamaInstance: any = null;
let modelLoaded = false;

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
      return 'No Model';
    case 'downloading':
      return `Downloading ${Math.round(s.progress || 0)}%`;
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

// Parse status from backend (for Tauri)
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

// Check if model is already downloaded (for web)
async function checkModelDownloaded(): Promise<boolean> {
  try {
    const downloaded = localStorage.getItem(MODEL_DOWNLOADED_KEY);
    if (downloaded !== 'true') return false;

    // Verify model exists in cache
    if ('caches' in window) {
      const cache = await caches.open(MODEL_STORAGE_KEY);
      const response = await cache.match(MODEL_URL);
      return response !== undefined;
    }
    return false;
  } catch (e) {
    console.warn('Error checking model status:', e);
    return false;
  }
}

// Initialize AI and check model status
async function init(): Promise<void> {
  if (isInitialized()) return;

  await initTauriApis();

  if (isTauri() && invoke) {
    // Tauri mode - use backend
    try {
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

      const result = await invoke('init_ai');
      const parsedStatus = parseBackendStatus(result);
      setStatus(parsedStatus);
      setIsInitialized(true);
    } catch (error) {
      console.error('AI init error:', error);
      setStatus({ type: 'error', message: String(error) });
      setIsInitialized(true);
    }
    return;
  }

  // Web/Capacitor mode - check for embedded model first, then cached model
  try {
    // Check for embedded model in APK assets (Android)
    const hasEmbeddedModel = await checkEmbeddedModel();
    if (hasEmbeddedModel) {
      setStatus({ type: 'loading' });
      await loadEmbeddedModel();
      setIsInitialized(true);
      return;
    }

    // Fall back to checking if model was previously downloaded
    const modelExists = await checkModelDownloaded();
    if (modelExists) {
      // Model exists in cache, try to load it
      setStatus({ type: 'loading' });
      await loadWllamaModel();
    } else {
      // No model - show download required
      setStatus({ type: 'not_downloaded' });
    }
  } catch (error) {
    console.error('Web AI init error:', error);
    setStatus({ type: 'not_downloaded' });
  }

  setIsInitialized(true);
}

// Load wllama model from cache
async function loadWllamaModel(): Promise<void> {
  try {
    const { Wllama } = await import('@wllama/wllama');

    // Get model from cache
    const cache = await caches.open(MODEL_STORAGE_KEY);
    const response = await cache.match(MODEL_URL);

    if (!response) {
      throw new Error('Model not found in cache');
    }

    const modelBlob = await response.blob();
    const modelArrayBuffer = await modelBlob.arrayBuffer();

    // Initialize wllama with correct CDN URLs (pinned version for stability)
    wllamaInstance = new Wllama({
      'single-thread/wllama.wasm': 'https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/esm/single-thread/wllama.wasm',
      'multi-thread/wllama.wasm': 'https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/esm/multi-thread/wllama.wasm',
    });

    // Load model from array buffer
    await wllamaInstance.loadModelFromBuffer(new Uint8Array(modelArrayBuffer));

    modelLoaded = true;
    setStatus({ type: 'ready' });
    console.log('AI model loaded successfully');
  } catch (error) {
    console.error('Failed to load wllama model:', error);
    // Try alternative loading method
    await loadWllamaModelAlternative();
  }
}

// Alternative model loading using URL directly
async function loadWllamaModelAlternative(): Promise<void> {
  try {
    const { Wllama } = await import('@wllama/wllama');

    wllamaInstance = new Wllama({
      'single-thread/wllama.wasm': 'https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/esm/single-thread/wllama.wasm',
      'multi-thread/wllama.wasm': 'https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/esm/multi-thread/wllama.wasm',
    });

    // Load directly from cache URL
    const cache = await caches.open(MODEL_STORAGE_KEY);
    const response = await cache.match(MODEL_URL);

    if (response) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      await wllamaInstance.loadModelFromUrl(url);
      URL.revokeObjectURL(url);

      modelLoaded = true;
      setStatus({ type: 'ready' });
      console.log('AI model loaded via alternative method');
    } else {
      throw new Error('Model not in cache');
    }
  } catch (error) {
    console.error('Alternative loading failed:', error);
    setStatus({ type: 'error', message: 'Failed to load model. Please re-download.' });
    localStorage.removeItem(MODEL_DOWNLOADED_KEY);
  }
}

// Load model from embedded APK assets
async function loadEmbeddedModel(): Promise<void> {
  try {
    const { Wllama } = await import('@wllama/wllama');

    console.log('Loading embedded AI model from APK assets...');

    // Use the path that was discovered during checkEmbeddedModel()
    // or try all paths if not set
    const pathsToTry = workingModelPath
      ? [workingModelPath]
      : EMBEDDED_MODEL_PATHS;

    let modelResponse: Response | null = null;
    let successPath = '';

    for (const path of pathsToTry) {
      try {
        console.log(`Attempting to load model from: ${path}`);
        const response = await fetch(path);
        if (response.ok) {
          modelResponse = response;
          successPath = path;
          console.log(`Successfully fetched model from: ${path}`);
          break;
        } else {
          console.log(`Path ${path} returned status: ${response.status}`);
        }
      } catch (e) {
        console.log(`Path ${path} threw error:`, e);
        continue;
      }
    }

    if (!modelResponse) {
      throw new Error('Could not load embedded model from any path. Tried: ' + pathsToTry.join(', '));
    }

    const modelBlob = await modelResponse.blob();
    console.log(`Embedded model size: ${(modelBlob.size / 1024 / 1024).toFixed(1)}MB from ${successPath}`);

    // Verify the model size (should be ~92MB for SmolLM2-135M-Instruct-Q4_K_M)
    if (modelBlob.size < 50 * 1024 * 1024) {
      throw new Error(`Embedded model file appears corrupted (size: ${modelBlob.size} bytes, expected >50MB)`);
    }

    const modelArrayBuffer = await modelBlob.arrayBuffer();
    console.log('Model loaded into memory, initializing wllama...');

    // Initialize wllama with correct CDN URLs
    wllamaInstance = new Wllama({
      'single-thread/wllama.wasm': 'https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/esm/single-thread/wllama.wasm',
      'multi-thread/wllama.wasm': 'https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/esm/multi-thread/wllama.wasm',
    });

    console.log('Wllama initialized, loading model buffer...');

    // Load model from array buffer
    await wllamaInstance.loadModelFromBuffer(new Uint8Array(modelArrayBuffer));

    modelLoaded = true;
    embeddedModelAvailable = true;
    workingModelPath = successPath; // Remember this path
    setStatus({ type: 'ready' });
    console.log('Embedded AI model loaded successfully!');
  } catch (error) {
    console.error('Failed to load embedded model:', error);
    // Fall back to checking for cached model
    embeddedModelAvailable = false;
    const modelExists = await checkModelDownloaded();
    if (modelExists) {
      await loadWllamaModel();
    } else {
      setStatus({ type: 'error', message: 'Failed to load AI model. Please download.' });
    }
  }
}

// Download the model
async function downloadModel(): Promise<boolean> {
  if (isTauri() && invoke) {
    // Tauri mode
    try {
      setStatus({ type: 'downloading', progress: 0 });
      await invoke('download_model');
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

  // Web/Capacitor mode - download to cache
  try {
    setStatus({ type: 'downloading', progress: 0 });

    const response = await fetch(MODEL_URL);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : MODEL_SIZE_MB * 1024 * 1024;

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response reader');
    }

    const chunks: Uint8Array[] = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);
      received += value.length;

      const progress = Math.round((received / total) * 100);
      setStatus({ type: 'downloading', progress });
      setDownloadProgress({
        downloaded: received,
        total,
        progress,
      });
    }

    // Combine chunks into single blob
    const blob = new Blob(chunks as BlobPart[], { type: 'application/octet-stream' });

    // Verify size (should be > 50MB)
    if (blob.size < 50 * 1024 * 1024) {
      throw new Error('Downloaded file is too small - may be corrupted');
    }

    // Store in cache
    const cache = await caches.open(MODEL_STORAGE_KEY);
    await cache.put(MODEL_URL, new Response(blob));
    localStorage.setItem(MODEL_DOWNLOADED_KEY, 'true');

    console.log(`Model downloaded: ${(blob.size / 1024 / 1024).toFixed(1)}MB`);

    // Load the model
    setStatus({ type: 'loading' });
    await loadWllamaModel();

    return true;
  } catch (error) {
    console.error('Web download error:', error);
    setStatus({ type: 'error', message: String(error) });
    return false;
  }
}

// Format prompt for SmolLM2-Instruct
function formatPrompt(userMessage: string): string {
  return `<|im_start|>system
You are a helpful AI assistant for organizing files. You help users organize, find, and manage their files. Keep responses concise and helpful.<|im_end|>
<|im_start|>user
${userMessage}<|im_end|>
<|im_start|>assistant
`;
}

// Generate AI response
async function generateResponse(prompt: string): Promise<string> {
  if (isTauri() && invoke) {
    // Tauri mode
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

  // Web/Capacitor mode - use wllama
  if (!modelLoaded || !wllamaInstance) {
    throw new Error('Model not loaded. Please download the AI model first.');
  }

  try {
    const formattedPrompt = formatPrompt(prompt);

    const result = await wllamaInstance.createCompletion(formattedPrompt, {
      nPredict: 256,
      temperature: 0.7,
      topP: 0.9,
      stopTokens: ['<|im_end|>', '<|im_start|>'],
    });

    // Clean up the response
    let response = result.trim();

    // Remove any trailing special tokens
    response = response.replace(/<\|im_end\|>/g, '').replace(/<\|im_start\|>/g, '').trim();

    return response || "I'm here to help you organize your files. What would you like to do?";
  } catch (error) {
    console.error('Web inference error:', error);
    throw new Error('Failed to generate response. Please try again.');
  }
}

// Get model info
function getModelInfo() {
  return {
    name: 'SmolLM2-135M-Instruct',
    size: `${MODEL_SIZE_MB}MB`,
    url: MODEL_URL,
    description: '100% local processing - no data leaves your device',
    embedded: embeddedModelAvailable,
  };
}

// Delete downloaded model
async function deleteModel(): Promise<void> {
  try {
    if ('caches' in window) {
      await caches.delete(MODEL_STORAGE_KEY);
    }
    localStorage.removeItem(MODEL_DOWNLOADED_KEY);

    if (wllamaInstance) {
      try {
        await wllamaInstance.exit();
      } catch (e) {
        // Ignore cleanup errors
      }
      wllamaInstance = null;
    }
    modelLoaded = false;

    setStatus({ type: 'not_downloaded' });
  } catch (error) {
    console.error('Failed to delete model:', error);
  }
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
  getModelInfo,
  deleteModel,
};

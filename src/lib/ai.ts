// ============================================================================
// AI API - Frontend wrapper for SmolLM2 model operations
// ============================================================================

import { invoke } from '@tauri-apps/api/core';

/**
 * Model status information
 */
export interface ModelStatus {
  assembled: boolean;
  loaded: boolean;
  modelPath: string | null;
  modelName: string;
  error: string | null;
}

/**
 * Model information from manifest
 */
export interface ModelInfo {
  name: string;
  quantization: string;
  context_length: number;
  license: string;
  source: string;
  size_bytes: number;
}

/**
 * Check the current status of the AI model
 */
export async function checkModelStatus(): Promise<ModelStatus> {
  try {
    const status = await invoke<{
      assembled: boolean;
      loaded: boolean;
      model_path: string | null;
      model_name: string;
      error: string | null;
    }>('check_model_status');

    return {
      assembled: status.assembled,
      loaded: status.loaded,
      modelPath: status.model_path,
      modelName: status.model_name,
      error: status.error,
    };
  } catch (e) {
    console.error('Failed to check model status:', e);
    throw e;
  }
}

/**
 * Assemble the model parts into a complete GGUF file
 * This is required on first launch to join the split model parts
 */
export async function assembleModel(): Promise<string> {
  try {
    return await invoke<string>('assemble_model');
  } catch (e) {
    console.error('Failed to assemble model:', e);
    throw e;
  }
}

/**
 * Load the model into memory for inference
 * This must be called before chat() can be used
 */
export async function loadModel(): Promise<void> {
  try {
    await invoke('load_model');
  } catch (e) {
    console.error('Failed to load model:', e);
    throw e;
  }
}

/**
 * Send a message to the AI and get a response
 * @param message - The user's message
 * @returns The AI's response
 */
export async function chat(message: string): Promise<string> {
  try {
    return await invoke<string>('chat', { message });
  } catch (e) {
    console.error('Failed to chat:', e);
    throw e;
  }
}

/**
 * Unload the model from memory to free resources
 */
export async function unloadModel(): Promise<void> {
  try {
    await invoke('unload_model');
  } catch (e) {
    console.error('Failed to unload model:', e);
    throw e;
  }
}

/**
 * Get information about the model
 */
export async function getModelInfo(): Promise<ModelInfo> {
  try {
    return await invoke<ModelInfo>('get_model_info');
  } catch (e) {
    console.error('Failed to get model info:', e);
    throw e;
  }
}

/**
 * Initialize the AI model - assemble if needed and load
 * @param onProgress - Optional callback for progress updates
 * @returns true if model is ready, false otherwise
 */
export async function initializeModel(
  onProgress?: (status: string) => void
): Promise<boolean> {
  try {
    onProgress?.('Checking model status...');
    const status = await checkModelStatus();

    if (status.error) {
      console.error('Model error:', status.error);
      return false;
    }

    if (!status.assembled) {
      onProgress?.('Assembling model (first time only)...');
      await assembleModel();
    }

    if (!status.loaded) {
      onProgress?.('Loading AI model...');
      await loadModel();
    }

    onProgress?.('AI ready');
    return true;
  } catch (e) {
    console.error('Failed to initialize model:', e);
    return false;
  }
}

/**
 * Format file size for display
 */
export function formatModelSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

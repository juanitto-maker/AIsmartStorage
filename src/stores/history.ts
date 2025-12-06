// ============================================================================
// History Store - Manages undo/redo history
// ============================================================================

import { createSignal, createMemo } from 'solid-js';
import type { HistoryBatch, HistoryEntry, MoveOperation } from '../types';
import { generateId } from '../utils/helpers';
import { database, initDatabase } from '../utils/db';

// State
const [history, setHistory] = createSignal<HistoryBatch[]>([]);
const [isLoading, setIsLoading] = createSignal(false);
const [isDbInitialized, setIsDbInitialized] = createSignal(false);

// Computed
const canUndo = createMemo(() => {
  const h = history();
  return h.some((batch) => !batch.isUndone);
});

const lastBatch = createMemo(() => {
  const h = history();
  return h.find((batch) => !batch.isUndone) || null;
});

const undoCount = createMemo(() => {
  return history().filter((batch) => !batch.isUndone).length;
});

/**
 * Initialize history store (load from IndexedDB)
 */
async function init(): Promise<void> {
  if (isDbInitialized()) return;

  setIsLoading(true);
  try {
    await initDatabase();
    const batches = await database.history.getAll();
    setHistory(batches);
    setIsDbInitialized(true);
  } catch (error) {
    console.error('Failed to initialize history:', error);
  } finally {
    setIsLoading(false);
  }
}

/**
 * Add a new history batch
 */
async function addBatch(params: {
  name: string;
  description: string;
  operations: MoveOperation[];
}): Promise<HistoryBatch> {
  const entries: HistoryEntry[] = params.operations.map((op) => ({
    id: generateId(),
    batchId: '', // Will be set below
    operationType: 'move',
    sourcePath: op.sourcePath,
    destinationPath: op.destinationPath,
    fileData: {
      name: op.sourceFile.name,
      size: op.sourceFile.size,
      fileType: op.sourceFile.fileType,
    },
    timestamp: new Date(),
    isUndone: false,
  }));

  const batch: HistoryBatch = {
    id: generateId(),
    name: params.name,
    description: params.description,
    entries: entries.map((e) => ({ ...e, batchId: '' })),
    timestamp: new Date(),
    isUndone: false,
  };

  // Update entries with batch ID
  batch.entries = batch.entries.map((e) => ({ ...e, batchId: batch.id }));

  // Add to state
  setHistory((prev) => [batch, ...prev]);

  // Persist to IndexedDB
  try {
    await database.history.save(batch);
  } catch (error) {
    console.error('Failed to save history batch:', error);
  }

  return batch;
}

/**
 * Undo the last batch
 */
async function undoLast(): Promise<boolean> {
  const batch = lastBatch();
  if (!batch) return false;

  return undoBatch(batch.id);
}

/**
 * Undo a specific batch
 */
async function undoBatch(batchId: string): Promise<boolean> {
  setIsLoading(true);

  try {
    // Find and update the batch
    const updatedHistory = history().map((batch) => {
      if (batch.id === batchId) {
        return {
          ...batch,
          isUndone: true,
          entries: batch.entries.map((e) => ({ ...e, isUndone: true })),
        };
      }
      return batch;
    });

    setHistory(updatedHistory);

    // Persist the change
    const batch = updatedHistory.find((b) => b.id === batchId);
    if (batch) {
      await database.history.update(batch);
    }

    // In production, this would also restore the original file locations
    // For web demo, we just refresh the demo data
    const { fileStore } = await import('./files');
    fileStore.refreshFiles();

    return true;
  } catch (error) {
    console.error('Failed to undo batch:', error);
    return false;
  } finally {
    setIsLoading(false);
  }
}

/**
 * Clear all history
 */
async function clearHistory(): Promise<void> {
  setHistory([]);

  try {
    await database.history.prune(0);
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
}

/**
 * Get history entries for display
 */
function getDisplayHistory(): Array<{
  id: string;
  name: string;
  description: string;
  timestamp: Date;
  fileCount: number;
  isUndone: boolean;
}> {
  return history().map((batch) => ({
    id: batch.id,
    name: batch.name,
    description: batch.description,
    timestamp: batch.timestamp,
    fileCount: batch.entries.length,
    isUndone: batch.isUndone,
  }));
}

// Export store
export const historyStore = {
  // State
  history,
  isLoading,

  // Computed
  canUndo,
  lastBatch,
  undoCount,

  // Actions
  init,
  addBatch,
  undoLast,
  undoBatch,
  clearHistory,
  getDisplayHistory,
};

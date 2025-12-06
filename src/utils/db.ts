// ============================================================================
// IndexedDB Database Layer (for web deployment)
// In Tauri, this would be replaced with SQLite
// ============================================================================

import type { FileNode, HistoryBatch, HistoryEntry, UserPreferences } from '../types';
import { generateId } from './helpers';

const DB_NAME = 'SmartStorageAI';
const DB_VERSION = 1;

// Store names
const STORES = {
  FILES: 'files',
  HISTORY: 'history',
  PREFERENCES: 'preferences',
} as const;

let db: IDBDatabase | null = null;

/**
 * Initialize the database
 */
export async function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Files store
      if (!database.objectStoreNames.contains(STORES.FILES)) {
        const filesStore = database.createObjectStore(STORES.FILES, { keyPath: 'id' });
        filesStore.createIndex('path', 'path', { unique: true });
        filesStore.createIndex('parentId', 'parentId', { unique: false });
      }

      // History store
      if (!database.objectStoreNames.contains(STORES.HISTORY)) {
        const historyStore = database.createObjectStore(STORES.HISTORY, { keyPath: 'id' });
        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        historyStore.createIndex('batchId', 'batchId', { unique: false });
      }

      // Preferences store
      if (!database.objectStoreNames.contains(STORES.PREFERENCES)) {
        database.createObjectStore(STORES.PREFERENCES, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Get database connection
 */
function getDb(): IDBDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// ============================================================================
// History Operations
// ============================================================================

/**
 * Save a history batch
 */
export async function saveHistoryBatch(batch: HistoryBatch): Promise<void> {
  const database = getDb();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.HISTORY, 'readwrite');
    const store = transaction.objectStore(STORES.HISTORY);

    const request = store.put(batch);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Get all history batches
 */
export async function getHistoryBatches(): Promise<HistoryBatch[]> {
  const database = getDb();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.HISTORY, 'readonly');
    const store = transaction.objectStore(STORES.HISTORY);
    const index = store.index('timestamp');

    const request = index.openCursor(null, 'prev');
    const batches: HistoryBatch[] = [];

    request.onerror = () => reject(request.error);
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        batches.push(cursor.value);
        cursor.continue();
      } else {
        resolve(batches);
      }
    };
  });
}

/**
 * Get a specific history batch by ID
 */
export async function getHistoryBatch(id: string): Promise<HistoryBatch | null> {
  const database = getDb();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.HISTORY, 'readonly');
    const store = transaction.objectStore(STORES.HISTORY);

    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

/**
 * Update a history batch (for marking as undone)
 */
export async function updateHistoryBatch(batch: HistoryBatch): Promise<void> {
  return saveHistoryBatch(batch);
}

/**
 * Delete old history entries (keep last N batches)
 */
export async function pruneHistory(keepCount: number = 50): Promise<void> {
  const batches = await getHistoryBatches();

  if (batches.length <= keepCount) return;

  const database = getDb();
  const toDelete = batches.slice(keepCount);

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.HISTORY, 'readwrite');
    const store = transaction.objectStore(STORES.HISTORY);

    let completed = 0;
    const total = toDelete.length;

    for (const batch of toDelete) {
      const request = store.delete(batch.id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        completed++;
        if (completed === total) resolve();
      };
    }

    if (total === 0) resolve();
  });
}

// ============================================================================
// Preferences Operations
// ============================================================================

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  defaultOrganizationRule: 'byType',
  confirmBeforeApply: true,
  showHiddenFiles: false,
  sortBy: 'name',
  sortOrder: 'asc',
  dateFormat: 'YYYY-MM-DD',
  language: 'en',
};

/**
 * Get user preferences
 */
export async function getPreferences(): Promise<UserPreferences> {
  const database = getDb();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.PREFERENCES, 'readonly');
    const store = transaction.objectStore(STORES.PREFERENCES);

    const request = store.get('userPreferences');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      resolve(request.result?.value || DEFAULT_PREFERENCES);
    };
  });
}

/**
 * Save user preferences
 */
export async function savePreferences(preferences: UserPreferences): Promise<void> {
  const database = getDb();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.PREFERENCES, 'readwrite');
    const store = transaction.objectStore(STORES.PREFERENCES);

    const request = store.put({ key: 'userPreferences', value: preferences });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// ============================================================================
// File Operations (for caching/indexing)
// ============================================================================

/**
 * Cache file metadata
 */
export async function cacheFile(file: FileNode): Promise<void> {
  const database = getDb();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.FILES, 'readwrite');
    const store = transaction.objectStore(STORES.FILES);

    const request = store.put(file);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Get cached file by path
 */
export async function getCachedFile(path: string): Promise<FileNode | null> {
  const database = getDb();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.FILES, 'readonly');
    const store = transaction.objectStore(STORES.FILES);
    const index = store.index('path');

    const request = index.get(path);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

/**
 * Clear all cached files
 */
export async function clearFileCache(): Promise<void> {
  const database = getDb();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORES.FILES, 'readwrite');
    const store = transaction.objectStore(STORES.FILES);

    const request = store.clear();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// ============================================================================
// Export all for convenience
// ============================================================================

export const database = {
  init: initDatabase,
  history: {
    save: saveHistoryBatch,
    getAll: getHistoryBatches,
    get: getHistoryBatch,
    update: updateHistoryBatch,
    prune: pruneHistory,
  },
  preferences: {
    get: getPreferences,
    save: savePreferences,
  },
  files: {
    cache: cacheFile,
    get: getCachedFile,
    clear: clearFileCache,
  },
};

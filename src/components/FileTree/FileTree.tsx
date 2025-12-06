// ============================================================================
// FileTree Component - File browser panel
// ============================================================================

import { Component, Show, For, createEffect } from 'solid-js';
import { fileStore } from '../../stores';
import { formatFileSize } from '../../utils/fileTypes';
import { FileTreeItem } from './FileTreeItem';
import {
  SearchIcon,
  RefreshIcon,
  FolderIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  HardDriveIcon,
} from '../Common/Icons';

export const FileTree: Component = () => {
  let searchInputRef: HTMLInputElement | undefined;

  const stats = () => fileStore.stats();
  const files = () => fileStore.visibleFiles();
  const searchQuery = () => fileStore.searchQuery();

  const handleSearchChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    fileStore.setSearchQuery(target.value);
  };

  const handleClearSearch = () => {
    fileStore.setSearchQuery('');
    searchInputRef?.focus();
  };

  const handleExpandAll = () => {
    fileStore.expandAll();
  };

  const handleCollapseAll = () => {
    fileStore.collapseAll();
  };

  const handleRefresh = () => {
    fileStore.refreshFiles();
  };

  return (
    <div class="flex flex-col h-full bg-dark-900 border-r border-dark-700">
      {/* Header */}
      <div class="flex-shrink-0 p-3 border-b border-dark-700">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <HardDriveIcon size={20} class="text-accent-primary" />
            <h2 class="text-sm font-semibold text-dark-100">Files</h2>
          </div>
          <div class="flex items-center gap-1">
            <button
              onClick={handleExpandAll}
              class="p-1.5 rounded hover:bg-dark-700 text-dark-400 hover:text-dark-200 transition-colors"
              title="Expand all"
            >
              <ChevronDownIcon size={16} />
            </button>
            <button
              onClick={handleCollapseAll}
              class="p-1.5 rounded hover:bg-dark-700 text-dark-400 hover:text-dark-200 transition-colors"
              title="Collapse all"
            >
              <ChevronRightIcon size={16} />
            </button>
            <button
              onClick={handleRefresh}
              class="p-1.5 rounded hover:bg-dark-700 text-dark-400 hover:text-dark-200 transition-colors"
              title="Refresh"
            >
              <RefreshIcon size={16} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div class="relative">
          <SearchIcon
            size={16}
            class="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500"
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search files..."
            value={searchQuery()}
            onInput={handleSearchChange}
            class="w-full pl-9 pr-8 py-2 bg-dark-800 border border-dark-700 rounded-lg text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-accent-primary/50 focus:ring-1 focus:ring-accent-primary/25"
          />
          <Show when={searchQuery()}>
            <button
              onClick={handleClearSearch}
              class="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
            >
              ×
            </button>
          </Show>
        </div>
      </div>

      {/* Stats bar */}
      <div class="flex-shrink-0 px-3 py-2 bg-dark-850 border-b border-dark-700 flex items-center gap-4 text-xs text-dark-400">
        <span>{stats().totalFiles} files</span>
        <span>{stats().totalFolders} folders</span>
        <span>{formatFileSize(stats().totalSize)}</span>
      </div>

      {/* File tree */}
      <div class="flex-1 overflow-y-auto p-2">
        <Show
          when={files().length > 0}
          fallback={
            <div class="flex flex-col items-center justify-center h-full text-dark-500 text-sm">
              <FolderIcon size={48} class="mb-3 opacity-50" />
              <p>No files found</p>
              <Show when={searchQuery()}>
                <button
                  onClick={handleClearSearch}
                  class="mt-2 text-accent-primary hover:underline"
                >
                  Clear search
                </button>
              </Show>
            </div>
          }
        >
          <For each={files()}>
            {(node) => <FileTreeItem node={node} depth={0} />}
          </For>
        </Show>
      </div>

      {/* Footer with quick stats */}
      <div class="flex-shrink-0 p-3 border-t border-dark-700 bg-dark-850">
        <div class="grid grid-cols-3 gap-2 text-center">
          <div>
            <div class="text-lg font-semibold text-accent-primary">
              {stats().byType.image || 0}
            </div>
            <div class="text-xs text-dark-500">Images</div>
          </div>
          <div>
            <div class="text-lg font-semibold text-accent-success">
              {stats().byType.document + stats().byType.pdf || 0}
            </div>
            <div class="text-xs text-dark-500">Documents</div>
          </div>
          <div>
            <div class="text-lg font-semibold text-accent-warning">
              {stats().byType.video || 0}
            </div>
            <div class="text-xs text-dark-500">Videos</div>
          </div>
        </div>
      </div>
    </div>
  );
};

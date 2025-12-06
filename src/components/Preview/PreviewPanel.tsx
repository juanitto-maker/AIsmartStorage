// ============================================================================
// PreviewPanel Component - Shows proposed file organization changes
// ============================================================================

import { Component, Show, For, createMemo } from 'solid-js';
import { previewStore, historyStore } from '../../stores';
import { formatFileSize } from '../../utils/fileTypes';
import { cn } from '../../utils/helpers';
import {
  FolderIcon,
  FileIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  CheckIcon,
  XIcon,
  UndoIcon,
  ArrowRightIcon,
  LayoutIcon,
} from '../Common/Icons';
import type { MoveOperation } from '../../types';

export const PreviewPanel: Component = () => {
  const plan = () => previewStore.currentPlan();
  const stats = () => previewStore.planStats();
  const groupedOps = () => previewStore.groupedOperations();
  const isApplying = () => previewStore.isApplying();
  const isVisible = () => previewStore.isPreviewVisible();
  const expandedFolders = () => previewStore.expandedPreviewFolders();

  const handleApply = async () => {
    await previewStore.applyPlan();
  };

  const handleCancel = () => {
    previewStore.cancelPreview();
  };

  const handleUndo = async () => {
    await historyStore.undoLast();
  };

  const canUndo = () => historyStore.canUndo();

  return (
    <div class="flex flex-col h-full bg-dark-900">
      {/* Header */}
      <div class="flex-shrink-0 p-3 border-b border-dark-700">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <LayoutIcon size={20} class="text-accent-secondary" />
            <h2 class="text-sm font-semibold text-dark-100">Preview</h2>
          </div>
          <Show when={canUndo()}>
            <button
              onClick={handleUndo}
              class="flex items-center gap-1 px-2 py-1 text-xs text-dark-400 hover:text-dark-200 hover:bg-dark-700 rounded transition-colors"
            >
              <UndoIcon size={14} />
              Undo
            </button>
          </Show>
        </div>
      </div>

      {/* Content */}
      <div class="flex-1 overflow-y-auto p-3">
        <Show
          when={isVisible() && plan()}
          fallback={<EmptyState />}
        >
          {/* Plan summary */}
          <div class="mb-4 p-3 bg-dark-800 rounded-lg border border-dark-700">
            <h3 class="text-sm font-medium text-dark-100 mb-2">
              {plan()?.name}
            </h3>
            <p class="text-xs text-dark-400 mb-3">
              {plan()?.description}
            </p>
            <div class="flex items-center gap-4 text-xs text-dark-400">
              <span class="flex items-center gap-1">
                <FileIcon size={14} />
                {plan()?.affectedFiles} files
              </span>
              <span class="flex items-center gap-1">
                <FolderIcon size={14} />
                {plan()?.newFolders.length} new folders
              </span>
              <Show when={stats()}>
                <span>{formatFileSize(stats()!.totalSize)}</span>
              </Show>
            </div>
          </div>

          {/* Grouped operations */}
          <div class="space-y-2">
            <For each={Object.entries(groupedOps())}>
              {([folder, operations]) => (
                <FolderGroup
                  folder={folder}
                  operations={operations as MoveOperation[]}
                  isExpanded={expandedFolders().has(folder)}
                  onToggle={() => previewStore.togglePreviewFolder(folder)}
                />
              )}
            </For>
          </div>
        </Show>
      </div>

      {/* Action buttons */}
      <Show when={isVisible() && plan() && plan()!.status === 'preview'}>
        <div class="flex-shrink-0 p-3 border-t border-dark-700 bg-dark-850">
          <div class="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={isApplying()}
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <XIcon size={16} />
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isApplying()}
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent-primary hover:bg-accent-primary/90 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Show when={!isApplying()} fallback={<LoadingSpinner />}>
                <CheckIcon size={16} />
              </Show>
              {isApplying() ? 'Applying...' : 'Apply Changes'}
            </button>
          </div>
        </div>
      </Show>

      {/* Applied state */}
      <Show when={plan()?.status === 'applied'}>
        <div class="flex-shrink-0 p-3 border-t border-dark-700 bg-accent-success/10">
          <div class="flex items-center justify-center gap-2 text-accent-success text-sm">
            <CheckIcon size={18} />
            Changes applied successfully!
          </div>
        </div>
      </Show>
    </div>
  );
};

// Empty state component
const EmptyState: Component = () => (
  <div class="flex flex-col items-center justify-center h-full text-dark-500 text-sm">
    <LayoutIcon size={48} class="mb-3 opacity-50" />
    <p class="text-center mb-2">No preview available</p>
    <p class="text-xs text-dark-600 text-center max-w-[200px]">
      Use the chat to organize your files and see a preview here
    </p>
  </div>
);

// Folder group component
interface FolderGroupProps {
  folder: string;
  operations: MoveOperation[];
  isExpanded: boolean;
  onToggle: () => void;
}

const FolderGroup: Component<FolderGroupProps> = (props) => {
  const totalSize = createMemo(() =>
    props.operations.reduce((sum, op) => sum + op.sourceFile.size, 0)
  );

  return (
    <div class="bg-dark-800 rounded-lg border border-dark-700 overflow-hidden">
      {/* Folder header */}
      <button
        onClick={props.onToggle}
        class="w-full flex items-center gap-2 p-2 hover:bg-dark-750 transition-colors"
      >
        <span class="w-4 h-4 flex items-center justify-center text-dark-400">
          <Show
            when={props.isExpanded}
            fallback={<ChevronRightIcon size={14} />}
          >
            <ChevronDownIcon size={14} />
          </Show>
        </span>
        <FolderIcon size={16} class="text-amber-400" />
        <span class="flex-1 text-left text-sm font-medium text-dark-100 truncate">
          {props.folder}
        </span>
        <span class="text-xs text-dark-500">
          {props.operations.length} files
        </span>
        <span class="text-xs text-dark-500">
          {formatFileSize(totalSize())}
        </span>
      </button>

      {/* File list */}
      <Show when={props.isExpanded}>
        <div class="border-t border-dark-700 divide-y divide-dark-700/50">
          <For each={props.operations.slice(0, 10)}>
            {(op) => <FileItem operation={op} />}
          </For>
          <Show when={props.operations.length > 10}>
            <div class="px-4 py-2 text-xs text-dark-500 text-center">
              +{props.operations.length - 10} more files
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
};

// File item component
interface FileItemProps {
  operation: MoveOperation;
}

const FileItem: Component<FileItemProps> = (props) => {
  const getSourceFolder = () => {
    const parts = props.operation.sourcePath.split('/');
    parts.pop();
    return parts.join('/') || '/';
  };

  return (
    <div class="flex items-center gap-2 px-4 py-2 text-xs">
      <FileIcon size={14} class="text-dark-500 flex-shrink-0" />
      <span class="text-dark-300 truncate flex-1" title={props.operation.sourceFile.name}>
        {props.operation.sourceFile.name}
      </span>
      <span class="text-dark-600 truncate max-w-[80px]" title={getSourceFolder()}>
        {getSourceFolder()}
      </span>
      <ArrowRightIcon size={12} class="text-dark-600 flex-shrink-0" />
      <span class="text-accent-primary truncate max-w-[80px]" title={props.operation.destinationFolder}>
        {props.operation.destinationFolder}
      </span>
    </div>
  );
};

// Loading spinner
const LoadingSpinner: Component = () => (
  <svg
    class="animate-spin h-4 w-4 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      class="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="4"
    />
    <path
      class="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

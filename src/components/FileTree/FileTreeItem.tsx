// ============================================================================
// FileTreeItem Component - Individual file/folder item in the tree
// ============================================================================

import { Component, Show, For, createMemo } from 'solid-js';
import type { FileNode } from '../../types';
import { fileStore } from '../../stores';
import { formatFileSize, formatDate } from '../../utils/fileTypes';
import { cn } from '../../utils/helpers';
import {
  FolderIcon,
  FolderOpenIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  getFileTypeIcon,
} from '../Common/Icons';

interface FileTreeItemProps {
  node: FileNode;
  depth?: number;
}

export const FileTreeItem: Component<FileTreeItemProps> = (props) => {
  const depth = () => props.depth || 0;

  const isFolder = () => props.node.type === 'folder';
  const isExpanded = () => props.node.isExpanded || false;
  const isSelected = () => fileStore.selectedFiles().has(props.node.id);

  const FileTypeIcon = createMemo(() => {
    if (isFolder()) return isExpanded() ? FolderOpenIcon : FolderIcon;
    return getFileTypeIcon(props.node.fileType || 'other');
  });

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();

    if (isFolder()) {
      fileStore.toggleFolder(props.node.id);
    } else {
      fileStore.selectFile(props.node.id, e.ctrlKey || e.metaKey);
    }
  };

  const handleDoubleClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (isFolder()) {
      fileStore.navigateTo(props.node.path);
    }
  };

  return (
    <div class="select-none">
      {/* Item row */}
      <div
        class={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors',
          'hover:bg-dark-800/50',
          isSelected() && 'bg-accent-primary/20 hover:bg-accent-primary/30'
        )}
        style={{ 'padding-left': `${depth() * 16 + 8}px` }}
        onClick={handleClick}
        onDblClick={handleDoubleClick}
      >
        {/* Expand/collapse icon for folders */}
        <Show when={isFolder()}>
          <button
            class="w-4 h-4 flex items-center justify-center text-dark-400 hover:text-dark-200 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              fileStore.toggleFolder(props.node.id);
            }}
          >
            <Show when={isExpanded()} fallback={<ChevronRightIcon size={14} />}>
              <ChevronDownIcon size={14} />
            </Show>
          </button>
        </Show>

        {/* Spacer for files (no expand icon) */}
        <Show when={!isFolder()}>
          <div class="w-4" />
        </Show>

        {/* File/folder icon */}
        <span
          class={cn(
            'flex-shrink-0',
            isFolder() ? 'text-amber-400' : 'text-dark-400'
          )}
        >
          <FileTypeIcon size={18} />
        </span>

        {/* File name */}
        <span
          class={cn(
            'flex-1 truncate text-sm',
            isFolder() ? 'font-medium text-dark-100' : 'text-dark-200'
          )}
          title={props.node.name}
        >
          {props.node.name}
        </span>

        {/* File size (files only) */}
        <Show when={!isFolder() && props.node.size > 0}>
          <span class="text-xs text-dark-500 tabular-nums">
            {formatFileSize(props.node.size)}
          </span>
        </Show>

        {/* Item count (folders only) */}
        <Show when={isFolder() && props.node.children}>
          <span class="text-xs text-dark-500 tabular-nums">
            {props.node.children?.length || 0}
          </span>
        </Show>
      </div>

      {/* Children (for expanded folders) */}
      <Show when={isFolder() && isExpanded() && props.node.children}>
        <div class="animate-fade-in">
          <For each={props.node.children}>
            {(child) => <FileTreeItem node={child} depth={depth() + 1} />}
          </For>
        </div>
      </Show>
    </div>
  );
};

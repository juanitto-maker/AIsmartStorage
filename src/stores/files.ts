// ============================================================================
// File Store - Manages file tree state
// ============================================================================

import { createSignal, createMemo } from 'solid-js';
import type { FileNode, FileStats } from '../types';
import { generateDemoFiles, getFileStats, findFileByPath } from '../utils/demoData';
import { sortFiles } from '../utils/fileTypes';

// Initialize with demo data for web deployment
const [files, setFiles] = createSignal<FileNode[]>(generateDemoFiles());
const [currentPath, setCurrentPath] = createSignal<string>('/');
const [selectedFiles, setSelectedFiles] = createSignal<Set<string>>(new Set());
const [expandedFolders, setExpandedFolders] = createSignal<Set<string>>(new Set());
const [sortBy, setSortBy] = createSignal<'name' | 'date' | 'size' | 'type'>('name');
const [sortOrder, setSortOrder] = createSignal<'asc' | 'desc'>('asc');
const [showHiddenFiles, setShowHiddenFiles] = createSignal(false);
const [searchQuery, setSearchQuery] = createSignal('');

// Computed values
const stats = createMemo<FileStats>(() => getFileStats(files()));

const currentFolder = createMemo<FileNode | null>(() => {
  const path = currentPath();
  if (path === '/') return null;
  return findFileByPath(files(), path);
});

const visibleFiles = createMemo(() => {
  let result = files();

  // Apply search filter if query exists
  const query = searchQuery().toLowerCase();
  if (query) {
    result = filterFilesByQuery(result, query);
  }

  return result;
});

/**
 * Filter files by search query
 */
function filterFilesByQuery(nodes: FileNode[], query: string): FileNode[] {
  return nodes.reduce<FileNode[]>((acc, node) => {
    const nameMatches = node.name.toLowerCase().includes(query);

    if (node.type === 'folder' && node.children) {
      const filteredChildren = filterFilesByQuery(node.children, query);
      if (filteredChildren.length > 0 || nameMatches) {
        acc.push({
          ...node,
          children: filteredChildren,
          isExpanded: true,
        });
      }
    } else if (nameMatches) {
      acc.push(node);
    }

    return acc;
  }, []);
}

/**
 * Toggle folder expanded state
 */
function toggleFolder(folderId: string): void {
  setExpandedFolders((prev) => {
    const next = new Set(prev);
    if (next.has(folderId)) {
      next.delete(folderId);
    } else {
      next.add(folderId);
    }
    return next;
  });

  // Also update the file tree to reflect expansion
  setFiles((prev) => updateFolderExpansion(prev, folderId));
}

function updateFolderExpansion(nodes: FileNode[], folderId: string): FileNode[] {
  return nodes.map((node) => {
    if (node.id === folderId) {
      return { ...node, isExpanded: !node.isExpanded };
    }
    if (node.children) {
      return { ...node, children: updateFolderExpansion(node.children, folderId) };
    }
    return node;
  });
}

/**
 * Select a file or folder
 */
function selectFile(fileId: string, multiSelect: boolean = false): void {
  setSelectedFiles((prev) => {
    const next = new Set(multiSelect ? prev : []);
    if (next.has(fileId)) {
      next.delete(fileId);
    } else {
      next.add(fileId);
    }
    return next;
  });

  // Update file tree selection state
  setFiles((prev) => updateFileSelection(prev, fileId, multiSelect));
}

function updateFileSelection(
  nodes: FileNode[],
  fileId: string,
  multiSelect: boolean
): FileNode[] {
  return nodes.map((node) => {
    const isSelected = node.id === fileId ? !node.isSelected : multiSelect && node.isSelected;

    return {
      ...node,
      isSelected: node.id === fileId ? !node.isSelected : multiSelect ? node.isSelected : false,
      children: node.children
        ? updateFileSelection(node.children, fileId, multiSelect)
        : undefined,
    };
  });
}

/**
 * Clear all selections
 */
function clearSelection(): void {
  setSelectedFiles(new Set());
  setFiles((prev) => clearAllSelections(prev));
}

function clearAllSelections(nodes: FileNode[]): FileNode[] {
  return nodes.map((node) => ({
    ...node,
    isSelected: false,
    children: node.children ? clearAllSelections(node.children) : undefined,
  }));
}

/**
 * Navigate to a path
 */
function navigateTo(path: string): void {
  setCurrentPath(path);
}

/**
 * Expand all folders
 */
function expandAll(): void {
  const allFolderIds = new Set<string>();

  function collectFolderIds(nodes: FileNode[]) {
    for (const node of nodes) {
      if (node.type === 'folder') {
        allFolderIds.add(node.id);
        if (node.children) {
          collectFolderIds(node.children);
        }
      }
    }
  }

  collectFolderIds(files());
  setExpandedFolders(allFolderIds);
  setFiles((prev) => setAllFoldersExpanded(prev, true));
}

/**
 * Collapse all folders
 */
function collapseAll(): void {
  setExpandedFolders(new Set());
  setFiles((prev) => setAllFoldersExpanded(prev, false));
}

function setAllFoldersExpanded(nodes: FileNode[], expanded: boolean): FileNode[] {
  return nodes.map((node) => ({
    ...node,
    isExpanded: node.type === 'folder' ? expanded : undefined,
    children: node.children ? setAllFoldersExpanded(node.children, expanded) : undefined,
  }));
}

/**
 * Get selected files as array
 */
function getSelectedFiles(): FileNode[] {
  const selected: FileNode[] = [];
  const selectedIds = selectedFiles();

  function findSelected(nodes: FileNode[]) {
    for (const node of nodes) {
      if (selectedIds.has(node.id)) {
        selected.push(node);
      }
      if (node.children) {
        findSelected(node.children);
      }
    }
  }

  findSelected(files());
  return selected;
}

/**
 * Refresh file list (reload demo data for web)
 */
function refreshFiles(): void {
  setFiles(generateDemoFiles());
  clearSelection();
  collapseAll();
}

// Export store
export const fileStore = {
  // State
  files,
  currentPath,
  selectedFiles,
  expandedFolders,
  sortBy,
  sortOrder,
  showHiddenFiles,
  searchQuery,

  // Computed
  stats,
  currentFolder,
  visibleFiles,

  // Actions
  setFiles,
  setCurrentPath,
  setSearchQuery,
  setSortBy,
  setSortOrder,
  setShowHiddenFiles,
  toggleFolder,
  selectFile,
  clearSelection,
  navigateTo,
  expandAll,
  collapseAll,
  getSelectedFiles,
  refreshFiles,
};

// ============================================================================
// Preview Store - Manages organization plan preview state
// ============================================================================

import { createSignal, createMemo } from 'solid-js';
import type {
  OrganizationPlan,
  OrganizationConfig,
  OrganizationRule,
  MoveOperation,
  FileNode,
} from '../types';
import {
  generateOrganizationPlan,
  groupOperationsByFolder,
  calculatePlanStats,
} from '../utils/organizer';
import { fileStore } from './files';
import { historyStore } from './history';

// State
const [currentPlan, setCurrentPlan] = createSignal<OrganizationPlan | null>(null);
const [isPreviewVisible, setIsPreviewVisible] = createSignal(false);
const [selectedRule, setSelectedRule] = createSignal<OrganizationRule>('byType');
const [isApplying, setIsApplying] = createSignal(false);
const [expandedPreviewFolders, setExpandedPreviewFolders] = createSignal<Set<string>>(
  new Set()
);

// Computed
const planStats = createMemo(() => {
  const plan = currentPlan();
  if (!plan) return null;
  return calculatePlanStats(plan);
});

const groupedOperations = createMemo(() => {
  const plan = currentPlan();
  if (!plan) return {};
  return groupOperationsByFolder(plan.operations);
});

const hasChanges = createMemo(() => {
  const plan = currentPlan();
  return plan !== null && plan.operations.length > 0;
});

/**
 * Generate a preview for the selected organization rule
 */
function generatePreview(rule?: OrganizationRule): void {
  const ruleToUse = rule || selectedRule();
  setSelectedRule(ruleToUse);

  const config: OrganizationConfig = {
    rule: ruleToUse,
    options: {
      dateFormat: 'year-month',
      sizeThresholds: {
        small: 1024 * 1024, // 1 MB
        medium: 100 * 1024 * 1024, // 100 MB
      },
    },
  };

  // Get files to organize
  const files = fileStore.files();

  // Generate the plan
  const plan = generateOrganizationPlan(files, config);

  setCurrentPlan(plan);
  setIsPreviewVisible(true);

  // Auto-expand all preview folders
  const folderIds = new Set(plan.newFolders);
  setExpandedPreviewFolders(folderIds);
}

/**
 * Apply the current organization plan
 */
async function applyPlan(): Promise<boolean> {
  const plan = currentPlan();
  if (!plan) return false;

  setIsApplying(true);

  try {
    // In a real Tauri app, this would call the Rust backend
    // For web demo, we simulate the changes

    // Update plan status
    const appliedPlan: OrganizationPlan = {
      ...plan,
      status: 'applied',
      operations: plan.operations.map((op) => ({
        ...op,
        status: 'applied',
      })),
    };

    setCurrentPlan(appliedPlan);

    // Add to history for undo
    await historyStore.addBatch({
      name: plan.name,
      description: plan.description,
      operations: plan.operations,
    });

    // Simulate file reorganization in the demo
    // In production, this would be handled by the Tauri backend
    simulateFileReorganization(plan);

    return true;
  } catch (error) {
    console.error('Failed to apply plan:', error);
    return false;
  } finally {
    setIsApplying(false);
  }
}

/**
 * Simulate file reorganization for web demo
 */
function simulateFileReorganization(plan: OrganizationPlan): void {
  // For the web demo, we rebuild the file tree based on the plan
  const newFiles: FileNode[] = [];
  const folderMap = new Map<string, FileNode>();

  // Create new folder structure
  for (const folderPath of plan.newFolders) {
    const folder: FileNode = {
      id: `folder-${folderPath}`,
      name: folderPath.split('/').pop() || folderPath,
      path: `/${folderPath}`,
      type: 'folder',
      size: 0,
      modifiedAt: new Date(),
      createdAt: new Date(),
      children: [],
      isExpanded: true,
    };
    folderMap.set(folderPath, folder);
    newFiles.push(folder);
  }

  // Move files to new locations
  for (const op of plan.operations) {
    const folder = folderMap.get(op.destinationFolder);
    if (folder && folder.children) {
      const movedFile: FileNode = {
        ...op.sourceFile,
        path: op.destinationPath,
      };
      folder.children.push(movedFile);
      folder.size += movedFile.size;
    }
  }

  // Update the file store with the new structure
  fileStore.setFiles(newFiles);
}

/**
 * Cancel/dismiss the current preview
 */
function cancelPreview(): void {
  setCurrentPlan(null);
  setIsPreviewVisible(false);
}

/**
 * Toggle preview folder expansion
 */
function togglePreviewFolder(folderName: string): void {
  setExpandedPreviewFolders((prev) => {
    const next = new Set(prev);
    if (next.has(folderName)) {
      next.delete(folderName);
    } else {
      next.add(folderName);
    }
    return next;
  });
}

/**
 * Reset to show original file structure
 */
function resetPreview(): void {
  fileStore.refreshFiles();
  cancelPreview();
}

// Export store
export const previewStore = {
  // State
  currentPlan,
  isPreviewVisible,
  selectedRule,
  isApplying,
  expandedPreviewFolders,

  // Computed
  planStats,
  groupedOperations,
  hasChanges,

  // Actions
  setSelectedRule,
  generatePreview,
  applyPlan,
  cancelPreview,
  togglePreviewFolder,
  resetPreview,
};

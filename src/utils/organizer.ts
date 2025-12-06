// ============================================================================
// File Organization Logic - Rule-based organization engine
// ============================================================================

import type {
  FileNode,
  FileType,
  OrganizationRule,
  OrganizationConfig,
  OrganizationPlan,
  MoveOperation,
} from '../types';
import { getFileType, FILE_TYPE_NAMES } from './fileTypes';
import { generateId } from './helpers';

// Default size thresholds (in bytes)
const DEFAULT_SIZE_THRESHOLDS = {
  small: 1024 * 1024,        // 1 MB
  medium: 100 * 1024 * 1024, // 100 MB
};

/**
 * Generate an organization plan based on the selected rule
 */
export function generateOrganizationPlan(
  files: FileNode[],
  config: OrganizationConfig,
  basePath: string = ''
): OrganizationPlan {
  const operations: MoveOperation[] = [];
  const newFolders = new Set<string>();

  // Get all files (flatten the tree)
  const allFiles = flattenFileTree(files);

  // Generate move operations based on rule
  for (const file of allFiles) {
    if (file.type === 'folder') continue;

    const destinationFolder = getDestinationFolder(file, config);
    if (!destinationFolder) continue;

    const destinationPath = `${basePath}/${destinationFolder}/${file.name}`;

    // Skip if file is already in the correct location
    if (file.path === destinationPath) continue;

    newFolders.add(destinationFolder);

    operations.push({
      id: generateId(),
      sourceFile: file,
      sourcePath: file.path,
      destinationPath,
      destinationFolder,
      status: 'pending',
    });
  }

  const ruleDescriptions: Record<OrganizationRule, string> = {
    byType: 'Organize files into folders by their type (Documents, Images, etc.)',
    byDate: 'Organize files into Year/Month folders based on modification date',
    bySize: 'Organize files into Small, Medium, and Large folders based on size',
    byExtension: 'Organize files into folders by their file extension',
    flatten: 'Move all files to the root folder',
    custom: 'Custom organization based on AI suggestions',
  };

  return {
    id: generateId(),
    name: `Organize by ${config.rule}`,
    description: ruleDescriptions[config.rule],
    rule: config.rule,
    operations,
    createdAt: new Date(),
    status: 'preview',
    affectedFiles: operations.length,
    newFolders: Array.from(newFolders),
  };
}

/**
 * Get destination folder for a file based on organization rule
 */
function getDestinationFolder(
  file: FileNode,
  config: OrganizationConfig
): string | null {
  switch (config.rule) {
    case 'byType':
      return getDestinationByType(file);
    case 'byDate':
      return getDestinationByDate(file, config.options?.dateFormat || 'year-month');
    case 'bySize':
      return getDestinationBySize(file, config.options?.sizeThresholds || DEFAULT_SIZE_THRESHOLDS);
    case 'byExtension':
      return getDestinationByExtension(file);
    case 'flatten':
      return '';
    case 'custom':
      return getDestinationCustom(file, config.options?.customCategories);
    default:
      return null;
  }
}

/**
 * Get destination folder by file type
 */
function getDestinationByType(file: FileNode): string {
  const fileType = file.fileType || getFileType(file.name);
  return FILE_TYPE_NAMES[fileType];
}

/**
 * Get destination folder by date
 */
function getDestinationByDate(
  file: FileNode,
  format: 'year' | 'year-month' | 'year-month-day'
): string {
  const date = file.modifiedAt;
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  switch (format) {
    case 'year':
      return year;
    case 'year-month':
      return `${year}/${year}-${month}`;
    case 'year-month-day':
      return `${year}/${year}-${month}/${year}-${month}-${day}`;
    default:
      return year;
  }
}

/**
 * Get destination folder by file size
 */
function getDestinationBySize(
  file: FileNode,
  thresholds: { small: number; medium: number }
): string {
  if (file.size < thresholds.small) {
    return 'Small (< 1 MB)';
  } else if (file.size < thresholds.medium) {
    return 'Medium (1-100 MB)';
  } else {
    return 'Large (> 100 MB)';
  }
}

/**
 * Get destination folder by extension
 */
function getDestinationByExtension(file: FileNode): string {
  const ext = file.extension || '';
  if (!ext) return 'No Extension';
  return ext.toUpperCase();
}

/**
 * Get destination folder using custom categories
 */
function getDestinationCustom(
  file: FileNode,
  customCategories?: Record<string, string[]>
): string | null {
  if (!customCategories) return null;

  const ext = (file.extension || '').toLowerCase();

  for (const [category, extensions] of Object.entries(customCategories)) {
    if (extensions.includes(ext)) {
      return category;
    }
  }

  return 'Uncategorized';
}

/**
 * Flatten a file tree into a flat array of files
 */
export function flattenFileTree(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = [];

  function traverse(node: FileNode) {
    result.push(node);
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  nodes.forEach(traverse);
  return result;
}

/**
 * Build a preview tree from move operations
 */
export function buildPreviewTree(operations: MoveOperation[]): FileNode[] {
  const root: Record<string, FileNode> = {};

  for (const op of operations) {
    const parts = op.destinationPath.split('/').filter(Boolean);
    let current = root;
    let currentPath = '';

    // Create folder structure
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      currentPath += '/' + part;

      if (!current[part]) {
        current[part] = {
          id: generateId(),
          name: part,
          path: currentPath,
          type: 'folder',
          size: 0,
          modifiedAt: new Date(),
          createdAt: new Date(),
          children: [],
          isExpanded: true,
        };
      }

      // Navigate to children
      const folder = current[part];
      if (!folder.children) folder.children = [];

      // Convert children array to object for easier lookup
      const childrenMap: Record<string, FileNode> = {};
      for (const child of folder.children) {
        childrenMap[child.name] = child;
      }
      current = childrenMap;

      // Ensure the folder has this child in its children array
      if (i < parts.length - 2) {
        const nextPart = parts[i + 1];
        if (!current[nextPart]) {
          const newFolder: FileNode = {
            id: generateId(),
            name: nextPart,
            path: currentPath + '/' + nextPart,
            type: 'folder',
            size: 0,
            modifiedAt: new Date(),
            createdAt: new Date(),
            children: [],
            isExpanded: true,
          };
          current[nextPart] = newFolder;
          folder.children.push(newFolder);
        }
      }
    }

    // Add the file
    const fileName = parts[parts.length - 1];
    const fileNode: FileNode = {
      ...op.sourceFile,
      id: generateId(),
      name: fileName,
      path: op.destinationPath,
    };

    // Find the parent folder and add the file
    let parent = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (i === 0) {
        if (!parent[part]) {
          parent[part] = {
            id: generateId(),
            name: part,
            path: '/' + part,
            type: 'folder',
            size: 0,
            modifiedAt: new Date(),
            createdAt: new Date(),
            children: [],
            isExpanded: true,
          };
        }
        if (i === parts.length - 2) {
          parent[part].children = parent[part].children || [];
          parent[part].children.push(fileNode);
        }
      }
    }
  }

  // Convert root object to array
  return Object.values(root);
}

/**
 * Group operations by destination folder for display
 */
export function groupOperationsByFolder(
  operations: MoveOperation[]
): Record<string, MoveOperation[]> {
  const groups: Record<string, MoveOperation[]> = {};

  for (const op of operations) {
    const folder = op.destinationFolder || 'Root';
    if (!groups[folder]) {
      groups[folder] = [];
    }
    groups[folder].push(op);
  }

  return groups;
}

/**
 * Calculate statistics for an organization plan
 */
export function calculatePlanStats(plan: OrganizationPlan): {
  totalFiles: number;
  totalSize: number;
  folderBreakdown: Record<string, number>;
} {
  const folderBreakdown: Record<string, number> = {};
  let totalSize = 0;

  for (const op of plan.operations) {
    const folder = op.destinationFolder || 'Root';
    folderBreakdown[folder] = (folderBreakdown[folder] || 0) + 1;
    totalSize += op.sourceFile.size;
  }

  return {
    totalFiles: plan.operations.length,
    totalSize,
    folderBreakdown,
  };
}

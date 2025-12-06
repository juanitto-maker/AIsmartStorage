// ============================================================================
// Smart Storage AI - Type Definitions
// ============================================================================

// ----------------------------------------------------------------------------
// File System Types
// ----------------------------------------------------------------------------

export type FileType =
  | 'document'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'code'
  | 'spreadsheet'
  | 'presentation'
  | 'pdf'
  | 'other';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  fileType?: FileType;
  size: number;
  modifiedAt: Date;
  createdAt: Date;
  extension?: string;
  children?: FileNode[];
  isExpanded?: boolean;
  isSelected?: boolean;
  parentId?: string;
  mimeType?: string;
}

export interface FileStats {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  byType: Record<FileType, number>;
}

// ----------------------------------------------------------------------------
// Organization Types
// ----------------------------------------------------------------------------

export type OrganizationRule =
  | 'byType'      // Group by file type (Documents, Images, etc.)
  | 'byDate'      // Group by date (Year/Month)
  | 'bySize'      // Group by size (Small/Medium/Large)
  | 'byExtension' // Group by file extension
  | 'flatten'     // Flatten all files to root
  | 'custom';     // Custom AI-generated organization

export interface OrganizationConfig {
  rule: OrganizationRule;
  options?: {
    dateFormat?: 'year' | 'year-month' | 'year-month-day';
    sizeThresholds?: { small: number; medium: number }; // in bytes
    customCategories?: Record<string, string[]>; // category -> extensions
  };
}

export interface MoveOperation {
  id: string;
  sourceFile: FileNode;
  sourcePath: string;
  destinationPath: string;
  destinationFolder: string;
  status: 'pending' | 'applied' | 'undone' | 'failed';
  error?: string;
}

export interface OrganizationPlan {
  id: string;
  name: string;
  description: string;
  rule: OrganizationRule;
  operations: MoveOperation[];
  createdAt: Date;
  status: 'preview' | 'applied' | 'undone' | 'partial';
  affectedFiles: number;
  newFolders: string[];
}

// ----------------------------------------------------------------------------
// History & Undo Types
// ----------------------------------------------------------------------------

export type OperationType = 'move' | 'rename' | 'create_folder' | 'delete';

export interface HistoryEntry {
  id: string;
  batchId: string;
  operationType: OperationType;
  sourcePath: string;
  destinationPath?: string;
  fileData?: Partial<FileNode>;
  timestamp: Date;
  isUndone: boolean;
}

export interface HistoryBatch {
  id: string;
  name: string;
  description: string;
  entries: HistoryEntry[];
  timestamp: Date;
  isUndone: boolean;
}

// ----------------------------------------------------------------------------
// Chat & AI Types
// ----------------------------------------------------------------------------

export type MessageRole = 'user' | 'assistant' | 'system';

export type IntentType =
  | 'organize'     // "Organize my downloads by type"
  | 'search'       // "Find all PDFs"
  | 'analyze'      // "What's taking up space?"
  | 'undo'         // "Undo the last change"
  | 'preview'      // "Show me what you'd do"
  | 'apply'        // "Yes, apply those changes"
  | 'cancel'       // "Cancel" / "Never mind"
  | 'help'         // "What can you do?"
  | 'unknown';     // Couldn't parse intent

export interface ParsedIntent {
  type: IntentType;
  confidence: number;
  entities: {
    path?: string;
    fileType?: FileType;
    rule?: OrganizationRule;
    query?: string;
    dateRange?: { start: Date; end: Date };
  };
  rawText: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  intent?: ParsedIntent;
  attachedPlan?: OrganizationPlan;
  isLoading?: boolean;
  error?: string;
}

export interface ChatSuggestion {
  id: string;
  text: string;
  intent: IntentType;
  icon?: string;
}

// ----------------------------------------------------------------------------
// UI State Types
// ----------------------------------------------------------------------------

export interface PanelState {
  isCollapsed: boolean;
  width: number;
  minWidth: number;
  maxWidth: number;
}

export interface AppState {
  // File browser state
  rootPath: string;
  currentPath: string;
  files: FileNode[];
  selectedFiles: string[];
  expandedFolders: Set<string>;

  // Preview state
  currentPlan: OrganizationPlan | null;
  isPreviewVisible: boolean;

  // Chat state
  messages: ChatMessage[];
  isAiProcessing: boolean;

  // History state
  history: HistoryBatch[];
  canUndo: boolean;

  // UI state
  theme: 'dark' | 'light';
  leftPanelWidth: number;
  rightPanelWidth: number;
  isMobile: boolean;
  activePanel: 'files' | 'preview' | 'chat';
}

// ----------------------------------------------------------------------------
// Settings Types
// ----------------------------------------------------------------------------

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  defaultOrganizationRule: OrganizationRule;
  confirmBeforeApply: boolean;
  showHiddenFiles: boolean;
  sortBy: 'name' | 'date' | 'size' | 'type';
  sortOrder: 'asc' | 'desc';
  dateFormat: string;
  language: string;
}

// ----------------------------------------------------------------------------
// API Response Types (for Tauri commands)
// ----------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface FileListResponse {
  files: FileNode[];
  stats: FileStats;
  path: string;
}

export interface OrganizationResponse {
  plan: OrganizationPlan;
  warnings?: string[];
}

// ----------------------------------------------------------------------------
// Demo/Mock Types (for web deployment without Tauri)
// ----------------------------------------------------------------------------

export interface DemoFile {
  name: string;
  type: 'file' | 'folder';
  size?: number;
  children?: DemoFile[];
}

// ----------------------------------------------------------------------------
// Event Types
// ----------------------------------------------------------------------------

export type AppEvent =
  | { type: 'FILE_SELECTED'; payload: string[] }
  | { type: 'FOLDER_TOGGLED'; payload: string }
  | { type: 'PLAN_CREATED'; payload: OrganizationPlan }
  | { type: 'PLAN_APPLIED'; payload: string }
  | { type: 'PLAN_UNDONE'; payload: string }
  | { type: 'MESSAGE_SENT'; payload: ChatMessage }
  | { type: 'PATH_CHANGED'; payload: string };

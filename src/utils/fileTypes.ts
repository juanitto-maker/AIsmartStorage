// ============================================================================
// File Type Detection Utilities
// ============================================================================

import type { FileType } from '../types';

// Extension to file type mapping
const FILE_TYPE_MAP: Record<string, FileType> = {
  // Documents
  doc: 'document',
  docx: 'document',
  txt: 'document',
  rtf: 'document',
  odt: 'document',
  md: 'document',
  tex: 'document',

  // PDFs
  pdf: 'pdf',

  // Spreadsheets
  xls: 'spreadsheet',
  xlsx: 'spreadsheet',
  csv: 'spreadsheet',
  ods: 'spreadsheet',
  numbers: 'spreadsheet',

  // Presentations
  ppt: 'presentation',
  pptx: 'presentation',
  odp: 'presentation',
  key: 'presentation',

  // Images
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  bmp: 'image',
  webp: 'image',
  svg: 'image',
  ico: 'image',
  tiff: 'image',
  tif: 'image',
  heic: 'image',
  heif: 'image',
  raw: 'image',
  cr2: 'image',
  nef: 'image',

  // Videos
  mp4: 'video',
  avi: 'video',
  mov: 'video',
  wmv: 'video',
  mkv: 'video',
  flv: 'video',
  webm: 'video',
  m4v: 'video',
  mpeg: 'video',
  mpg: 'video',
  '3gp': 'video',

  // Audio
  mp3: 'audio',
  wav: 'audio',
  flac: 'audio',
  aac: 'audio',
  ogg: 'audio',
  wma: 'audio',
  m4a: 'audio',
  opus: 'audio',
  aiff: 'audio',

  // Archives
  zip: 'archive',
  rar: 'archive',
  '7z': 'archive',
  tar: 'archive',
  gz: 'archive',
  bz2: 'archive',
  xz: 'archive',
  iso: 'archive',
  dmg: 'archive',

  // Code
  js: 'code',
  ts: 'code',
  jsx: 'code',
  tsx: 'code',
  py: 'code',
  java: 'code',
  c: 'code',
  cpp: 'code',
  h: 'code',
  hpp: 'code',
  cs: 'code',
  go: 'code',
  rs: 'code',
  rb: 'code',
  php: 'code',
  swift: 'code',
  kt: 'code',
  scala: 'code',
  html: 'code',
  css: 'code',
  scss: 'code',
  sass: 'code',
  less: 'code',
  json: 'code',
  xml: 'code',
  yaml: 'code',
  yml: 'code',
  toml: 'code',
  sql: 'code',
  sh: 'code',
  bash: 'code',
  ps1: 'code',
  r: 'code',
  lua: 'code',
  perl: 'code',
  pl: 'code',
};

// Human-readable names for file types
export const FILE_TYPE_NAMES: Record<FileType, string> = {
  document: 'Documents',
  pdf: 'PDFs',
  spreadsheet: 'Spreadsheets',
  presentation: 'Presentations',
  image: 'Images',
  video: 'Videos',
  audio: 'Audio',
  archive: 'Archives',
  code: 'Code',
  other: 'Other Files',
};

// Icons for file types (using emoji for simplicity, can be replaced with actual icons)
export const FILE_TYPE_ICONS: Record<FileType, string> = {
  document: '📄',
  pdf: '📕',
  spreadsheet: '📊',
  presentation: '📽️',
  image: '🖼️',
  video: '🎬',
  audio: '🎵',
  archive: '📦',
  code: '💻',
  other: '📁',
};

// Folder icon
export const FOLDER_ICON = '📂';
export const FOLDER_OPEN_ICON = '📂';
export const FOLDER_CLOSED_ICON = '📁';

/**
 * Detect file type from extension
 */
export function getFileType(filename: string): FileType {
  const ext = getExtension(filename).toLowerCase();
  return FILE_TYPE_MAP[ext] || 'other';
}

/**
 * Get file extension from filename
 */
export function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) return '';
  return filename.slice(lastDot + 1);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`;
}

/**
 * Format date in human-readable format
 */
export function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Get MIME type from extension
 */
export function getMimeType(filename: string): string {
  const ext = getExtension(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    // Video
    mp4: 'video/mp4',
    webm: 'video/webm',
    // Archives
    zip: 'application/zip',
    // Code
    js: 'text/javascript',
    ts: 'text/typescript',
    json: 'application/json',
    html: 'text/html',
    css: 'text/css',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Check if file is hidden (starts with .)
 */
export function isHiddenFile(filename: string): boolean {
  return filename.startsWith('.');
}

/**
 * Sort files with folders first
 */
export function sortFiles<T extends { type: 'file' | 'folder'; name: string }>(
  files: T[],
  sortBy: 'name' | 'date' | 'size' | 'type' = 'name',
  sortOrder: 'asc' | 'desc' = 'asc'
): T[] {
  return [...files].sort((a, b) => {
    // Folders always come first
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }

    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name, undefined, { numeric: true });
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

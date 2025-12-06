// ============================================================================
// Demo Data - Sample file structure for web demo
// ============================================================================

import type { FileNode, FileType } from '../types';
import { getFileType } from './fileTypes';
import { generateId } from './helpers';

/**
 * Create a file node with auto-generated properties
 */
function createFile(
  name: string,
  parentPath: string,
  size: number,
  daysAgo: number = 0
): FileNode {
  const path = parentPath ? `${parentPath}/${name}` : `/${name}`;
  const modifiedAt = new Date();
  modifiedAt.setDate(modifiedAt.getDate() - daysAgo);

  return {
    id: generateId(),
    name,
    path,
    type: 'file',
    fileType: getFileType(name),
    size,
    modifiedAt,
    createdAt: modifiedAt,
    extension: name.includes('.') ? name.split('.').pop() : undefined,
  };
}

/**
 * Create a folder node
 */
function createFolder(
  name: string,
  parentPath: string,
  children: FileNode[] = []
): FileNode {
  const path = parentPath ? `${parentPath}/${name}` : `/${name}`;

  // Calculate folder size from children
  const size = children.reduce((total, child) => total + child.size, 0);

  return {
    id: generateId(),
    name,
    path,
    type: 'folder',
    size,
    modifiedAt: new Date(),
    createdAt: new Date(),
    children,
    isExpanded: false,
  };
}

/**
 * Generate demo file structure
 */
export function generateDemoFiles(): FileNode[] {
  // Downloads folder with mixed files
  const downloads = createFolder('Downloads', '', [
    createFile('vacation_photo_001.jpg', '/Downloads', 3_500_000, 2),
    createFile('vacation_photo_002.jpg', '/Downloads', 4_200_000, 2),
    createFile('vacation_photo_003.png', '/Downloads', 5_100_000, 2),
    createFile('budget_2024.xlsx', '/Downloads', 156_000, 5),
    createFile('meeting_notes.docx', '/Downloads', 45_000, 1),
    createFile('presentation_final.pptx', '/Downloads', 12_400_000, 7),
    createFile('song_favorite.mp3', '/Downloads', 8_900_000, 14),
    createFile('podcast_episode_42.mp3', '/Downloads', 45_000_000, 3),
    createFile('movie_trailer.mp4', '/Downloads', 156_000_000, 10),
    createFile('app_installer.exe', '/Downloads', 89_000_000, 30),
    createFile('archive_backup.zip', '/Downloads', 234_000_000, 21),
    createFile('invoice_march.pdf', '/Downloads', 890_000, 45),
    createFile('invoice_april.pdf', '/Downloads', 1_200_000, 15),
    createFile('contract_draft.pdf', '/Downloads', 2_300_000, 8),
    createFile('screenshot_2024_01.png', '/Downloads', 456_000, 60),
    createFile('screenshot_2024_02.png', '/Downloads', 523_000, 55),
    createFile('notes.txt', '/Downloads', 12_000, 0),
    createFile('data_export.csv', '/Downloads', 2_400_000, 4),
    createFile('project_code.zip', '/Downloads', 15_600_000, 12),
    createFile('ebook_guide.epub', '/Downloads', 3_400_000, 25),
  ]);

  // Documents folder
  const documents = createFolder('Documents', '', [
    createFolder('Work', '/Documents', [
      createFile('quarterly_report.docx', '/Documents/Work', 2_300_000, 3),
      createFile('project_plan.xlsx', '/Documents/Work', 890_000, 7),
      createFile('team_contacts.csv', '/Documents/Work', 45_000, 14),
      createFile('presentation.pptx', '/Documents/Work', 8_900_000, 5),
    ]),
    createFolder('Personal', '/Documents', [
      createFile('resume_2024.docx', '/Documents/Personal', 156_000, 30),
      createFile('tax_returns.pdf', '/Documents/Personal', 4_500_000, 90),
      createFile('recipes.txt', '/Documents/Personal', 23_000, 120),
    ]),
    createFile('readme.md', '/Documents', 5_600, 2),
    createFile('todo_list.txt', '/Documents', 1_200, 0),
  ]);

  // Pictures folder
  const pictures = createFolder('Pictures', '', [
    createFolder('2024', '/Pictures', [
      createFolder('January', '/Pictures/2024', [
        createFile('new_year_party.jpg', '/Pictures/2024/January', 4_500_000, 340),
        createFile('snow_landscape.jpg', '/Pictures/2024/January', 5_200_000, 335),
        createFile('family_dinner.png', '/Pictures/2024/January', 6_100_000, 330),
      ]),
      createFolder('February', '/Pictures/2024', [
        createFile('valentine_card.png', '/Pictures/2024/February', 2_300_000, 300),
        createFile('sunset_beach.jpg', '/Pictures/2024/February', 4_800_000, 295),
      ]),
    ]),
    createFolder('Screenshots', '/Pictures', [
      createFile('screenshot_app.png', '/Pictures/Screenshots', 890_000, 5),
      createFile('screenshot_error.png', '/Pictures/Screenshots', 456_000, 3),
      createFile('screenshot_design.png', '/Pictures/Screenshots', 1_200_000, 1),
    ]),
    createFile('profile_photo.jpg', '/Pictures', 2_300_000, 60),
    createFile('wallpaper.png', '/Pictures', 8_900_000, 180),
  ]);

  // Music folder
  const music = createFolder('Music', '', [
    createFolder('Playlists', '/Music', [
      createFile('workout_mix.m3u', '/Music/Playlists', 2_000, 30),
      createFile('relaxation.m3u', '/Music/Playlists', 1_500, 45),
    ]),
    createFile('favorite_song.mp3', '/Music', 7_800_000, 60),
    createFile('podcast_interview.mp3', '/Music', 45_000_000, 14),
    createFile('audiobook_chapter1.mp3', '/Music', 89_000_000, 7),
    createFile('voice_memo.m4a', '/Music', 2_300_000, 2),
  ]);

  // Videos folder
  const videos = createFolder('Videos', '', [
    createFolder('Movies', '/Videos', [
      createFile('vacation_2023.mp4', '/Videos/Movies', 1_500_000_000, 180),
      createFile('birthday_party.mov', '/Videos/Movies', 890_000_000, 90),
    ]),
    createFolder('Tutorials', '/Videos', [
      createFile('coding_basics.mp4', '/Videos/Tutorials', 450_000_000, 30),
      createFile('design_tips.mp4', '/Videos/Tutorials', 320_000_000, 25),
    ]),
    createFile('screen_recording.webm', '/Videos', 156_000_000, 3),
  ]);

  // Desktop folder (messy, needs organization)
  const desktop = createFolder('Desktop', '', [
    createFile('urgent_todo.txt', '/Desktop', 500, 0),
    createFile('random_image.jpg', '/Desktop', 3_400_000, 1),
    createFile('old_document.docx', '/Desktop', 890_000, 45),
    createFile('temp_file.tmp', '/Desktop', 12_000, 2),
    createFile('unfinished_report.docx', '/Desktop', 1_200_000, 7),
    createFile('screenshot_123.png', '/Desktop', 567_000, 3),
    createFile('download (1).pdf', '/Desktop', 2_300_000, 14),
    createFile('download (2).pdf', '/Desktop', 1_800_000, 14),
    createFile('New folder', '/Desktop', 0, 30),
    createFile('Copy of presentation.pptx', '/Desktop', 15_600_000, 21),
    createFile('test.js', '/Desktop', 4_500, 5),
    createFile('notes_meeting_march.txt', '/Desktop', 2_300, 60),
  ]);

  return [downloads, documents, pictures, music, videos, desktop];
}

/**
 * Get file statistics from file tree
 */
export function getFileStats(files: FileNode[]): {
  totalFiles: number;
  totalFolders: number;
  totalSize: number;
  byType: Record<FileType, number>;
} {
  let totalFiles = 0;
  let totalFolders = 0;
  let totalSize = 0;
  const byType: Record<FileType, number> = {
    document: 0,
    image: 0,
    video: 0,
    audio: 0,
    archive: 0,
    code: 0,
    spreadsheet: 0,
    presentation: 0,
    pdf: 0,
    other: 0,
  };

  function traverse(node: FileNode) {
    if (node.type === 'folder') {
      totalFolders++;
      node.children?.forEach(traverse);
    } else {
      totalFiles++;
      totalSize += node.size;
      const fileType = node.fileType || getFileType(node.name);
      byType[fileType]++;
    }
  }

  files.forEach(traverse);

  return { totalFiles, totalFolders, totalSize, byType };
}

/**
 * Find a file by path
 */
export function findFileByPath(files: FileNode[], path: string): FileNode | null {
  for (const file of files) {
    if (file.path === path) return file;
    if (file.children) {
      const found = findFileByPath(file.children, path);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Get all files in a folder (flat list)
 */
export function getAllFilesInFolder(folder: FileNode): FileNode[] {
  const result: FileNode[] = [];

  function traverse(node: FileNode) {
    if (node.type === 'file') {
      result.push(node);
    } else if (node.children) {
      node.children.forEach(traverse);
    }
  }

  if (folder.children) {
    folder.children.forEach(traverse);
  }

  return result;
}

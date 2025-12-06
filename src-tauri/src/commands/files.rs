// ============================================================================
// File Operations Commands
// ============================================================================

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize)]
pub struct FileNode {
    pub id: String,
    pub name: String,
    pub path: String,
    #[serde(rename = "type")]
    pub node_type: String, // "file" or "folder"
    pub file_type: Option<String>,
    pub size: u64,
    pub modified_at: String,
    pub created_at: String,
    pub extension: Option<String>,
    pub children: Option<Vec<FileNode>>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileStats {
    pub total_files: u32,
    pub total_folders: u32,
    pub total_size: u64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileListResponse {
    pub files: Vec<FileNode>,
    pub stats: FileStats,
    pub path: String,
}

/// List files in a directory
#[tauri::command]
pub async fn list_files(path: String, recursive: bool) -> Result<FileListResponse, String> {
    let path_buf = PathBuf::from(&path);

    if !path_buf.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    if !path_buf.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }

    let mut files: Vec<FileNode> = Vec::new();
    let mut stats = FileStats {
        total_files: 0,
        total_folders: 0,
        total_size: 0,
    };

    if recursive {
        // Recursive listing
        for entry in WalkDir::new(&path_buf).max_depth(10).into_iter().filter_map(|e| e.ok()) {
            if entry.path() == path_buf {
                continue;
            }

            match create_file_node(entry.path()) {
                Ok(node) => {
                    if node.node_type == "folder" {
                        stats.total_folders += 1;
                    } else {
                        stats.total_files += 1;
                        stats.total_size += node.size;
                    }
                    files.push(node);
                }
                Err(_) => continue,
            }
        }
    } else {
        // Non-recursive listing
        if let Ok(entries) = fs::read_dir(&path_buf) {
            for entry in entries.filter_map(|e| e.ok()) {
                match create_file_node(&entry.path()) {
                    Ok(node) => {
                        if node.node_type == "folder" {
                            stats.total_folders += 1;
                        } else {
                            stats.total_files += 1;
                            stats.total_size += node.size;
                        }
                        files.push(node);
                    }
                    Err(_) => continue,
                }
            }
        }
    }

    // Sort: folders first, then by name
    files.sort_by(|a, b| {
        if a.node_type != b.node_type {
            if a.node_type == "folder" {
                std::cmp::Ordering::Less
            } else {
                std::cmp::Ordering::Greater
            }
        } else {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        }
    });

    Ok(FileListResponse { files, stats, path })
}

/// Get information about a specific file
#[tauri::command]
pub async fn get_file_info(path: String) -> Result<FileNode, String> {
    let path_buf = PathBuf::from(&path);
    create_file_node(&path_buf)
}

/// Move a file to a new location
#[tauri::command]
pub async fn move_file(source: String, destination: String) -> Result<(), String> {
    let source_path = PathBuf::from(&source);
    let dest_path = PathBuf::from(&destination);

    // Create parent directory if it doesn't exist
    if let Some(parent) = dest_path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    fs::rename(&source_path, &dest_path).map_err(|e| format!("Failed to move file: {}", e))?;

    Ok(())
}

/// Create a new folder
#[tauri::command]
pub async fn create_folder(path: String) -> Result<FileNode, String> {
    let path_buf = PathBuf::from(&path);

    fs::create_dir_all(&path_buf).map_err(|e| format!("Failed to create folder: {}", e))?;

    create_file_node(&path_buf)
}

// Helper function to create a FileNode from a path
fn create_file_node(path: &PathBuf) -> Result<FileNode, String> {
    let metadata = fs::metadata(path).map_err(|e| format!("Failed to read metadata: {}", e))?;

    let name = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    let node_type = if metadata.is_dir() { "folder" } else { "file" };

    let extension = if metadata.is_file() {
        path.extension().map(|e| e.to_string_lossy().to_string())
    } else {
        None
    };

    let file_type = extension.as_ref().map(|ext| get_file_type(ext));

    let modified_at = metadata
        .modified()
        .ok()
        .map(|t| {
            chrono::DateTime::<chrono::Utc>::from(t)
                .format("%Y-%m-%dT%H:%M:%SZ")
                .to_string()
        })
        .unwrap_or_default();

    let created_at = metadata
        .created()
        .ok()
        .map(|t| {
            chrono::DateTime::<chrono::Utc>::from(t)
                .format("%Y-%m-%dT%H:%M:%SZ")
                .to_string()
        })
        .unwrap_or_default();

    Ok(FileNode {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        path: path.to_string_lossy().to_string(),
        node_type: node_type.to_string(),
        file_type,
        size: metadata.len(),
        modified_at,
        created_at,
        extension,
        children: None,
    })
}

// Get file type from extension
fn get_file_type(extension: &str) -> String {
    match extension.to_lowercase().as_str() {
        // Documents
        "doc" | "docx" | "txt" | "rtf" | "odt" | "md" => "document",
        // PDFs
        "pdf" => "pdf",
        // Spreadsheets
        "xls" | "xlsx" | "csv" | "ods" => "spreadsheet",
        // Presentations
        "ppt" | "pptx" | "odp" => "presentation",
        // Images
        "jpg" | "jpeg" | "png" | "gif" | "bmp" | "webp" | "svg" | "ico" => "image",
        // Videos
        "mp4" | "avi" | "mov" | "wmv" | "mkv" | "flv" | "webm" => "video",
        // Audio
        "mp3" | "wav" | "flac" | "aac" | "ogg" | "wma" | "m4a" => "audio",
        // Archives
        "zip" | "rar" | "7z" | "tar" | "gz" | "bz2" => "archive",
        // Code
        "js" | "ts" | "jsx" | "tsx" | "py" | "java" | "c" | "cpp" | "h" | "rs" | "go" | "rb"
        | "php" | "html" | "css" | "scss" | "json" | "xml" | "yaml" | "yml" => "code",
        // Other
        _ => "other",
    }
    .to_string()
}

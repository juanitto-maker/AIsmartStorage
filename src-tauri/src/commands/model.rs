// ============================================================================
// Model Download Commands - Handles AI model download and verification
// ============================================================================

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::io::Write;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, Emitter};
use futures_util::StreamExt;

/// Model configuration from config.json
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelConfig {
    pub model_name: String,
    pub download_url: String,
    pub file_name: String,
    pub size_bytes: u64,
    pub checksum_sha256: String,
}

/// Model status for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelStatus {
    pub exists: bool,
    pub path: Option<String>,
    pub config: ModelConfig,
}

/// Download progress event payload
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub downloaded: u64,
    pub total: u64,
    pub percentage: f64,
    pub status: String,
}

/// Embedded model config (compiled into the binary)
fn get_embedded_config() -> ModelConfig {
    ModelConfig {
        model_name: "SmolLM2-135M-Instruct".to_string(),
        download_url: "https://huggingface.co/Mungert/SmolLM2-135M-Instruct-GGUF/resolve/main/SmolLM2-135M-Instruct-Q4_K_M.gguf".to_string(),
        file_name: "smollm2-135m-instruct-q4_k_m.gguf".to_string(),
        size_bytes: 96408576,
        checksum_sha256: "4bd46e022f32b681ae1beba1030d9ad042a655e75239fe83267f5e3bba98801d".to_string(),
    }
}

/// Get the model directory path
fn get_model_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    let model_dir = app_data_dir.join("models");

    // Create directory if it doesn't exist
    if !model_dir.exists() {
        std::fs::create_dir_all(&model_dir)
            .map_err(|e| format!("Failed to create model directory: {}", e))?;
    }

    Ok(model_dir)
}

/// Check if the AI model exists in app data
#[tauri::command]
pub async fn check_model_exists(app: AppHandle) -> Result<ModelStatus, String> {
    let config = get_embedded_config();
    let model_dir = get_model_dir(&app)?;
    let model_path = model_dir.join(&config.file_name);

    let exists = model_path.exists();

    Ok(ModelStatus {
        exists,
        path: if exists {
            Some(model_path.to_string_lossy().to_string())
        } else {
            None
        },
        config,
    })
}

/// Get model configuration
#[tauri::command]
pub fn get_model_config() -> ModelConfig {
    get_embedded_config()
}

/// Download the AI model with progress streaming
#[tauri::command]
pub async fn download_model(app: AppHandle) -> Result<String, String> {
    let config = get_embedded_config();
    let model_dir = get_model_dir(&app)?;
    let model_path = model_dir.join(&config.file_name);
    let temp_path = model_dir.join(format!("{}.tmp", &config.file_name));

    // Emit initial progress
    let _ = app.emit("model-download-progress", DownloadProgress {
        downloaded: 0,
        total: config.size_bytes,
        percentage: 0.0,
        status: "Starting download...".to_string(),
    });

    // Create HTTP client
    let client = reqwest::Client::new();

    // Start download
    let response = client
        .get(&config.download_url)
        .send()
        .await
        .map_err(|e| format!("Failed to start download: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Download failed with status: {}", response.status()));
    }

    let total_size = response
        .content_length()
        .unwrap_or(config.size_bytes);

    // Create temp file
    let mut file = std::fs::File::create(&temp_path)
        .map_err(|e| format!("Failed to create temp file: {}", e))?;

    // Create hasher for checksum verification
    let mut hasher = Sha256::new();

    // Download with progress
    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result
            .map_err(|e| format!("Error downloading chunk: {}", e))?;

        // Write to file
        file.write_all(&chunk)
            .map_err(|e| format!("Error writing to file: {}", e))?;

        // Update hasher
        hasher.update(&chunk);

        // Update progress
        downloaded += chunk.len() as u64;
        let percentage = (downloaded as f64 / total_size as f64) * 100.0;

        let _ = app.emit("model-download-progress", DownloadProgress {
            downloaded,
            total: total_size,
            percentage,
            status: format!("Downloading... {:.1}%", percentage),
        });
    }

    // Flush and close file
    file.flush()
        .map_err(|e| format!("Error flushing file: {}", e))?;
    drop(file);

    // Verify checksum
    let _ = app.emit("model-download-progress", DownloadProgress {
        downloaded: total_size,
        total: total_size,
        percentage: 100.0,
        status: "Verifying checksum...".to_string(),
    });

    let computed_hash = hex::encode(hasher.finalize());

    if computed_hash.to_lowercase() != config.checksum_sha256.to_lowercase() {
        // Delete temp file on checksum mismatch
        let _ = std::fs::remove_file(&temp_path);
        return Err(format!(
            "Checksum mismatch! Expected: {}, Got: {}",
            config.checksum_sha256, computed_hash
        ));
    }

    // Rename temp file to final name
    std::fs::rename(&temp_path, &model_path)
        .map_err(|e| format!("Failed to rename temp file: {}", e))?;

    let _ = app.emit("model-download-progress", DownloadProgress {
        downloaded: total_size,
        total: total_size,
        percentage: 100.0,
        status: "Download complete!".to_string(),
    });

    Ok(model_path.to_string_lossy().to_string())
}

/// Cancel ongoing download (cleanup temp file)
#[tauri::command]
pub async fn cancel_download(app: AppHandle) -> Result<(), String> {
    let config = get_embedded_config();
    let model_dir = get_model_dir(&app)?;
    let temp_path = model_dir.join(format!("{}.tmp", &config.file_name));

    if temp_path.exists() {
        std::fs::remove_file(&temp_path)
            .map_err(|e| format!("Failed to remove temp file: {}", e))?;
    }

    Ok(())
}

/// Delete the model file (for testing or freeing space)
#[tauri::command]
pub async fn delete_model(app: AppHandle) -> Result<(), String> {
    let config = get_embedded_config();
    let model_dir = get_model_dir(&app)?;
    let model_path = model_dir.join(&config.file_name);

    if model_path.exists() {
        std::fs::remove_file(&model_path)
            .map_err(|e| format!("Failed to delete model: {}", e))?;
    }

    Ok(())
}

/// Get the path to the downloaded model (if it exists)
#[tauri::command]
pub async fn get_model_path(app: AppHandle) -> Result<Option<String>, String> {
    let config = get_embedded_config();
    let model_dir = get_model_dir(&app)?;
    let model_path = model_dir.join(&config.file_name);

    if model_path.exists() {
        Ok(Some(model_path.to_string_lossy().to_string()))
    } else {
        Ok(None)
    }
}

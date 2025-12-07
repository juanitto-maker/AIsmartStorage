// ============================================================================
// Model Assembler - Joins split model parts into complete GGUF file
// ============================================================================

use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use sha2::{Sha256, Digest};

use super::types::{ModelManifest, ModelStatus};

/// Check if the model is already assembled and valid
pub fn check_assembled_model(app_data_dir: &Path, manifest: &ModelManifest) -> Result<Option<PathBuf>, String> {
    let model_path = app_data_dir.join(&manifest.model_file);

    if model_path.exists() {
        // Check file size first (faster than checksum)
        if let Ok(metadata) = fs::metadata(&model_path) {
            if metadata.len() == manifest.total_size {
                // Optionally verify checksum (can skip for faster startup)
                return Ok(Some(model_path));
            }
        }
        // File exists but wrong size - delete and reassemble
        let _ = fs::remove_file(&model_path);
    }

    Ok(None)
}

/// Read the model manifest from the Models directory
pub fn read_manifest(models_dir: &Path) -> Result<ModelManifest, String> {
    let manifest_path = models_dir.join("smollm2-manifest.json");

    if !manifest_path.exists() {
        return Err(format!("Manifest not found at {:?}", manifest_path));
    }

    let content = fs::read_to_string(&manifest_path)
        .map_err(|e| format!("Failed to read manifest: {}", e))?;

    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse manifest: {}", e))
}

/// Assemble model parts into a complete GGUF file
pub fn assemble_model_parts(
    models_dir: &Path,
    app_data_dir: &Path,
    manifest: &ModelManifest,
) -> Result<PathBuf, String> {
    let output_path = app_data_dir.join(&manifest.model_file);

    // Ensure output directory exists
    fs::create_dir_all(app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;

    // Sort parts by order
    let mut parts = manifest.parts.clone();
    parts.sort_by_key(|p| p.order);

    // Create output file
    let mut output_file = File::create(&output_path)
        .map_err(|e| format!("Failed to create output file: {}", e))?;

    let mut hasher = Sha256::new();
    let mut total_written: u64 = 0;

    // Concatenate all parts
    for part in &parts {
        let part_path = models_dir.join(&part.file);

        if !part_path.exists() {
            // Clean up partial file
            let _ = fs::remove_file(&output_path);
            return Err(format!("Model part not found: {:?}", part_path));
        }

        let mut part_file = File::open(&part_path)
            .map_err(|e| format!("Failed to open part {}: {}", part.file, e))?;

        let mut buffer = Vec::new();
        part_file.read_to_end(&mut buffer)
            .map_err(|e| format!("Failed to read part {}: {}", part.file, e))?;

        // Verify part size
        if buffer.len() as u64 != part.size {
            let _ = fs::remove_file(&output_path);
            return Err(format!(
                "Part {} has wrong size: expected {}, got {}",
                part.file, part.size, buffer.len()
            ));
        }

        // Update checksum
        hasher.update(&buffer);

        // Write to output
        output_file.write_all(&buffer)
            .map_err(|e| format!("Failed to write to output: {}", e))?;

        total_written += buffer.len() as u64;

        println!("Assembled part {} ({} bytes)", part.file, buffer.len());
    }

    // Verify total size
    if total_written != manifest.total_size {
        let _ = fs::remove_file(&output_path);
        return Err(format!(
            "Total size mismatch: expected {}, got {}",
            manifest.total_size, total_written
        ));
    }

    // Verify checksum
    let computed_hash = format!("{:x}", hasher.finalize());
    if computed_hash != manifest.checksum_sha256 {
        let _ = fs::remove_file(&output_path);
        return Err(format!(
            "Checksum mismatch: expected {}, got {}",
            manifest.checksum_sha256, computed_hash
        ));
    }

    println!("Model assembled successfully at {:?}", output_path);
    Ok(output_path)
}

/// Get the current model status
pub fn get_model_status(
    models_dir: &Path,
    app_data_dir: &Path,
    is_loaded: bool,
) -> ModelStatus {
    let manifest = match read_manifest(models_dir) {
        Ok(m) => m,
        Err(e) => {
            return ModelStatus {
                error: Some(e),
                ..Default::default()
            };
        }
    };

    match check_assembled_model(app_data_dir, &manifest) {
        Ok(Some(path)) => ModelStatus {
            assembled: true,
            loaded: is_loaded,
            model_path: Some(path.to_string_lossy().to_string()),
            model_name: manifest.model_name,
            error: None,
        },
        Ok(None) => ModelStatus {
            assembled: false,
            loaded: false,
            model_path: None,
            model_name: manifest.model_name,
            error: None,
        },
        Err(e) => ModelStatus {
            error: Some(e),
            ..Default::default()
        },
    }
}

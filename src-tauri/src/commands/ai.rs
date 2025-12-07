// ============================================================================
// AI Commands - Tauri commands for SmolLM2 model management and inference
// ============================================================================

use std::path::PathBuf;
use tauri::{AppHandle, Manager, State};

use crate::model::{
    ModelStatus, SharedModelState,
    read_manifest, check_assembled_model, assemble_model_parts, get_model_status,
};

/// Get the Models directory path (bundled with the app)
fn get_models_dir(app: &AppHandle) -> Result<PathBuf, String> {
    // In development, use the project's Models directory
    // In production, this would be bundled with the app resources
    let resource_path = app.path().resource_dir()
        .map_err(|e| format!("Failed to get resource directory: {}", e))?;

    let models_dir = resource_path.join("Models");

    // Fallback: try the current directory for development
    if !models_dir.exists() {
        let cwd = std::env::current_dir()
            .map_err(|e| format!("Failed to get current directory: {}", e))?;

        // Try parent directories to find Models folder
        let possible_paths = [
            cwd.join("Models"),
            cwd.parent().map(|p| p.join("Models")).unwrap_or_default(),
        ];

        for path in possible_paths {
            if path.exists() && path.join("smollm2-manifest.json").exists() {
                return Ok(path);
            }
        }
    }

    if models_dir.exists() {
        Ok(models_dir)
    } else {
        Err("Models directory not found. Ensure model files are in the Models/ folder.".to_string())
    }
}

/// Get the app data directory for storing the assembled model
fn get_app_data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))
}

/// Check the current status of the model (assembled, loaded, etc.)
#[tauri::command]
pub async fn check_model_status(
    app: AppHandle,
    model_state: State<'_, SharedModelState>,
) -> Result<ModelStatus, String> {
    let models_dir = get_models_dir(&app)?;
    let app_data_dir = get_app_data_dir(&app)?;
    let is_loaded = model_state.lock().is_loaded();

    Ok(get_model_status(&models_dir, &app_data_dir, is_loaded))
}

/// Assemble the model parts into a complete GGUF file
#[tauri::command]
pub async fn assemble_model(app: AppHandle) -> Result<String, String> {
    let models_dir = get_models_dir(&app)?;
    let app_data_dir = get_app_data_dir(&app)?;

    // Read manifest
    let manifest = read_manifest(&models_dir)?;

    // Check if already assembled
    if let Some(path) = check_assembled_model(&app_data_dir, &manifest)? {
        println!("Model already assembled at {:?}", path);
        return Ok(path.to_string_lossy().to_string());
    }

    // Assemble the model
    let model_path = assemble_model_parts(&models_dir, &app_data_dir, &manifest)?;

    Ok(model_path.to_string_lossy().to_string())
}

/// Load the model into memory for inference
#[tauri::command]
pub async fn load_model(
    app: AppHandle,
    model_state: State<'_, SharedModelState>,
) -> Result<(), String> {
    // Check if already loaded
    if model_state.lock().is_loaded() {
        println!("Model already loaded");
        return Ok(());
    }

    let models_dir = get_models_dir(&app)?;
    let app_data_dir = get_app_data_dir(&app)?;

    // Read manifest and get model path
    let manifest = read_manifest(&models_dir)?;
    let model_path = match check_assembled_model(&app_data_dir, &manifest)? {
        Some(path) => path,
        None => {
            // Need to assemble first
            assemble_model_parts(&models_dir, &app_data_dir, &manifest)?
        }
    };

    // Load the model
    model_state.lock().load(&model_path)?;

    println!("Model loaded successfully");
    Ok(())
}

/// Generate a chat response using the loaded model
#[tauri::command]
pub async fn chat(
    message: String,
    model_state: State<'_, SharedModelState>,
) -> Result<String, String> {
    if message.trim().is_empty() {
        return Err("Message cannot be empty".to_string());
    }

    let state = model_state.lock();
    if !state.is_loaded() {
        return Err("Model not loaded. Please call load_model first.".to_string());
    }

    state.generate(&message)
}

/// Unload the model from memory
#[tauri::command]
pub async fn unload_model(
    model_state: State<'_, SharedModelState>,
) -> Result<(), String> {
    model_state.lock().unload();
    println!("Model unloaded");
    Ok(())
}

/// Get model information
#[tauri::command]
pub async fn get_model_info(app: AppHandle) -> Result<serde_json::Value, String> {
    let models_dir = get_models_dir(&app)?;
    let manifest = read_manifest(&models_dir)?;

    Ok(serde_json::json!({
        "name": manifest.model_name,
        "quantization": manifest.quantization,
        "context_length": manifest.context_length,
        "license": manifest.license,
        "source": manifest.source,
        "size_bytes": manifest.total_size,
    }))
}

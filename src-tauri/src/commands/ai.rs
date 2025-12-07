// ============================================================================
// AI Module - Model download and inference using llama.cpp
// ============================================================================

use std::path::PathBuf;
use std::sync::Arc;
use parking_lot::RwLock;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, Manager};
use tokio::io::AsyncWriteExt;

// Model configuration
const MODEL_URL: &str = "https://huggingface.co/Mungert/SmolLM2-135M-Instruct-GGUF/resolve/main/SmolLM2-135M-Instruct-Q4_K_M.gguf";
const MODEL_FILENAME: &str = "SmolLM2-135M-Instruct-Q4_K_M.gguf";

// AI Status enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum AiStatus {
    NotDownloaded,
    Downloading { progress: f32 },
    Loading,
    Ready,
    Error { message: String },
}

// Download progress event
#[derive(Debug, Clone, Serialize)]
pub struct DownloadProgress {
    pub downloaded: u64,
    pub total: u64,
    pub progress: f32,
}

// Chat message for inference
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

// Global AI state
struct AiState {
    status: AiStatus,
    model_path: Option<PathBuf>,
    model: Option<llama_cpp_2::LlamaModel>,
}

impl Default for AiState {
    fn default() -> Self {
        Self {
            status: AiStatus::NotDownloaded,
            model_path: None,
            model: None,
        }
    }
}

static AI_STATE: Lazy<Arc<RwLock<AiState>>> = Lazy::new(|| {
    Arc::new(RwLock::new(AiState::default()))
});

/// Get model directory path
fn get_model_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    let model_dir = app_data_dir.join("models");
    std::fs::create_dir_all(&model_dir)
        .map_err(|e| format!("Failed to create models dir: {}", e))?;
    Ok(model_dir)
}

/// Get model file path
fn get_model_path(app: &AppHandle) -> Result<PathBuf, String> {
    let model_dir = get_model_dir(app)?;
    Ok(model_dir.join(MODEL_FILENAME))
}

/// Check if model is already downloaded
#[tauri::command]
pub async fn check_model_status(app: AppHandle) -> Result<AiStatus, String> {
    let model_path = get_model_path(&app)?;

    let mut state = AI_STATE.write();

    // If model is already loaded, return Ready
    if state.model.is_some() {
        state.status = AiStatus::Ready;
        return Ok(state.status.clone());
    }

    // Check if model file exists
    if model_path.exists() {
        // Check file size (model should be ~80MB)
        let metadata = std::fs::metadata(&model_path)
            .map_err(|e| format!("Failed to read model metadata: {}", e))?;

        if metadata.len() > 50_000_000 {
            // File seems valid
            state.model_path = Some(model_path);
            state.status = AiStatus::Loading;
            return Ok(AiStatus::Loading);
        }
    }

    state.status = AiStatus::NotDownloaded;
    Ok(AiStatus::NotDownloaded)
}

/// Download the AI model
#[tauri::command]
pub async fn download_model(app: AppHandle) -> Result<(), String> {
    let model_path = get_model_path(&app)?;

    // Update status to downloading
    {
        let mut state = AI_STATE.write();
        state.status = AiStatus::Downloading { progress: 0.0 };
    }

    // Emit initial progress
    let _ = app.emit("ai-status", AiStatus::Downloading { progress: 0.0 });

    // Create HTTP client
    let client = reqwest::Client::builder()
        .user_agent("SmartStorageAI/1.0")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    // Start download
    let response = client.get(MODEL_URL)
        .send()
        .await
        .map_err(|e| format!("Failed to start download: {}", e))?;

    if !response.status().is_success() {
        let error_msg = format!("Download failed with status: {}", response.status());
        let mut state = AI_STATE.write();
        state.status = AiStatus::Error { message: error_msg.clone() };
        let _ = app.emit("ai-status", state.status.clone());
        return Err(error_msg);
    }

    let total_size = response.content_length().unwrap_or(0);

    // Create temp file for download
    let temp_path = model_path.with_extension("gguf.downloading");
    let mut file = tokio::fs::File::create(&temp_path)
        .await
        .map_err(|e| format!("Failed to create temp file: {}", e))?;

    let mut downloaded: u64 = 0;
    let mut stream = response.bytes_stream();

    use futures_util::StreamExt;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Download error: {}", e))?;

        file.write_all(&chunk)
            .await
            .map_err(|e| format!("Failed to write chunk: {}", e))?;

        downloaded += chunk.len() as u64;

        let progress = if total_size > 0 {
            (downloaded as f32 / total_size as f32) * 100.0
        } else {
            0.0
        };

        // Update status
        {
            let mut state = AI_STATE.write();
            state.status = AiStatus::Downloading { progress };
        }

        // Emit progress event (throttle to every 1%)
        if (progress as u32) % 1 == 0 {
            let _ = app.emit("ai-status", AiStatus::Downloading { progress });
            let _ = app.emit("download-progress", DownloadProgress {
                downloaded,
                total: total_size,
                progress,
            });
        }
    }

    // Ensure file is flushed
    file.flush().await.map_err(|e| format!("Failed to flush file: {}", e))?;
    drop(file);

    // Rename temp file to final path
    tokio::fs::rename(&temp_path, &model_path)
        .await
        .map_err(|e| format!("Failed to rename temp file: {}", e))?;

    // Update state
    {
        let mut state = AI_STATE.write();
        state.model_path = Some(model_path);
        state.status = AiStatus::Loading;
    }

    let _ = app.emit("ai-status", AiStatus::Loading);

    Ok(())
}

/// Load the AI model into memory
#[tauri::command]
pub async fn load_model(app: AppHandle) -> Result<(), String> {
    let model_path = {
        let state = AI_STATE.read();
        state.model_path.clone()
    };

    let model_path = match model_path {
        Some(path) => path,
        None => {
            // Try to get path from app
            let path = get_model_path(&app)?;
            if !path.exists() {
                return Err("Model not downloaded yet".to_string());
            }
            let mut state = AI_STATE.write();
            state.model_path = Some(path.clone());
            path
        }
    };

    // Update status
    {
        let mut state = AI_STATE.write();
        state.status = AiStatus::Loading;
    }
    let _ = app.emit("ai-status", AiStatus::Loading);

    // Load model in a blocking task
    let model_path_clone = model_path.clone();
    let result = tokio::task::spawn_blocking(move || {
        // Initialize llama backend
        let backend = llama_cpp_2::llama_backend::LlamaBackend::init()
            .map_err(|e| format!("Failed to initialize llama backend: {}", e))?;

        // Model parameters
        let model_params = llama_cpp_2::model::params::LlamaModelParams::default();

        // Load model
        let model = llama_cpp_2::LlamaModel::load_from_file(&backend, &model_path_clone, &model_params)
            .map_err(|e| format!("Failed to load model: {}", e))?;

        Ok::<_, String>(model)
    })
    .await
    .map_err(|e| format!("Task error: {}", e))?;

    match result {
        Ok(model) => {
            let mut state = AI_STATE.write();
            state.model = Some(model);
            state.status = AiStatus::Ready;
            let _ = app.emit("ai-status", AiStatus::Ready);
            Ok(())
        }
        Err(e) => {
            let mut state = AI_STATE.write();
            state.status = AiStatus::Error { message: e.clone() };
            let _ = app.emit("ai-status", state.status.clone());
            Err(e)
        }
    }
}

/// Generate AI response
#[tauri::command]
pub async fn generate_response(prompt: String) -> Result<String, String> {
    // Check if model is ready
    let state = AI_STATE.read();

    if state.model.is_none() {
        return Err("Model not loaded".to_string());
    }

    // Clone what we need for the blocking task
    let model_path = state.model_path.clone()
        .ok_or("Model path not set")?;
    drop(state);

    // Format prompt for SmolLM2-Instruct
    let formatted_prompt = format!(
        "<|im_start|>system\nYou are a helpful AI assistant for Smart Storage AI, a privacy-first file organization app. You help users organize their files by type, date, or size. Be concise and helpful. You run 100% locally on the user's device.<|im_end|>\n<|im_start|>user\n{}<|im_end|>\n<|im_start|>assistant\n",
        prompt
    );

    // Run inference in blocking task
    let result = tokio::task::spawn_blocking(move || {
        // Re-initialize for this thread (llama-cpp-2 models aren't thread-safe to share)
        let backend = llama_cpp_2::llama_backend::LlamaBackend::init()
            .map_err(|e| format!("Backend init error: {}", e))?;

        let model_params = llama_cpp_2::model::params::LlamaModelParams::default();
        let model = llama_cpp_2::LlamaModel::load_from_file(&backend, &model_path, &model_params)
            .map_err(|e| format!("Model load error: {}", e))?;

        // Create context
        let ctx_params = llama_cpp_2::context::params::LlamaContextParams::default()
            .with_n_ctx(std::num::NonZeroU32::new(512));

        let mut ctx = model.new_context(&backend, ctx_params)
            .map_err(|e| format!("Context error: {}", e))?;

        // Tokenize input
        let tokens = model.str_to_token(&formatted_prompt, llama_cpp_2::model::AddBos::Always)
            .map_err(|e| format!("Tokenize error: {}", e))?;

        // Create batch
        let mut batch = llama_cpp_2::llama_batch::LlamaBatch::new(512, 1);

        // Add tokens to batch
        for (i, token) in tokens.iter().enumerate() {
            batch.add(*token, i as i32, &[0], i == tokens.len() - 1)
                .map_err(|e| format!("Batch add error: {}", e))?;
        }

        // Decode
        ctx.decode(&mut batch)
            .map_err(|e| format!("Decode error: {}", e))?;

        // Generate response
        let mut output = String::new();
        let mut n_cur = batch.n_tokens();
        let n_len = 256; // Max tokens to generate

        // Sampler setup
        let mut sampler = llama_cpp_2::sampling::LlamaSampler::chain_simple(
            llama_cpp_2::sampling::params::LlamaSamplerChainParams::default(),
        );
        sampler.add_temp(0.7);
        sampler.add_top_p(0.9, 1);
        sampler.add_dist(42);

        while n_cur < n_len as i32 {
            // Sample next token
            let new_token_id = sampler.sample(&ctx, batch.n_tokens() - 1);

            // Check for end of sequence
            if model.is_eog_token(new_token_id) {
                break;
            }

            // Convert token to string
            let token_str = model.token_to_str(new_token_id, llama_cpp_2::model::Special::Tokenize)
                .map_err(|e| format!("Token convert error: {}", e))?;

            // Check for end markers
            if token_str.contains("<|im_end|>") || token_str.contains("<|endoftext|>") {
                break;
            }

            output.push_str(&token_str);

            // Prepare next batch
            batch.clear();
            batch.add(new_token_id, n_cur, &[0], true)
                .map_err(|e| format!("Batch add error: {}", e))?;

            // Decode
            ctx.decode(&mut batch)
                .map_err(|e| format!("Decode error: {}", e))?;

            n_cur += 1;
        }

        Ok::<_, String>(output.trim().to_string())
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?;

    result
}

/// Initialize AI on app startup
#[tauri::command]
pub async fn init_ai(app: AppHandle) -> Result<AiStatus, String> {
    let status = check_model_status(app.clone()).await?;

    match status {
        AiStatus::Loading => {
            // Model exists, try to load it
            if let Err(e) = load_model(app.clone()).await {
                // If loading fails, return the error status
                return Ok(AiStatus::Error { message: e });
            }
            Ok(AiStatus::Ready)
        }
        _ => Ok(status)
    }
}

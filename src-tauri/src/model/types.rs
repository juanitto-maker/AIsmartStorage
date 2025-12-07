// ============================================================================
// Model Types - SmolLM2 model data structures
// ============================================================================

use serde::{Deserialize, Serialize};

/// Status of the model (assembly and loading state)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelStatus {
    pub assembled: bool,
    pub loaded: bool,
    pub model_path: Option<String>,
    pub model_name: String,
    pub error: Option<String>,
}

impl Default for ModelStatus {
    fn default() -> Self {
        Self {
            assembled: false,
            loaded: false,
            model_path: None,
            model_name: "SmolLM2-135M-Instruct".to_string(),
            error: None,
        }
    }
}

/// Model manifest from smollm2-manifest.json
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelManifest {
    pub model_name: String,
    pub model_file: String,
    pub total_size: u64,
    pub parts: Vec<ModelPart>,
    pub checksum_sha256: String,
    pub source: String,
    pub license: String,
    pub quantization: String,
    pub context_length: u32,
    pub instructions: String,
}

/// Individual model part information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelPart {
    pub file: String,
    pub size: u64,
    pub order: u32,
}

/// Chat message for conversation history
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

/// Model configuration for inference
#[derive(Debug, Clone)]
pub struct ModelConfig {
    pub n_ctx: u32,
    pub n_threads: u32,
    pub max_tokens: u32,
    pub temperature: f32,
    pub top_p: f32,
    pub repeat_penalty: f32,
}

impl Default for ModelConfig {
    fn default() -> Self {
        Self {
            n_ctx: 2048,
            n_threads: 4,
            max_tokens: 256,
            temperature: 0.7,
            top_p: 0.9,
            repeat_penalty: 1.1,
        }
    }
}

/// System prompt for the file organization assistant
pub const SYSTEM_PROMPT: &str = r#"You are a helpful file organization assistant for Smart Storage AI.
You help users organize their files by understanding natural language commands.
When users ask to organize files, respond with the action you'll take.
Be concise and helpful. Focus on file organization tasks.
Keep responses under 3 sentences when possible."#;

// ============================================================================
// Model Module - SmolLM2 model management and inference
// ============================================================================

pub mod types;
pub mod assembler;
pub mod inference;

pub use types::{ModelStatus, ModelManifest, ModelConfig, ChatMessage, SYSTEM_PROMPT};
pub use assembler::{read_manifest, check_assembled_model, assemble_model_parts, get_model_status};
pub use inference::{LlamaModel, ModelState, SharedModelState, create_shared_state};

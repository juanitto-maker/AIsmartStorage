# Claude Code Task: Integrate SmolLM into Smart Storage AI

## Context

Repository: https://github.com/juanitto-maker/AIsmartStorage

The SmolLM2-135M-Instruct model is stored in the `Models/` folder as split parts (each under 25MB for GitHub upload). The app needs to:
1. Join the model parts on first launch
2. Load the model using llama.cpp
3. Provide chat inference for the AI assistant

## Current Model Files

```
Models/
├── smollm2-manifest.json
├── smollm2-135m-instruct.gguf.part_aa (20MB)
├── smollm2-135m-instruct.gguf.part_ab (20MB)
├── smollm2-135m-instruct.gguf.part_ac (20MB)
├── smollm2-135m-instruct.gguf.part_ad (20MB)
└── smollm2-135m-instruct.gguf.part_ae (12MB)
```

## Tech Stack

- Framework: Tauri 2.0 (Rust backend + WebView frontend)
- Frontend: SolidJS + TailwindCSS
- AI Runtime: llama-cpp-rs (Rust bindings for llama.cpp)
- Target: Android first, then Desktop

## Implementation Requirements

### 1. Rust Backend (src-tauri/)

Create these Tauri commands:

```rust
// Commands needed:
#[tauri::command]
async fn check_model_status() -> Result<ModelStatus, String>

#[tauri::command]
async fn assemble_model() -> Result<(), String>

#[tauri::command]
async fn load_model() -> Result<(), String>

#[tauri::command]
async fn chat(message: String) -> Result<String, String>

#[tauri::command]
async fn unload_model() -> Result<(), String>
```

### 2. Model Assembly Logic

```rust
// Pseudocode for assembling model parts
fn assemble_model_parts() -> Result<PathBuf> {
    let manifest = read_manifest("Models/smollm2-manifest.json")?;
    let output_path = app_data_dir().join(&manifest.model_file);
    
    if output_path.exists() {
        // Verify checksum
        if verify_sha256(&output_path, &manifest.checksum_sha256) {
            return Ok(output_path);
        }
    }
    
    // Join parts in order
    let mut output = File::create(&output_path)?;
    for part in manifest.parts.sorted_by_order() {
        let part_data = read_file(&format!("Models/{}", part.file))?;
        output.write_all(&part_data)?;
    }
    
    // Verify final checksum
    verify_sha256(&output_path, &manifest.checksum_sha256)?;
    
    Ok(output_path)
}
```

### 3. LLM Inference

Use `llama-cpp-rs` or `llama-cpp-2` crate:

```toml
# Cargo.toml dependencies
[dependencies]
llama-cpp-2 = "0.1"  # or llama-cpp-rs
```

```rust
// Model loading and inference
use llama_cpp_2::LlamaModel;

struct AppState {
    model: Option<LlamaModel>,
}

fn load_model(path: &Path) -> Result<LlamaModel> {
    LlamaModel::load_from_file(path, LlamaParams {
        n_ctx: 2048,
        n_threads: 4,
        ..Default::default()
    })
}

fn generate_response(model: &LlamaModel, prompt: &str) -> String {
    // SmolLM2 chat template
    let formatted = format!(
        "<|im_start|>system\nYou are a helpful file organization assistant.<|im_end|>\n<|im_start|>user\n{}<|im_end|>\n<|im_start|>assistant\n",
        prompt
    );
    
    model.generate(&formatted, GenerateParams {
        max_tokens: 256,
        temperature: 0.7,
        stop: vec!["<|im_end|>".to_string()],
        ..Default::default()
    })
}
```

### 4. Frontend Integration (src/)

```typescript
// lib/ai.ts
import { invoke } from '@tauri-apps/api/core';

export interface ModelStatus {
  assembled: boolean;
  loaded: boolean;
  modelPath: string | null;
}

export async function checkModelStatus(): Promise<ModelStatus> {
  return await invoke('check_model_status');
}

export async function assembleModel(): Promise<void> {
  await invoke('assemble_model');
}

export async function loadModel(): Promise<void> {
  await invoke('load_model');
}

export async function chat(message: string): Promise<string> {
  return await invoke('chat', { message });
}

export async function unloadModel(): Promise<void> {
  await invoke('unload_model');
}
```

### 5. Chat Component Integration

```tsx
// components/ChatPanel.tsx
import { createSignal, onMount } from 'solid-js';
import { checkModelStatus, assembleModel, loadModel, chat } from '../lib/ai';

export function ChatPanel() {
  const [messages, setMessages] = createSignal([]);
  const [input, setInput] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [modelReady, setModelReady] = createSignal(false);
  const [statusMsg, setStatusMsg] = createSignal('Checking model...');

  onMount(async () => {
    try {
      const status = await checkModelStatus();
      
      if (!status.assembled) {
        setStatusMsg('Assembling model (first time only)...');
        await assembleModel();
      }
      
      if (!status.loaded) {
        setStatusMsg('Loading AI model...');
        await loadModel();
      }
      
      setModelReady(true);
      setStatusMsg('');
    } catch (e) {
      setStatusMsg(`Error: ${e}`);
    }
  });

  const sendMessage = async () => {
    if (!input() || loading()) return;
    
    const userMsg = input();
    setInput('');
    setMessages([...messages(), { role: 'user', content: userMsg }]);
    setLoading(true);
    
    try {
      const response = await chat(userMsg);
      setMessages([...messages(), 
        { role: 'user', content: userMsg },
        { role: 'assistant', content: response }
      ]);
    } catch (e) {
      setMessages([...messages(),
        { role: 'user', content: userMsg },
        { role: 'assistant', content: `Error: ${e}` }
      ]);
    }
    
    setLoading(false);
  };

  return (
    <div class="chat-panel">
      {/* Render messages and input */}
    </div>
  );
}
```

## File Structure to Create

```
src-tauri/
├── Cargo.toml           (add llama-cpp dependency)
├── src/
│   ├── main.rs          (register commands)
│   ├── model/
│   │   ├── mod.rs
│   │   ├── assembler.rs (join model parts)
│   │   ├── inference.rs (llama.cpp wrapper)
│   │   └── types.rs     (ModelStatus, etc.)
│   └── commands/
│       └── ai.rs        (Tauri commands)

src/
├── lib/
│   └── ai.ts            (frontend API)
└── components/
    └── ChatPanel.tsx    (updated with AI)
```

## Important Notes

1. **Android Considerations:**
   - Model path should use app data directory
   - Consider memory constraints (~100MB for model)
   - Use background thread for inference

2. **First Launch Flow:**
   ```
   App Start → Check if model assembled → If not, show progress → Assemble → Load → Ready
   ```

3. **Chat Template (SmolLM2-Instruct):**
   ```
   <|im_start|>system
   {system_message}<|im_end|>
   <|im_start|>user
   {user_message}<|im_end|>
   <|im_start|>assistant
   ```

4. **System Prompt for File Organization:**
   ```
   You are a helpful file organization assistant for Smart Storage AI. 
   You help users organize their files by understanding natural language commands.
   When users ask to organize files, respond with the action you'll take.
   Be concise and helpful. Focus on file organization tasks.
   ```

## Deliverables

Please create:
1. Complete Rust backend with model assembly and inference
2. TypeScript frontend API wrapper
3. Updated ChatPanel component with AI integration
4. Cargo.toml with correct dependencies
5. Any additional files needed

## Constraints

- User works on Android mobile only (no terminal)
- All code should be complete files ready to upload to GitHub
- API keys must never be in code (though this is local model, no API needed)
- Test that model loading works on Android ARM64

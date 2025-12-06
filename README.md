# 🗄️ Smart Storage AI

> **Privacy-first, fully local AI file organizer with natural language chat**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Platform](https://img.shields.io/badge/Platform-Android%20|%20Windows%20|%20Mac%20|%20Linux-green.svg)]()
[![AI](https://img.shields.io/badge/AI-100%25%20Local-purple.svg)]()

---

<p align="center">
  <img src="docs/assets/screenshot-placeholder.png" alt="Smart Storage AI Screenshot" width="600">
</p>

---

## ✨ What is Smart Storage AI?

Smart Storage AI is an open-source file organization app that uses **tiny AI models** running **entirely on your device**. No cloud, no data collection, no privacy concerns.

**Just tell it what you want:**
- *"Organize my downloads by file type"*
- *"Separate work documents from personal"*
- *"Find all tax-related files"*

**See the changes before applying** — preview the new structure, then confirm or modify.

---

## 🎯 Key Features

| Feature | Description |
|---------|-------------|
| 💬 **Natural Language Chat** | Talk to your file system like a human |
| 👁️ **Live Preview** | See proposed changes before applying |
| 🔒 **100% Local** | Zero network calls, all AI on-device |
| 📱 **Cross-Platform** | Android, Windows, Mac, Linux |
| 🪶 **Tiny Footprint** | ~130MB total (vs 2GB+ competitors) |
| ↩️ **Full Undo** | Rollback any changes instantly |
| 📄 **Content Aware** | Understands PDF, DOCX, images, audio |
| 🔓 **Open Source** | AGPLv3 — audit the code yourself |

---

## 🖥️ Interface

```
┌─────────────────────────────────┬─────────────────────────────┐
│                                 │                             │
│  📁 CURRENT FILES               │  💬 AI CHAT                 │
│  ├── Downloads/                 │                             │
│  │   ├── report.pdf             │  You: "Organize by type"    │
│  │   ├── photo.jpg              │                             │
│  │   └── song.mp3               │  AI: "I'll create 3         │
│  └── Documents/                 │  folders: Documents,        │
│                                 │  Images, Audio. Preview     │
├─────────────────────────────────┤  ready!"                    │
│                                 │                             │
│  👁️ PREVIEW                     │                             │
│  ├── 📄 Documents/              │  [Type your message...]     │
│  │   └── report.pdf             │                             │
│  ├── 🖼️ Images/                 │                             │
│  │   └── photo.jpg              │                             │
│  └── 🎵 Audio/                  │                             │
│      └── song.mp3               │                             │
│                                 │                             │
│  [✅ Apply] [❌ Cancel] [↩️ Undo] │                             │
│                                 │                             │
└─────────────────────────────────┴─────────────────────────────┘
```

---

## 🔒 Privacy First

We believe your files are **your business**. Smart Storage AI:

| ✅ Does | ❌ Never Does |
|---------|---------------|
| Runs 100% on your device | Connects to the internet |
| Uses tiny local AI models | Uploads your files anywhere |
| Stores index locally only | Collects analytics/telemetry |
| Open source for auditing | Requires account/login |

**Verify yourself:**
- Build from source
- Monitor network traffic (zero calls)
- Read every line of code

---

## 📦 Installation

### Android

**F-Droid (Recommended):**
```
Coming soon
```

**Play Store:**
```
Coming soon
```

**Direct APK:**
```
See Releases page
```

### Desktop

**Windows:**
```bash
# Download from Releases
SmartStorageAI-x.x.x-windows.msi
```

**macOS:**
```bash
# Download from Releases
SmartStorageAI-x.x.x-macos.dmg
```

**Linux:**
```bash
# AppImage (universal)
chmod +x SmartStorageAI-x.x.x.AppImage
./SmartStorageAI-x.x.x.AppImage

# Debian/Ubuntu
sudo dpkg -i smart-storage-ai_x.x.x_amd64.deb
```

---

## 🚀 Quick Start

1. **Install** the app on your device
2. **Grant** storage permissions when prompted
3. **Select** a folder to organize (e.g., Downloads)
4. **Type** a command: *"Organize by file type"*
5. **Review** the preview on the left panel
6. **Apply** or modify as needed

---

## 💬 Example Commands

**Organization:**
```
"Organize my downloads by file type"
"Sort photos by year and month"
"Group work documents separately from personal"
"Create folders for each project"
```

**Search:**
```
"Find all documents mentioning invoice"
"Show me files larger than 100MB"
"Where are my tax documents from 2023?"
```

**Analysis:**
```
"What's taking up the most space?"
"Show duplicate files"
"Which folders haven't been used in a year?"
```

**Suggestions:**
```
"How should I organize this folder?"
"Suggest a better structure"
```

---

## 🧠 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  Your Request: "Organize downloads by type"                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  SmolLM (135M) - Understands your request                  │
│  → action: ORGANIZE, criteria: FILE_TYPE                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  File Scanner - Analyzes your files                        │
│  → 47 files found, 5 types detected                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  TRM (7M) - Plans optimal organization                     │
│  → Creates logical folder structure                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Preview - Shows you the proposed changes                  │
│  → You approve, modify, or cancel                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Execute - Moves files safely with full undo               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture

| Component | Size | Purpose |
|-----------|------|---------|
| SmolLM 135M | ~100MB | Natural language understanding |
| TRM | ~7MB | Organization reasoning |
| Embeddings | ~50MB | Semantic search |
| Core App | ~10MB | UI + file operations |
| **Total** | **~170MB** | Full AI-powered app |

**Optional Pro modules:**
| Component | Size | Purpose |
|-----------|------|---------|
| MobileCLIP | ~50MB | Image understanding |
| Whisper | ~75MB | Audio transcription |
| Tesseract | ~30MB | OCR |

---

## 📊 Comparison

| Feature | Smart Storage AI | Local-File-Organizer | AI File Sorter | Sparkle |
|---------|------------------|---------------------|----------------|---------|
| Android | ✅ | ❌ | ❌ | ❌ |
| Desktop | ✅ | ✅ | ✅ | Mac only |
| Chat UI | ✅ | ❌ | ❌ | ❌ |
| Preview | ✅ | ❌ | ✅ | ❌ |
| Model Size | ~170MB | 3-7GB | 3-7GB | Cloud |
| Open Source | ✅ AGPL | ✅ MIT | Partial | ❌ |
| 100% Local | ✅ | ✅ | ✅ | ❌ |
| Content AI | ✅ | ✅ | ⚠️ | ⚠️ |

---

## 💎 Editions

### 🆓 Community Edition (Free & Open Source)

- ✅ Full file browser + preview
- ✅ AI chat (SmolLM)
- ✅ Organize by type, date, size
- ✅ Text content extraction (PDF, DOCX)
- ✅ Semantic search
- ✅ Undo/rollback
- ✅ Single storage location

**Free forever. Full source on GitHub.**

### 💎 Pro Edition ($9.99 one-time)

Everything in Community, plus:

- ⭐ TRM advanced reasoning
- ⭐ Image understanding (MobileCLIP)
- ⭐ Audio transcription (Whisper)
- ⭐ OCR for scanned documents
- ⭐ Custom organization rules
- ⭐ Scheduled auto-organize
- ⭐ Multiple storage locations
- ⭐ Database encryption
- ⭐ Priority support

**Source available for security audit.**

---

## 🛠️ Building from Source

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Node.js](https://nodejs.org/) (v18+)
- [Android Studio](https://developer.android.com/studio) (for Android builds)

### Build

```bash
# Clone repository
git clone https://github.com/[username]/smart-storage-ai
cd smart-storage-ai

# Install dependencies
npm install

# Development (desktop)
npm run tauri dev

# Build Android
npm run tauri android build

# Build Desktop (all platforms)
npm run tauri build
```

### Verify Builds

```bash
# Check APK signature
apksigner verify --print-certs app-release.apk

# Compare with release hash
sha256sum app-release.apk
```

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Areas We Need Help

- 🎨 UI/UX improvements
- 📱 Platform-specific optimizations
- 🌍 Translations
- 📝 Documentation
- 🧪 Testing
- 🔌 New file type extractors

### Development Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/smart-storage-ai
cd smart-storage-ai

# Create branch
git checkout -b feature/your-feature

# Make changes, then
git commit -m "feat: add your feature"
git push origin feature/your-feature

# Open Pull Request
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Technical Spec](docs/SPEC.md) | Full architecture & design |
| [Roadmap](docs/ROADMAP.md) | Development milestones |
| [Contributing](CONTRIBUTING.md) | How to contribute |
| [Security](SECURITY.md) | Security policy |
| [FAQ](docs/FAQ.md) | Frequently asked questions |

---

## 🗺️ Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| 1. Foundation | 🔲 | File browser, preview, undo |
| 2. AI Chat | 🔲 | Natural language with SmolLM |
| 3. Content | 🔲 | PDF/DOCX extraction, search |
| 4. TRM | 🔲 | Smart organization reasoning |
| 5. Pro | 🔲 | Image/audio AI, premium |
| 6. Polish | 🔲 | Cross-platform, distribution |

See [ROADMAP.md](docs/ROADMAP.md) for detailed milestones.

---

## ❓ FAQ

**Q: Is my data really private?**
> Yes. The app makes zero network connections. All AI runs on your device. Verify by monitoring network traffic or building from source.

**Q: Why is the app so small compared to others?**
> We use TRM (7M parameters) for reasoning instead of massive LLMs (7B+ parameters). It's purpose-built for organization tasks.

**Q: Can it organize my entire phone storage?**
> Yes, with proper permissions. We recommend starting with Downloads to get familiar.

**Q: What if it messes up my files?**
> Every change is logged. Use the Undo button to revert any operation instantly.

**Q: Why open source?**
> For a privacy app, trust requires transparency. You can audit every line of code.

---

## 📄 License

**Community Edition:** [GNU AGPLv3](LICENSE)

- ✅ Use for any purpose
- ✅ Modify and distribute
- ✅ Access source code
- ⚠️ Share modifications under same license
- ⚠️ Provide source for network services

**Pro Edition:** Source Available (audit only, not redistributable)

---

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) — Cross-platform framework
- [SmolLM](https://huggingface.co/HuggingFaceTB/SmolLM-135M) — Tiny language model
- [TRM](https://arxiv.org/abs/2510.04871) — Tiny Recursive Model research
- [SQLite](https://sqlite.org/) — Embedded database
- All our [contributors](CONTRIBUTORS.md)

---

## 📬 Contact

- **Issues:** [GitHub Issues](https://github.com/[username]/smart-storage-ai/issues)
- **Discussions:** [GitHub Discussions](https://github.com/[username]/smart-storage-ai/discussions)
- **Email:** [your-email]

---

<p align="center">
  <strong>Your files. Your device. Your control.</strong>
</p>

<p align="center">
  Made with ❤️ for privacy
</p>

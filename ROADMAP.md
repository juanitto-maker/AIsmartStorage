# Smart Storage AI - Development Roadmap

> **Status:** Planning  
> **Approach:** Milestone-based (no fixed timelines)

---

## Vision

A privacy-first, fully local AI file organizer with natural language chat and live preview.

---

## Phase 1: Foundation (MVP)

**Goal:** Working Android app with basic organization

### Milestones

- [ ] **M1.1** Project setup
  - Tauri Mobile initialized
  - Basic project structure
  - Build pipeline working

- [ ] **M1.2** File Browser UI
  - Tree view of storage
  - Navigate folders
  - File metadata display (size, date, type)
  - Storage selection (internal/external)

- [ ] **M1.3** Preview Panel
  - Side-by-side layout (current vs proposed)
  - Visual diff of changes
  - Expand/collapse folders

- [ ] **M1.4** Rule-Based Organization
  - Organize by file type
  - Organize by date (year/month)
  - Organize by size
  - Custom folder naming

- [ ] **M1.5** File Operations
  - Move files safely
  - Create folders
  - Batch operations
  - Error handling

- [ ] **M1.6** Undo System
  - Change log (SQLite)
  - Undo last operation
  - Undo batch
  - View history

- [ ] **M1.7** Basic UI Polish
  - Dark/light theme
  - Responsive layout
  - Loading states
  - Error messages

### Exit Criteria
- [ ] Can browse all storage
- [ ] Can organize by type with preview
- [ ] Can apply and undo changes
- [ ] Works on Android device

---

## Phase 2: AI Chat

**Goal:** Natural language understanding

### Milestones

- [ ] **M2.1** Chat UI
  - Message input
  - Conversation history
  - Assistant responses
  - Clear conversation

- [ ] **M2.2** SmolLM Integration
  - ONNX Runtime setup
  - Model loading
  - Basic inference working

- [ ] **M2.3** Intent Parsing
  - Parse "organize by type" to structured command
  - Parse "sort by date" to structured command
  - Parse folder targets
  - Handle ambiguous requests

- [ ] **M2.4** Response Generation
  - Explain proposed changes
  - Confirm actions
  - Error explanations
  - Suggestions

- [ ] **M2.5** Conversation Context
  - Remember current folder
  - Follow-up commands ("also by date")
  - Corrections ("no, just photos")

### Exit Criteria
- [ ] Can type natural language requests
- [ ] AI understands basic organization commands
- [ ] AI explains what it will do
- [ ] Conversation feels natural

---

## Phase 3: Content Extraction

**Goal:** Understand file contents

### Milestones

- [ ] **M3.1** Text File Reading
  - TXT, MD, JSON, code files
  - Encoding detection
  - Content preview

- [ ] **M3.2** PDF Extraction
  - Text extraction
  - Metadata (title, author)
  - Page count

- [ ] **M3.3** Office Documents
  - DOCX text extraction
  - XLSX basic reading
  - PPTX text extraction

- [ ] **M3.4** Content Indexing
  - SQLite storage
  - Keyword extraction
  - Incremental updates
  - Index status UI

- [ ] **M3.5** Embedding Generation
  - Sentence embeddings
  - Vector storage (sqlite-vss)
  - Similarity search

- [ ] **M3.6** Semantic Search
  - "Find documents about taxes"
  - "Show invoices from March"
  - Results ranking
  - Search UI

### Exit Criteria
- [ ] Can extract text from PDF/DOCX
- [ ] Can search by content
- [ ] Semantic search works
- [ ] Index updates automatically

---

## Phase 4: Smart Organization (TRM)

**Goal:** AI-powered organization decisions

### Milestones

- [ ] **M4.1** Training Data Creation
  - Generate synthetic file lists
  - Create ground truth organizations
  - Edge cases (conflicts, duplicates)
  - ~10,000 examples

- [ ] **M4.2** TRM Training
  - Setup training environment (Colab/cloud)
  - Train model
  - Evaluate performance
  - Export to ONNX

- [ ] **M4.3** TRM Integration
  - Load model in app
  - Connect to organization engine
  - Replace rule-based logic

- [ ] **M4.4** Conflict Resolution
  - File fits multiple categories
  - Naming conflicts
  - User preference learning

- [ ] **M4.5** Advanced Organization
  - Work vs Personal detection
  - Project grouping
  - Temporal organization
  - Content-based grouping

- [ ] **M4.6** Preference Learning
  - Remember user choices
  - Improve over time
  - Export/import preferences

### Exit Criteria
- [ ] TRM generates better organizations than rules
- [ ] Handles edge cases gracefully
- [ ] Learns from user corrections

---

## Phase 5: Advanced Content (Pro Features)

**Goal:** Image and audio understanding

### Milestones

- [ ] **M5.1** Image Understanding
  - MobileCLIP integration
  - Scene/object detection
  - Image categorization
  - "Find photos of mountains"

- [ ] **M5.2** OCR
  - Tesseract integration
  - Scanned document text
  - Receipt/invoice reading
  - Handwriting (basic)

- [ ] **M5.3** Audio Transcription
  - Whisper tiny integration
  - Voice memo transcription
  - Podcast/audio content
  - Language detection

- [ ] **M5.4** Pro License System
  - License key validation (offline)
  - Feature gating
  - Upgrade prompts

- [ ] **M5.5** Advanced Features
  - Scheduled auto-organize
  - Custom rules builder
  - Multiple storage locations
  - Database encryption

### Exit Criteria
- [ ] Can understand image content
- [ ] Can transcribe audio
- [ ] Pro features properly gated
- [ ] Upgrade flow works

---

## Phase 6: Cross-Platform and Polish

**Goal:** Production ready, all platforms

### Milestones

- [ ] **M6.1** Desktop Builds
  - Windows build working
  - macOS build working
  - Linux build working
  - Consistent UI across platforms

- [ ] **M6.2** Platform-Specific Optimizations
  - Android: SAF, battery optimization
  - Windows: Explorer integration
  - macOS: Finder integration
  - Linux: File manager integration

- [ ] **M6.3** Performance Optimization
  - Lazy loading for large folders
  - Background indexing
  - Memory management
  - Battery efficiency

- [ ] **M6.4** Testing and QA
  - Full test coverage
  - Edge case testing
  - Performance benchmarks
  - Security audit

- [ ] **M6.5** Documentation
  - User guide
  - FAQ
  - Troubleshooting
  - API docs (for contributors)

- [ ] **M6.6** Distribution
  - F-Droid submission
  - Play Store submission
  - GitHub releases
  - Website

- [ ] **M6.7** Community
  - Contributing guide
  - Issue templates
  - Discord/discussions setup
  - First contributors onboarding

### Exit Criteria
- [ ] Works on all target platforms
- [ ] Performance acceptable on low-end devices
- [ ] Documentation complete
- [ ] Available for download

---

## Future Phases (Post-Launch)

### Phase 7: Team Features
- [ ] Shared organization rules
- [ ] Local network sync
- [ ] Audit logging
- [ ] Admin controls

### Phase 8: Integrations
- [ ] Cloud storage mounting (read-only)
- [ ] Backup integration
- [ ] Export to other formats

### Phase 9: Advanced AI
- [ ] Custom model fine-tuning
- [ ] User-specific training
- [ ] Predictive organization

---

## Progress Tracking

### Overall Status

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation | Not Started | 0% |
| Phase 2: AI Chat | Not Started | 0% |
| Phase 3: Content | Not Started | 0% |
| Phase 4: TRM | Not Started | 0% |
| Phase 5: Pro | Not Started | 0% |
| Phase 6: Polish | Not Started | 0% |

### Status Legend

- [ ] Not Started
- [WIP] In Progress
- [x] Complete
- [BLOCKED] Blocked
- [CANCEL] Cancelled

---

## How to Update This Roadmap

1. When starting a milestone, change status to [WIP]
2. Check off individual items as completed
3. When all items done, change milestone to [x]
4. Update phase progress percentage
5. Commit changes with message: `docs: update roadmap progress`

---

## Notes

- Phases can overlap (e.g., start Phase 2 while finishing Phase 1)
- Milestones within a phase should be done roughly in order
- Some milestones may be split or merged based on complexity discovered
- Community feedback may reprioritize features

---

*Last updated: December 2025*

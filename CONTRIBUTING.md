# Contributing to Smart Storage AI

First off, thank you for considering contributing to Smart Storage AI! It's people like you that make this project possible.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Style Guidelines](#style-guidelines)
- [Community](#community)

---

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the maintainers.

**Our Standards:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

---

## How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title** describing the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Device info**: Android version, device model, app version
- **Logs** if available

### 💡 Suggesting Features

Feature suggestions are welcome! Please:

- Check if the feature is already planned in [ROADMAP.md](ROADMAP.md)
- Check existing feature requests
- Describe the use case clearly
- Explain why this would benefit users

### 🔧 Contributing Code

#### Good First Issues

Look for issues labeled `good-first-issue` - these are great for newcomers!

#### Areas for Contribution

| Area | Skills Needed | Priority |
|------|---------------|----------|
| UI/UX improvements | SolidJS, CSS | High |
| File type extractors | Rust, parsing | Medium |
| Translations | Language skills | Medium |
| Documentation | Writing | High |
| Testing | Rust, TypeScript | High |
| Performance | Rust, profiling | Medium |

---

## Development Setup

### Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org/))
- **Rust** 1.70+ ([install](https://rustup.rs/))
- **Android SDK** (for mobile builds)
- **Git** ([download](https://git-scm.com/))

### Clone & Install

```bash
# Fork the repository on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/smart-storage-ai
cd smart-storage-ai

# Install Node dependencies
npm install

# Build Rust dependencies
cd src-tauri
cargo build
cd ..
```

### Running Development Server

```bash
# Desktop development
npm run tauri dev

# Android development (requires connected device or emulator)
npm run tauri android dev
```

### Running Tests

```bash
# Rust tests
cargo test

# TypeScript tests
npm test

# All tests
npm run test:all
```

### Building for Production

```bash
# Desktop (all platforms)
npm run tauri build

# Android
npm run tauri android build
```

---

## Pull Request Process

### Before Submitting

1. **Check existing PRs** to avoid duplicate work
2. **Open an issue first** for large changes
3. **Create a feature branch** from `main`
4. **Write tests** for new functionality
5. **Update documentation** if needed
6. **Run all tests** and linting

### Branch Naming

```
feature/add-pdf-extraction
bugfix/fix-undo-crash
docs/update-readme
refactor/improve-file-scanner
```

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add PDF text extraction
fix: resolve undo not working for batch operations
docs: update API documentation
refactor: improve file scanner performance
test: add tests for intent parser
chore: update dependencies
```

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How did you test this?

## Checklist
- [ ] Tests pass locally
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No new warnings
```

### Review Process

1. Submit PR with clear description
2. CI checks must pass (tests, linting)
3. At least one maintainer review required
4. Address feedback promptly
5. Squash commits if requested
6. Maintainer merges when ready

---

## Style Guidelines

### Rust

We use standard Rust formatting:

```bash
# Format code
cargo fmt

# Check for issues
cargo clippy
```

Key conventions:
- Use `snake_case` for functions and variables
- Use `CamelCase` for types and traits
- Document public APIs with `///`
- Handle errors properly (no `.unwrap()` in production code)

### TypeScript/SolidJS

```bash
# Lint
npm run lint

# Format
npm run format
```

Key conventions:
- Use TypeScript strict mode
- Prefer functional components
- Use Solid's reactivity system properly
- Keep components small and focused

### CSS/Tailwind

- Use Tailwind utility classes
- Create custom components for repeated patterns
- Follow mobile-first approach
- Ensure dark mode compatibility

### Documentation

- Use Markdown
- Include code examples
- Keep language simple and clear
- Update when code changes

---

## Project Structure

```
smart-storage-ai/
├── src/                      # Frontend (SolidJS)
│   ├── components/           # UI components
│   │   ├── FileTree/         # File browser
│   │   ├── Preview/          # Preview panel
│   │   ├── Chat/             # Chat interface
│   │   └── common/           # Shared components
│   ├── stores/               # State management
│   ├── hooks/                # Custom hooks
│   ├── utils/                # Helper functions
│   ├── styles/               # Global styles
│   ├── App.tsx               # Root component
│   └── index.tsx             # Entry point
│
├── src-tauri/                # Backend (Rust)
│   ├── src/
│   │   ├── main.rs           # Tauri entry
│   │   ├── commands/         # Tauri commands
│   │   │   ├── files.rs      # File operations
│   │   │   ├── organize.rs   # Organization logic
│   │   │   └── search.rs     # Search functionality
│   │   ├── ai/               # AI integration
│   │   │   ├── runtime.rs    # ONNX runtime
│   │   │   ├── chat.rs       # SmolLM interface
│   │   │   └── trm.rs        # TRM reasoning
│   │   ├── storage/          # Data layer
│   │   │   ├── db.rs         # SQLite operations
│   │   │   └── history.rs    # Change history
│   │   └── extractors/       # Content extraction
│   │       ├── text.rs       # Text files
│   │       ├── pdf.rs        # PDF extraction
│   │       └── office.rs     # Office documents
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── models/                   # AI models (git-lfs)
│   ├── smollm/               # Language model
│   ├── trm/                  # Reasoning model
│   └── embeddings/           # Embedding model
│
├── tests/                    # Test suites
│   ├── rust/                 # Rust tests
│   └── ts/                   # TypeScript tests
│
├── docs/                     # Documentation
│   ├── SPEC.md               # Technical spec
│   ├── API.md                # API reference
│   └── assets/               # Images, diagrams
│
├── .github/                  # GitHub config
│   ├── workflows/            # CI/CD
│   └── ISSUE_TEMPLATE/       # Issue templates
│
├── package.json
├── README.md
├── ROADMAP.md
├── CONTRIBUTING.md
├── LICENSE
└── .gitignore
```

---

## Community

### Getting Help

- **GitHub Discussions** - Questions and ideas
- **GitHub Issues** - Bug reports and features
- **Discord** (coming soon) - Real-time chat

### Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Annual contributor spotlight

---

## License

By contributing, you agree that your contributions will be licensed under the AGPLv3 License.

---

Thank you for contributing! 🙏

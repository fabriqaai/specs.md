# Tech Stack

Technology choices for specsmd.

---

## Languages

### Primary Language: JavaScript (Node.js)

**Rationale**: Node.js provides cross-platform compatibility, excellent CLI tooling support via Commander.js, and seamless npm distribution.

**Version**: Node.js 18+

---

## Framework

### CLI Framework: Commander.js

**Rationale**: Industry-standard CLI framework for Node.js with excellent argument parsing, help generation, and subcommand support.

---

## UI Libraries

### Terminal UI
- **chalk** - Terminal string styling
- **figlet** - ASCII art text generation
- **gradient-string** - Color gradients for terminal
- **inquirer** - Interactive command line prompts

**Rationale**: These libraries provide rich, colorful CLI experiences that make installation feel polished.

---

## File System

### fs-extra

**Rationale**: Extended file system methods (copy, move, mkdirp) that simplify installer operations.

---

## Configuration

### YAML (js-yaml)

**Rationale**: Human-readable configuration format for memory-bank schema, standards catalog, and manifests. Widely adopted in DevOps tooling.

---

## Package Management

### npm

**Rationale**: Standard Node.js package manager. Supports `npx` for zero-install execution.

---

## Distribution

### npm Registry

**Rationale**: Primary distribution channel for Node.js tools. Enables `npx specsmd install` pattern.

---

## Build & Tooling

### None Required

**Rationale**: Pure JavaScript with no transpilation needed. Keeps the project simple and reduces dependencies.

---

## Summary

| Category | Choice | Version |
|----------|--------|---------|
| Runtime | Node.js | 18+ |
| CLI Framework | Commander.js | Latest |
| Terminal UI | chalk, figlet, gradient-string, inquirer | Latest |
| File System | fs-extra | Latest |
| Configuration | js-yaml | Latest |
| Package Manager | npm | Latest |
| Distribution | npm Registry | - |

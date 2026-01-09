# Claude Instructions for specsmd Development

## Primary Directive: Strict AI-DLC Adherence

**Core Principle**: We are implementing AI-DLC as defined by AWS, not creating our own version of it.

---

## 1. **Required Reading Before Any AI-DLC Changes**

When working on AI-DLC flow implementation or documentation, you MUST read these files **IN ORDER**:

### Primary Source (ALWAYS FIRST)
1. **AI-DLC Specification**
   - PDF: `/resources/aidlc.pdf` (original AWS specification)
   - Text: `/resources/ai-dlc-specification.md` (readable version)
   - This is the authoritative source for AI-DLC concepts
   - If something is not in the official spec, it's not AI-DLC

### Implementation Files (READ SECOND)
2. **`/src/flows/aidlc/agents/`** - Agent implementations
   - Contains: Master, Inception, Construction, Operations agents
3. **`/src/flows/aidlc/`** - Memory bank configuration and skills
   - Contains: memory-bank.yaml, context-config.yaml, skills, templates

### Specifications (Reference)
4. **`/memory-bank/`** - Project specifications
   - Contains: PRFAQ, glossary, term-mappings, intents, standards
   - Structure follows AI-DLC: intents → units → stories

---

## 2. **AI-DLC Immutable Principles**

The following are FROM THE PDF and CANNOT be changed:

1. **Three Phases Only**: Inception → Construction → Operations
2. **Mob Rituals**: Mob Elaboration (Inception), Mob Construction (Construction)
3. **Bolt Duration**: "hours or days" (flexible, NOT fixed like "1-2 days")
4. **DDD Integration**: Domain-Driven Design is integral to AI-DLC
5. **Sequential Phases**: NOT iterative like Agile (phases are sequential, execution within Construction is iterative)
6. **AI Drives, Human Validates**: AI proposes, humans approve

---

## 3. **Forbidden Actions**

When working on AI-DLC features, you MUST NOT:

- ❌ Invent or modify AI-DLC concepts not in the PDF
- ❌ Add phases beyond Inception/Construction/Operations
- ❌ Change "hours or days" to fixed durations (e.g., "1-2 days")
- ❌ Use terms like "Discovery Bolt" or "Design Bolt" (these don't exist in AI-DLC)
- ❌ Make AI-DLC iterative like Agile (phases are sequential)
- ❌ Use verb-noun command patterns (use noun-verb instead)
- ❌ Duplicate documentation content in this file (point to specs instead)
- ❌ Invoke Bolt commands (`bolt-plan`, `bolt-start`, etc.) outside of Construction Agent context

---

## 4. **Where to Find Specifications**

Instead of duplicating content here, refer to these files:

| Topic | File Location |
|-------|---------------|
| **Term Mappings** | `/memory-bank/term-mappings.md` |
| **Glossary** | `/memory-bank/glossary.md` |
| **PRFAQ** | `/memory-bank/PRFAQ.md` |
| **Standards** | `/memory-bank/standards/` (tech-stack, coding-standards, system-architecture) |
| **Agent Specs** | `/memory-bank/intents/001-multi-agent-orchestration/units/` |
| **Memory Bank Specs** | `/memory-bank/intents/003-memory-bank-system/units/` |
| **Agent Implementation** | `/src/flows/aidlc/agents/` |
| **Skills** | `/src/flows/aidlc/skills/` (inception, construction) |
| **Templates** | `/src/flows/aidlc/templates/` |
| **Memory Bank Config** | `/src/flows/aidlc/memory-bank.yaml` |

---

## 5. **Process for AI-DLC Feature Development**

Follow this process for ANY AI-DLC feature work:

1. **Review existing agent implementations** (`/src/flows/aidlc/agents/`)
   - Understand established patterns and conventions
   - Follow existing agent structure (Persona, Critical Actions, Skills, Workflow)

2. **Check specifications** (`/memory-bank/`)
   - Review glossary and term-mappings for consistent terminology
   - Check relevant unit-briefs for requirements

3. **Review skills and templates** (`/src/flows/aidlc/`)
   - Skills define agent capabilities
   - Templates ensure consistent artifact creation

4. **If uncertain, ask rather than invent**
   - Don't make assumptions about AI-DLC methodology
   - Don't "improve" or modify AI-DLC concepts without discussion

---

## 6. **Project Context**

### Company & Branding
- **Company**: specsmd (all lowercase)
- **Website**: https://specs.md
- **Project**: specsmd (all lowercase)
- **Primary Focus**: AI-DLC implementation for AI-native engineers

### Key Conventions
- Command naming: noun-verb pattern (e.g., `bolt-start`, `intent-create`)
- File structure: See `/memory-bank/` for specifications, `/src/flows/aidlc/` for implementation

---

## 7. **Quick Validation Checklist**

Before implementing any AI-DLC feature, ask:

- ✅ Have I reviewed existing agent implementations in `/src/flows/aidlc/agents/`?
- ✅ Am I following established patterns (Persona, Critical Actions, Skills, Workflow)?
- ✅ Am I using noun-verb command pattern?
- ✅ Am I respecting the 3-phase structure (Inception → Construction → Operations)?
- ✅ Am I pointing to specs rather than duplicating content?
- ✅ Have I checked `/memory-bank/glossary.md` for consistent terminology?

---

*These instructions ensure specsmd delivers a faithful, world-class AI-DLC implementation.*

---

## 8. **Dogfooding: Using AI-DLC to Build specsmd**

specsmd is built using its own AI-DLC flows. This section explains the setup.

### Directory Structure

```
specsmd/
├── .specsmd/aidlc/    → symlink to src/flows/aidlc/  (AI-DLC flow definitions)
├── memory-bank/       → primary artifact storage     (intents, bolts, standards)
└── .claude/commands/  → slash commands for agents
```

### Slash Commands Available

| Command | Description |
|---------|-------------|
| `/specsmd-master-agent` | Start here - orchestrates flow and routes to appropriate agent |
| `/specsmd-inception-agent` | Planning phase - requirements, stories, units, bolt planning |
| `/specsmd-construction-agent` | Building phase - execute bolts through DDD stages |
| `/specsmd-operations-agent` | Deployment phase - build, deploy, verify, monitor |

### How It Works

1. **Flow Source**: The AI-DLC flow is defined in `src/flows/aidlc/` (source)
2. **Flow Link**: `.specsmd/aidlc/` symlinks to the source for agents to read
3. **Artifacts**: `memory-bank/` is the primary storage for project artifacts
4. **Commands**: `.claude/commands/` contains slash commands that activate agents

### Starting Development

```text
/specsmd-master-agent
```

This activates the Master Orchestrator which will:
1. Check if project is initialized (standards exist)
2. Analyze current project state
3. Route you to the appropriate phase/agent

### Key Paths for Agents

| Purpose | Path |
|---------|------|
| Agent Definitions | `.specsmd/aidlc/agents/` |
| Skills | `.specsmd/aidlc/skills/` |
| Templates | `.specsmd/aidlc/templates/` |
| Memory Bank Schema | `.specsmd/aidlc/memory-bank.yaml` |
| Standards | `memory-bank/standards/` |
| Intents | `memory-bank/intents/` |
| Bolts | `memory-bank/bolts/` |

---

## 9. **Git Commit Messages (Semantic Versioning)**

This project uses **semantic-release** for automatic versioning. Commit messages determine version bumps.

### Required Commit Format

```
<type>: <description>
```

### Commit Types and Version Impact

| Type | Version Bump | When to Use |
|------|--------------|-------------|
| `feat:` | Minor (0.1.0) | New feature or capability |
| `fix:` | Patch (0.0.1) | Bug fix |
| `perf:` | Patch (0.0.1) | Performance improvement |
| `docs:` | No release | Documentation only |
| `chore:` | No release | Maintenance, dependencies |
| `refactor:` | No release | Code refactor, no behavior change |
| `style:` | No release | Formatting, whitespace |
| `test:` | No release | Adding or updating tests |

**Note:** Major versions (1.0.0, 2.0.0) are NOT auto-bumped. Update `package.json` manually for major releases.

### Examples

```bash
# Triggers releases
feat: add YAML validation support      # → minor bump (0.1.0)
fix: resolve memory leak in watcher    # → patch bump (0.0.1)
perf: optimize file parsing            # → patch bump (0.0.1)

# No release triggered
docs: update README installation steps
chore: update dependencies
refactor: simplify parser logic
test: add unit tests for validator
```

### Important Rules

- **Always use lowercase** for the type prefix
- **Use present tense** ("add feature" not "added feature")
- **Be concise but descriptive** in the description
- **Major versions** require manual `package.json` update

See `/dev_release_guide.md` for full workflow documentation.

---

## 10. **Testing Requirements**

**MANDATORY**: Always run tests for projects with code changes before considering work complete.

### Test Commands by Project

| Project | Directory | Test Command | Framework |
|---------|-----------|--------------|-----------|
| **NPM Package** | `src/` | `cd src && npm run test` | Vitest |
| **VS Code Extension** | `vs-code-extension/` | `cd vs-code-extension && npm run test` | Mocha |

### When to Run Tests

Run tests when you have made changes to:
- Any `.ts` or `.js` files in the respective project
- Configuration files that affect runtime behavior
- Dependencies or imports

### Testing Workflow

1. **Before committing**: Always run the test suite for any project you modified
2. **After fixing bugs**: Run tests to verify the fix and prevent regressions
3. **After refactoring**: Ensure no tests are broken by the changes
4. **When adding features**: Write tests first or alongside the feature, then run the full suite

### Test Commands Quick Reference

```bash
# Run NPM package tests (src/)
cd src && npm run test

# Run VS Code extension tests
cd vs-code-extension && npm run test

# Run all validation (tests + linting) for NPM package
cd src && npm run validate:all
```

### Handling Test Failures

- **DO NOT** commit code with failing tests
- **DO NOT** skip tests without explicit user approval
- If tests fail, fix the issues before proceeding
- Report test failures to the user with clear error messages

---

*Last updated: 2026-01-09 - Added testing requirements section*

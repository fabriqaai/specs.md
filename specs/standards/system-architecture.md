# System Architecture

High-level architectural patterns and design decisions for specsmd.

---

## Architecture Style

### Multi-Agent Orchestration

specsmd implements a multi-agent architecture where specialized AI agents collaborate through a shared Memory Bank.

```
┌─────────────────────────────────────────────────────────┐
│                    User (AI-Native Engineer)            │
└───────────────────────────┬─────────────────────────────┘
                            │ Slash Commands
                            ▼
┌─────────────────────────────────────────────────────────┐
│              Agentic Coding Tool Layer                  │
│         (Claude Code / Cursor / GitHub Copilot)         │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   Agent Layer                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Master  │  │Inception │  │Construct.│  │   Ops   │ │
│  │  Agent   │  │  Agent   │  │  Agent   │  │  Agent  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │             │             │             │       │
│       └─────────────┴──────┬──────┴─────────────┘       │
│                            │ Skills                     │
└────────────────────────────┼────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│                   Memory Bank (File System)             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌───────────┐  │
│  │ Intents │  │  Units  │  │  Bolts  │  │ Standards │  │
│  └─────────┘  └─────────┘  └─────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Agents
- **Stateless**: Each invocation starts fresh
- **Context-Aware**: Read Memory Bank on activation
- **Skill-Based**: Execute focused skills for specific tasks
- **Human-Validated**: Request approval at decision points

### Skills
- **Single Responsibility**: One skill = one capability
- **Template-Driven**: Use templates for artifact generation
- **Composable**: Skills can reference other skills

### Memory Bank
- **File-Based**: No database, pure filesystem
- **Markdown-First**: All artifacts are markdown
- **Schema-Defined**: Structure defined in `memory-bank.yaml`
- **Git-Friendly**: Version controllable

### Installers
- **Factory Pattern**: `InstallerFactory` creates tool-specific installers
- **Interface-Based**: All installers extend `ToolInstaller` base class
- **Pluggable**: New tools can be added via new installer class

---

## State Management

### No Global State
- Agents are stateless
- All state persisted in Memory Bank
- Fresh context loaded on each invocation

### Artifact-Based State
```
Project State = f(Memory Bank Artifacts)

Current Phase = determined by:
  - Existence of intents → Inception started
  - Existence of units with stories → Inception progressing
  - Existence of bolts → Construction started
  - Bolt completion status → Operations ready
```

---

## Security Patterns

### No Secrets in Memory Bank
- Memory Bank contains only project artifacts
- No credentials, tokens, or sensitive data
- All files safe to commit to git

### Human Oversight
- All significant actions require human approval
- Validation points at phase boundaries
- No autonomous code deployment

---

## API Design

### Slash Command Interface
- Entry point for all agent interactions
- Parameters via `--param="value"` format
- Optional parameters have defaults

### Skill Interface
- Input: Context from Memory Bank + user request
- Process: Defined workflow steps
- Output: Artifacts written to Memory Bank

---

## Deployment Architecture

### Distribution: npm Package
```
npx specsmd install
```

### Installation Targets
```
Project Root/
├── .specsmd/           # specsmd runtime
│   ├── skills/
│   ├── templates/
│   └── memory-bank.yaml
├── .claude/commands/   # Claude Code commands
├── .cursor/commands/   # Cursor commands
├── .github/copilot/commands/  # Copilot commands
└── memory-bank/        # Project artifacts
```

---

## Caching Strategy

### No Caching Required
- File-based storage eliminates caching needs
- Each agent invocation reads fresh state
- Filesystem provides inherent caching

---

## Error Handling Patterns

### Graceful Degradation
- Missing directories created automatically
- Missing templates produce helpful errors
- Partial artifacts saved on interruption

### User-Friendly Errors
- Technical errors translated to actionable messages
- Clear next steps provided
- No stack traces in production output

# specsmd AI-DLC Quick Start Guide

Get started with AI-Driven Development Lifecycle in minutes.

---

## Installation

```bash
npx specsmd@latest install
```

The installer will:

1. Detect available agentic coding tools (Claude Code, Cursor, GitHub Copilot)
2. Install agent definitions and skills
3. Set up the memory bank structure
4. Create slash commands for your tools

---

## Three-Phase Workflow

AI-DLC has three sequential phases, each with a specialized agent:

| Phase | Agent | Purpose |
|-------|-------|---------|
| **Inception** | Inception Agent | Capture intents, gather requirements, decompose into units |
| **Construction** | Construction Agent | Execute bolts (rapid iterations) to build code |
| **Operations** | Operations Agent | Deploy, verify, and monitor |

The **Master Agent** orchestrates everything and helps you navigate.

---

## Quick Start Flow

### Step 1: Initialize Your Project

Open your AI coding tool (Claude Code, Cursor, etc.) and type this command as a prompt:

```text
/specsmd-master-agent
```

Then type `project-init` or `init` when prompted.

This guides you through:

- **Project type selection** (full-stack, backend API, frontend, CLI, library)
- **Tech stack decisions** (language, framework, database, ORM)
- **Coding standards** (formatting, linting, testing strategy)
- **Optional standards** (architecture, UX guide, API conventions)

Standards are saved to `memory-bank/standards/` and provide context for all AI agents.

### Step 2: Create Your First Intent

Switch to the Inception Agent:

```text
/specsmd-inception-agent intent-create
```

An **Intent** is a high-level goal. Examples:

- "User authentication system"
- "Product catalog with search"
- "Payment processing integration"

The agent will:

1. Capture the intent
2. Elaborate requirements
3. Define system context
4. Decompose into units

### Step 3: Plan and Start Bolts

Once units are defined, plan your first bolt:

```text
/specsmd-inception-agent bolt-plan
```

A **Bolt** is a rapid iteration (hours to days). Four types available:

| Bolt Type | Best For |
|-----------|----------|
| **DDD Construction** | Complex business logic, domain modeling |
| **TDD Construction** | Well-defined interfaces, test-first |
| **BDD Construction** | User-facing features, acceptance criteria |
| **Spike** | Research, exploration, unknowns |

### Step 4: Execute Bolts

Switch to the Construction Agent to execute:

```text
/specsmd-construction-agent bolt-start
```

Each bolt goes through stages:

1. **Domain Design** - Model the domain
2. **Logical Design** - Define interfaces and structure
3. **Code** - Implement the solution
4. **Test** - Verify correctness

Human validation happens at each stage.

### Step 5: Deploy

When bolts are complete, use the Operations Agent:

```text
/specsmd-operations-agent deploy
```

---

## Agent Commands Reference

### Master Agent (`/specsmd-master-agent`)

| Skill | Purpose |
|-------|---------|
| `project-init` | Initialize project with standards |
| `analyze-context` | View current project state |
| `route-request` | Get directed to the right agent |
| `explain-flow` | Learn about AI-DLC methodology |
| `answer-question` | Get help with any specsmd question |

### Inception Agent (`/specsmd-inception-agent`)

| Skill | Purpose |
|-------|---------|
| `intent-create` | Create a new intent |
| `intent-list` | List all intents |
| `requirements` | Elaborate intent requirements |
| `context` | Define system context |
| `units` | Decompose into units |
| `story-create` | Create stories for a unit |
| `bolt-plan` | Plan bolts for stories |
| `review` | Review inception artifacts |
| `navigator` | Navigate inception workflow |

### Construction Agent (`/specsmd-construction-agent`)

| Skill | Purpose |
|-------|---------|
| `bolt-start` | Start executing a bolt |
| `bolt-status` | Check bolt progress |
| `bolt-list` | List all bolts |
| `bolt-plan` | Plan additional bolts |
| `navigator` | Navigate construction workflow |

### Operations Agent (`/specsmd-operations-agent`)

| Skill | Purpose |
|-------|---------|
| `build` | Build the project |
| `deploy` | Deploy to environment |
| `verify` | Verify deployment |
| `monitor` | Set up monitoring |

---

## Project Types

Choose your project type during initialization:

| Type | Required Standards | Recommended Standards |
|------|-------------------|----------------------|
| **full-stack-web** | tech-stack, coding-standards | system-architecture, ux-guide, api-conventions |
| **backend-api** | tech-stack, coding-standards | system-architecture, api-conventions |
| **frontend-app** | tech-stack, coding-standards | ux-guide |
| **cli-tool** | tech-stack, coding-standards | - |
| **library** | tech-stack, coding-standards | api-conventions |

---

## File Structure

After installation, your project will have:

```text
.specsmd/
├── manifest.yaml                 # Installation manifest
└── aidlc/                        # AI-DLC flow
    ├── agents/                   # Agent definitions (master, inception, construction, operations)
    ├── commands/                 # Slash commands for agentic tools
    ├── skills/                   # Agent skills by phase
    │   ├── master/               # Master agent skills
    │   ├── inception/            # Inception phase skills
    │   ├── construction/         # Construction phase skills
    │   └── operations/           # Operations phase skills
    ├── templates/                # Artifact templates
    │   ├── inception/            # Intent, unit, story templates
    │   ├── construction/         # Bolt templates and bolt-types
    │   │   └── bolt-types/       # DDD, TDD, BDD, Spike bolt definitions
    │   └── standards/            # Standards facilitation
    │       ├── catalog.yaml      # Standards registry
    │       └── *.guide.md        # Facilitation guides
    ├── shared/                   # Shared agent behaviors
    ├── memory-bank.yaml          # Memory bank schema
    ├── context-config.yaml       # Context loading configuration
    ├── quick-start.md            # This file
    └── README.md                 # Detailed documentation

memory-bank/                      # Created after project-init
├── intents/                      # Your captured intents
│   └── {intent-name}/
│       ├── requirements.md
│       ├── system-context.md
│       ├── units.md
│       └── units/
│           └── {unit-name}/
│               ├── unit-brief.md
│               └── stories/
│                   └── {NNN}-{title}.md
├── bolts/                        # Bolt execution records
│   └── {bolt-id}/
│       ├── bolt.md               # Bolt definition
│       └── {stage-artifacts}.md  # Stage outputs
├── standards/                    # Your project standards
│   ├── tech-stack.md
│   ├── coding-standards.md
│   └── ...
└── operations/                   # Deployment context
```

---

## Key Concepts

### Intent

A high-level statement of purpose. The starting point for AI-driven decomposition.

### Unit

A cohesive, self-contained work element derived from an Intent. Analogous to a Subdomain (DDD) or Epic (Scrum).

### Bolt

The smallest iteration in AI-DLC. Unlike Sprints (weeks), Bolts are hours to days. Four types: DDD, TDD, BDD, Spike.

### Memory Bank

File-based storage for all project artifacts. Maintains context across agent sessions.

### Standards

Project decisions that inform AI code generation (tech stack, coding style, architecture).

---

## Human Validation

AI-DLC emphasizes human oversight as a "loss function" - catching errors early.

**Key validation points:**

- After requirements elaboration
- After unit decomposition
- After story creation
- After each bolt stage
- Before deployment

Each validation step transforms artifacts into rich context for subsequent stages.

---

## Tips for Success

1. **Start with standards** - Project-init ensures AI agents understand your preferences
2. **Keep intents focused** - One major goal per intent
3. **Validate frequently** - Don't skip human checkpoints
4. **Use fresh chats** - Each agent invocation starts fresh; context comes from Memory Bank
5. **Trust the process** - AI-DLC is iterative; refinement happens naturally

---

## Troubleshooting

### Agents don't remember context

Agents are stateless. They read from Memory Bank at startup. Ensure artifacts are saved after each step.

### Standards not being followed

Re-run `project-init` to update standards. Agents load standards fresh each session.

### Reset project state

- Clear `memory-bank/` to reset artifacts
- Delete `.specsmd/` to uninstall specsmd

### Get help

```text
/specsmd-master-agent
# Then type: answer-question "your question here"
```

---

## What's Next?

1. Run `/specsmd-master-agent` and type `project-init` to set up your project
2. Create your first intent with `/specsmd-inception-agent intent-create`
3. Follow the guided workflow through Inception → Construction → Operations

Welcome to AI-native development!

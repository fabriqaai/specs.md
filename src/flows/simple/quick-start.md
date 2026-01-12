# specsmd Simple Flow Quick Start Guide

Get started with spec-driven development in minutes.

---

## Installation

```bash
npx specsmd@latest install
```

Select **Simple** when prompted for the SDLC flow.

The installer will:

1. Detect available agentic coding tools (Claude Code, Cursor, etc.)
2. Install the spec agent and skills
3. Set up slash commands for your tools

---

## Three-Phase Workflow

Simple Flow has three sequential phases:

| Phase | Output | Purpose |
|-------|--------|---------|
| **Requirements** | `requirements.md` | Define what to build with user stories and EARS criteria |
| **Design** | `design.md` | Create technical design with architecture and data models |
| **Tasks** | `tasks.md` | Generate implementation checklist with coding tasks |

One agent (`/specsmd-agent`) guides you through all phases.

---

## Quick Start Flow

### Step 1: Create a New Spec

Open your AI coding tool and invoke the agent with your feature idea:

```text
/specsmd-agent Create a user authentication system with email login
```

The agent will:

1. Derive a feature name (`user-auth`)
2. Generate a requirements document
3. Ask for your approval

### Step 2: Review Requirements

The agent generates:

- **Introduction** - Feature summary
- **Glossary** - Domain terms
- **Requirements** - User stories with EARS acceptance criteria

**Approval phrases:** "yes", "approved", "looks good", "let's continue"

**Feedback:** Any other response triggers revision

### Step 3: Review Design

After requirements approval, the agent generates:

- **Architecture** - System overview with Mermaid diagrams
- **Components** - Interfaces and responsibilities
- **Data Models** - Types with validation rules
- **Error Handling** - Strategies for edge cases
- **Testing Strategy** - Test categories and coverage

### Step 4: Review Tasks

After design approval, the agent generates:

- **Numbered checkbox list** - Incremental coding steps
- **Requirement references** - Traceability to requirements
- **Checkpoint tasks** - Verification points

### Step 5: Execute Tasks

Once all three documents are approved:

```text
/specsmd-agent What's the next task?
```

Or specify a task:

```text
/specsmd-agent Execute task 2.1 from user-auth
```

The agent executes one task at a time, then waits for your review.

---

## Commands Reference

### Single Agent: `/specsmd-agent`

| Action | Example |
|--------|---------|
| Create new spec | `/specsmd-agent Create a todo app with local storage` |
| Continue existing | `/specsmd-agent` (lists specs if multiple exist) |
| Resume specific spec | `/specsmd-agent --spec="todo-app"` |
| Execute tasks | `/specsmd-agent What's the next task?` |
| Execute specific task | `/specsmd-agent Execute task 3.2` |

---

## File Structure

After creating specs, your project will have:

```text
.specsmd/
├── manifest.yaml                 # Installation manifest
└── simple/                       # Simple flow resources
    ├── agents/agent.md           # Agent definition
    ├── skills/                   # Agent skills
    │   ├── requirements.md       # Phase 1
    │   ├── design.md             # Phase 2
    │   ├── tasks.md              # Phase 3
    │   └── execute.md            # Task execution
    ├── templates/                # Document templates
    ├── memory-bank.yaml          # Storage schema
    └── quick-start.md            # This file

specs/                                # Your feature specs
└── {feature-name}/
    ├── requirements.md           # What to build
    ├── design.md                 # How to build it
    └── tasks.md                  # Step-by-step plan
```

---

## EARS Format

Requirements use EARS (Easy Approach to Requirements Syntax):

| Pattern | Format |
|---------|--------|
| **Event-driven** | WHEN [trigger], THE [system] SHALL [response] |
| **State-driven** | WHILE [condition], THE [system] SHALL [response] |
| **Unwanted** | IF [condition], THEN THE [system] SHALL [response] |
| **Optional** | WHERE [option], THE [system] SHALL [response] |

Example:

```text
WHEN user submits login form, THE Auth_System SHALL validate credentials
IF password is invalid, THEN THE Auth_System SHALL display error message
```

---

## Key Principles

### Generate First, Ask Later

The agent generates a draft immediately. Your feedback refines it.

### Explicit Approval Required

You must explicitly approve each phase before proceeding.

### One Phase at a Time

Complete each phase before moving to the next.

### One Task at a Time

During execution, only one task per interaction. Review before continuing.

---

## Tips for Success

1. **Be specific** - "User auth with email/password and session management" beats "Login feature"
2. **Check INCOSE rules** - Singular, Complete, Verifiable, Unambiguous, Consistent
3. **Include edge cases** - Error scenarios in acceptance criteria
4. **Review checkpoints** - Verify tests pass during execution
5. **One task at a time** - Agent pauses after each task. Tell it to keep going (e.g., "continue until done", "go yolo")

---

## Troubleshooting

### Agent doesn't remember context

The agent is stateless. It reads spec files at startup. Ensure documents are saved.

### Multiple specs exist

When you run `/specsmd-agent` without arguments, it lists existing specs and asks which to work on.

### Want to start over

Delete the spec folder: `rm -rf specs/{feature-name}`

### Get help

Ask the agent: `/specsmd-agent How do I add a new requirement?`

---

## When to Use Simple Flow vs AI-DLC

| Simple Flow | AI-DLC Flow |
|-------------|-------------|
| Quick feature specs | Full development lifecycle |
| Solo or small team | Multi-team coordination |
| Prototypes & MVPs | Production systems |
| Minimal overhead | Full traceability |
| 1 agent, 3 phases | 4 agents, full methodology |

---

## What's Next?

1. Run `/specsmd-agent` with your feature idea
2. Review and approve requirements → design → tasks
3. Execute tasks one at a time
4. Ship your feature!

Happy spec-driven development!

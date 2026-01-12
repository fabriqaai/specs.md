# Simple Flow - Spec-Driven Development

A lightweight flow for creating feature specifications using spec-driven development.

## What is Simple Flow?

Simple Flow guides you through three phases to transform a feature idea into an actionable implementation plan:

1. **Requirements** - Define what to build with user stories and EARS acceptance criteria
2. **Design** - Create technical design with architecture, components, and data models
3. **Tasks** - Generate implementation checklist with incremental coding tasks

Each phase produces a markdown document that serves as both documentation and executable specification for AI-assisted development.

## When to Use Simple Flow

### Use Simple Flow when

- You need quick feature specs without full methodology overhead
- Building prototypes or small-to-medium features
- You want structured documentation but not full AI-DLC complexity
- Working solo or in small teams
- Rapid iteration is more important than comprehensive process

### Use AI-DLC Flow when

- Building complex, multi-team features
- You need full DDD stages and bolt management
- Following strict AI-DLC methodology with intents/units/stories
- Production systems requiring full traceability
- Team coordination with formal handoffs

## Quick Start

### 1. Create a New Spec

Invoke the spec agent with your feature idea:

```text
/specsmd-agent Create a user authentication system with email login
```

### 2. Review and Approve Requirements

The agent generates a requirements document with:

- Introduction summarizing the feature
- Glossary of domain terms
- User stories with EARS acceptance criteria

Review and provide feedback, or approve to continue.

### 3. Review and Approve Design

After requirements approval, the agent generates:

- Architecture overview with diagrams
- Component interfaces
- Data models with validation rules
- Error handling strategies
- Testing strategy

Review and provide feedback, or approve to continue.

### 4. Review and Approve Tasks

After design approval, the agent generates:

- Numbered checkbox task list
- Incremental implementation steps
- Requirement references for traceability
- Checkpoint tasks for verification

### 5. Execute Tasks

Once all three documents are approved:

```text
/specsmd-agent --spec="user-auth" --execute
```

Or ask: "What's the next task for user-auth?"

## Output Structure

```text
specs/
└── {feature-name}/
    ├── requirements.md    # Phase 1: What to build
    ├── design.md          # Phase 2: How to build it
    └── tasks.md           # Phase 3: Step-by-step plan
```

## EARS Format

Requirements use EARS (Easy Approach to Requirements Syntax) patterns:

| Pattern | Format | Example |
|---------|--------|---------|
| **Event-driven** | WHEN [trigger], THE [system] SHALL [response] | WHEN user clicks login, THE Auth_System SHALL validate credentials |
| **State-driven** | WHILE [condition], THE [system] SHALL [response] | WHILE session is active, THE Auth_System SHALL refresh tokens |
| **Unwanted** | IF [condition], THEN THE [system] SHALL [response] | IF password is invalid, THEN THE Auth_System SHALL display error |
| **Optional** | WHERE [option], THE [system] SHALL [response] | WHERE MFA is enabled, THE Auth_System SHALL require second factor |

## Key Principles

### Generate First, Ask Later

The agent generates a draft document immediately based on your feature idea. This serves as a starting point for discussion rather than requiring extensive Q&A upfront.

### Explicit Approval Gates

You must explicitly approve each phase before proceeding. Say "yes", "approved", or "looks good" to continue. Any feedback triggers revision.

### One Phase at a Time

The agent focuses on one document per interaction. This ensures thorough review and prevents overwhelming changes.

### One Task at a Time

During execution, only one task is implemented per interaction. This allows careful review of each change.

## File Structure

```text
src/flows/simple/
├── README.md                    # This file
├── memory-bank.yaml             # Storage configuration
├── context-config.yaml          # Context loading rules
├── agents/
│   └── agent.md                 # Agent definition
├── commands/
│   └── agent.md                 # Command definition
├── skills/
│   ├── requirements.md          # Phase 1 skill
│   ├── design.md                # Phase 2 skill
│   ├── tasks.md                 # Phase 3 skill
│   └── execute.md               # Task execution skill
└── templates/
    ├── requirements-template.md
    ├── design-template.md
    └── tasks-template.md
```

## Comparison with AI-DLC

| Aspect | Simple Flow | AI-DLC Flow |
|--------|-------------|-------------|
| **Target** | Quick feature specs | Full development lifecycle |
| **Phases** | 3: Requirements → Design → Tasks | 3: Inception → Construction → Operations |
| **Agents** | 1 (Agent) | 4 (Master, Inception, Construction, Operations) |
| **Output** | 3 markdown files | Full artifact hierarchy |
| **DDD Stages** | Not included | Full DDD stages in Construction |
| **Bolts** | No concept | Time-boxed execution sessions |
| **Hierarchy** | Flat (specs/) | Nested (intents/units/stories) |
| **Overhead** | Minimal | Significant structure |

## Tips for Success

### Requirements Phase

- Be specific about user roles and their needs
- Include edge cases in acceptance criteria
- Define all domain terms in the glossary
- Aim for 3-7 requirements per feature

### Design Phase

- Ensure every requirement is addressed
- Use Mermaid diagrams for architecture
- Be explicit about error handling
- Define validation rules for all data

### Tasks Phase

- Each task should be completable in one session
- Include test tasks (mark optional with *)
- Add checkpoint tasks to verify progress
- Reference specific requirements for traceability

### Execution Phase

- Read all three spec files before starting
- Execute tasks in order (prerequisites first)
- Review changes after each task
- Update task status as you complete

## Attribution

Simple Flow implements spec-driven development for the specsmd framework.

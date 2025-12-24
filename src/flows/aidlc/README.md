# AI-DLC Flow - specsmd

Welcome to the **AI-DLC (AI-Driven Development Life Cycle)** flow for specsmd!

## What is AI-DLC?

AI-DLC is an **AWS methodology** for AI-native software development that optimizes for how AI agents work best. Unlike traditional methodologies, AI-DLC:

- Uses **concentrated rapid planning** (Mob Elaboration) that "condenses weeks into hours"
- Works in **focused bolt sessions** (hours or days, not fixed sprints)
- Follows **DDD (Domain-Driven Design)** principles
- Maintains **persistent context** across sessions through memory bank
- Operates in **three sequential phases**: Inception → Construction → Operations

## Three Phases

### 1. Inception Phase

**Goal**: Complete planning and design before construction begins

**Activities**:

- Gather requirements
- Create user stories
- Design architecture
- Decompose into Units of Work
- Plan Bolt instances

**Command**: `/specsmd-inception-agent --intent="intent-name"`

**Output**:

- Requirements documented
- Stories created
- Architecture designed
- Units decomposed
- Bolts planned

### 2. Construction Phase

**Goal**: Build working software through iterative bolt execution

**Activities**:

- Execute bolts through DDD stages:
  1. **domain-design** - Model business logic
  2. **logical-design** - Apply NFRs and patterns
  3. **code-generation** - Implement code
  4. **testing** - Automated testing

**Command**: `/specsmd-construction-agent --unit="unit-name"`

**Output**:

- Domain models
- Logical designs
- Implementation code
- Comprehensive tests

### 3. Operations Phase

**Goal**: Deploy and operate the system

**Activities**:

- Build deployment artifacts
- Deploy to environments
- Verify deployments
- Setup monitoring

**Command**: `/specsmd-operations-agent --unit="unit-name"`

**Output**:

- Deployed services
- Monitoring dashboards
- Deployment documentation

## Artifact Ownership Matrix

| Phase / Agent | Primary Output Artifacts | Description |
|--------------|-------------------------|-------------|
| **Inception** | **Requirements** | Functional & Non-functional requirements |
| | **Stories** | User stories scoped to a Unit |
| | **System Context** | High-level boundaries & actors |
| | **Unit Decomposition** | Identification of independent units |
| | **Bolt Plans** | Planned work sessions |
| **Construction** | **Domain Design** | Entities, Aggregates, Value Objects |
| | **Logical Design** | APIs, Schemas, Cloud Resources |
| | **Code** | Source code implementation |
| | **Tests** | Unit, Integration, & E2E tests |
| **Operations** | **Build Artifacts** | Docker images, binaries, bundles |
| | **Infrastructure** | Terraform/CloudFormation/CDK |
| | **Documentation** | Runbooks, API docs |

## Decomposition Hierarchy

AI-DLC distinguishes between the **Data Hierarchy** (what we build) and **Execution** (how we build it).

### Data Hierarchy (Structural)

```text
Intent (feature/capability)
  └── Unit (independently deployable component)
      └── Story (individual user story or task)
```

### Execution (Process)

**Bolts** are time-boxed execution sessions scoped to a **Unit**. A Unit may require multiple Bolts to complete all its Stories.

**Example**:

- **Intent**: User Authentication
  - **Unit**: Auth Service
    - **Story 1**: User Registration
    - **Story 2**: Login
    - **Bolt 1**: Implement Registration (executes Story 1)
    - **Bolt 2**: Implement Login (executes Story 2)

## Agent Capabilities & Slash Commands

### Core Agent Commands (Slash Commands)

These are the primary entry points defined in `.cursor/commands` (or your agentic coding tool's equivalent), mapping to `src/flows/aidlc/commands/`:

- `/specsmd-master-agent` - **Start Here**. The Master Orchestrator that routes you to the right place.
- `/specsmd-inception-agent` - Start Inception phase
- `/specsmd-construction-agent` - Start Construction phase
- `/specsmd-operations-agent` - Start Operations phase

### Agent Skills (Internal)

Agents execute these skills internally. You generally don't run these directly as slash commands, but the agents use them to perform work.

- **Inception**: Gather Requirements, Create Stories, Define Context, Decompose Units
- **Construction**: Plan Bolts, Start Bolts, Manage Bolt Status
- **Operations**: Build, Deploy, Verify

## Memory Bank Structure

> **Note**: The structure below is an **example**. The authoritative source of truth for the memory bank schema is `.specsmd/aidlc/memory-bank.yaml`. Agents read that file to determine where to place artifacts.

All artifacts are stored in the `memory-bank/` directory:

```text
memory-bank/
├── intents/                          # Feature intents
│   └── {intent-name}/
│       ├── requirements.md           # Functional & non-functional requirements
│       ├── system-context.md         # High-level boundaries & actors
│       ├── units.md                  # Unit decomposition overview
│       └── units/
│           └── {unit-name}/
│               ├── unit-brief.md     # Unit scope and details
│               └── stories/
│                   ├── 001-{title}.md
│                   └── 002-{title}.md
├── bolts/                            # Bolt execution records
│   └── {bolt-id}/
│       ├── bolt.md                   # Bolt instance metadata
│       ├── ddd-01-domain-model.md    # Stage 1: Domain modeling
│       ├── ddd-02-technical-design.md # Stage 2: Technical design
│       └── ddd-03-test-report.md     # Stage 5: Test report
├── standards/                        # Project standards
│   ├── tech-stack.md
│   ├── coding-standards.md
│   └── system-architecture.md
└── operations/                       # Deployment context
```

## Quick Start Guide

### 1. Create Your First Intent

Open your AI coding tool (Claude Code, Cursor, etc.) and type:

```text
/specsmd-master-agent
```

Then type `intent-create` to create your intent (e.g., "user-authentication").

### 2. Run Inception Phase

```text
/specsmd-inception-agent --intent="user-authentication"
```

Work through the Inception menu:

1. Gather Requirements
2. Create Stories
3. Design Architecture
4. Decompose into Units
5. Plan Bolts
6. Review & Complete

### 3. Execute Construction

```text
/specsmd-construction-agent --unit="auth-service"
```

Start your first bolt and work through the DDD stages:

1. Domain Design
2. Logical Design
3. Code Generation
4. Testing

### 4. Deploy with Operations

```text
/specsmd-operations-agent --unit="auth-service"
```

Deploy your unit:

1. Build Deployment Artifacts
2. Deploy to Environment
3. Verify Deployment
4. Setup Monitoring

## Key Principles

### 1. Mob Elaboration (Rapid Planning)

AI-DLC uses **concentrated rapid planning** during Inception. Instead of distributing planning across multiple sprints, you complete all planning in hours (not weeks) to give AI complete cross-unit context.

### 2. AI Plans, Human Validates

The AI suggests decompositions and designs, but humans review and approve all decisions.

### 3. Bolts are Flexible

Bolts take "hours or days" depending on complexity - they're not fixed-duration like sprints.

### 4. DDD Focus

Domain-Driven Design principles guide the entire Construction phase.

### 5. Persistent Context

Everything is stored in the memory bank so context is never lost between sessions.

## Workflow Example

Here's a complete workflow for building a feature:

1. **Create Intent**

   ```text
   /specsmd-master-agent
   # Then type: intent-create
   # Create "user-authentication" intent
   ```

2. **Inception Phase**

   ```text
   /specsmd-inception-agent --intent="user-authentication"
   # Complete all inception activities
   # Result: 2 units planned with 3 bolts total
   ```

3. **Construction - Unit 1**

   ```text
   /specsmd-construction-agent --unit="auth-service"
   # Execute auth-service-bolt-1 through all stages
   # Execute auth-service-bolt-2 through all stages
   # Result: Auth service fully implemented and tested
   ```

4. **Construction - Unit 2**

   ```text
   /specsmd-construction-agent --unit="email-service"
   # Execute email-service-bolt-1
   # Result: Email service implemented
   ```

5. **Operations**

   ```text
   /specsmd-operations-agent --unit="auth-service"
   # Build, deploy, verify
   # Result: Auth service running in production

   /specsmd-operations-agent --unit="email-service"
   # Build, deploy, verify
   # Result: Email service running in production
   ```

## Tips for Success

### Planning

- Be thorough in Inception - it pays off during Construction
- Document NFRs clearly - they affect logical design
- Group related stories into the same bolt

### Construction

- Follow the DDD stages in order
- Don't skip testing
- Keep bolts focused (5-8 stories max)
- Update memory bank artifacts as you progress

### Operations

- Always deploy to staging first
- Run smoke tests after every deployment
- Setup monitoring from the start
- Document runbooks for on-call engineers

## Agents

Three specialized agents guide you through AI-DLC:

1. **Master Orchestrator** (`agents/master-agent.md`)
   - Central entry point
   - Workflow routing
   - State analysis

2. **Inception Agent** (`agents/inception-agent.md`)
   - Requirements gathering
   - Story creation
   - Architecture design
   - System Context definition
   - Unit decomposition
   - Bolt planning

3. **Construction Agent** (`agents/construction-agent.md`)
   - Bolt execution
   - DDD stage guidance
   - Code generation
   - Testing

4. **Operations Agent** (`agents/operations-agent.md`)
   - Build artifacts
   - Deployment
   - Verification
   - Monitoring

## Learn More

- **Official AI-DLC Documentation**: See `/resource/aidlc-pdf-dump.txt` in the specsmd repository
- **Methodology Notes**: See `specs/flows/aidlc/methodology-notes.md`
- **Agent Details**: Read the agent files in `.specsmd/aidlc/agents/`

## Getting Help

If you get stuck:

1. **Ask the Agent**: Just ask the Master or any agent your question. They can read the memory bank directly.

## Customization

You can customize this flow by editing:

- `.specsmd/aidlc/memory-bank.yaml` - Memory bank structure
- `agents/*-agent.md` - Agent directives and behaviors
- `commands/*.md` - Slash command definitions
- `.specsmd/aidlc/templates/` - Templates used by agents

---

**Happy building with AI-DLC!** 🚀

*This is the official AI-DLC implementation by specsmd, following the AWS AI-DLC methodology.*

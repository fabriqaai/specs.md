# Units: Multi-Agent Orchestration

## Unit Decomposition

This intent is decomposed into four units, each representing a specialized agent.

---

## Unit 1: Master Agent

### Description
Central orchestrator that analyzes project state, routes to specialist agents, and facilitates project initialization.

### Responsibilities
- Analyze project state from Memory Bank
- Determine current AI-DLC phase
- Route users to appropriate specialist agent
- Provide project health dashboard
- Facilitate project initialization (standards setup)

### Skills
| Skill | File | Description |
|-------|------|-------------|
| `analyze-context` | `skills/master/analyze-context.md` | Deduce project state from artifacts |
| `route-request` | `skills/master/route-request.md` | Route to specialist agent |
| `explain-flow` | `skills/master/explain-flow.md` | Explain AI-DLC methodology |
| `answer-question` | `skills/master/answer-question.md` | Answer project/process questions |
| `project-init` | `skills/master/project-init.md` | Initialize project standards |

### Dependencies
- Memory Bank (read schema, read artifacts)
- Standards System (for project-init)

---

## Unit 2: Inception Agent

### Description
Requirements architect that transforms high-level intents into actionable plans.

### Responsibilities
- Create and manage intents
- Gather functional and non-functional requirements
- Define system context and boundaries
- Decompose intents into units
- Create user stories with acceptance criteria
- Plan bolts for execution
- Validate with human at each step

### Skills
| Skill | File | Description |
|-------|------|-------------|
| `intent-create` | `skills/inception/intent-create.md` | Create new intent |
| `intent-list` | `skills/inception/intent-list.md` | List all intents |
| `requirements` | `skills/inception/requirements.md` | Gather FR/NFR |
| `context` | `skills/inception/context.md` | Define system boundaries |
| `units` | `skills/inception/units.md` | Decompose into units |
| `story-create` | `skills/inception/story-create.md` | Create user stories |
| `bolt-plan` | `skills/inception/bolt-plan.md` | Plan bolt instances |
| `review` | `skills/inception/review.md` | Complete inception phase |
| `navigator` | `skills/inception/navigator.md` | Show interactive menu |

### Dependencies
- Memory Bank (read/write intents, units, stories)
- Templates (inception templates)

---

## Unit 3: Construction Agent

### Description
Software engineer that executes bolts through their defined stages.

### Responsibilities
- Execute bolts through defined stages
- Load and follow bolt type definitions
- Execute DDD stages (model, design, code, test)
- Validate stage completion before advancing
- Load project standards
- Generate implementation artifacts

### Skills
| Skill | File | Description |
|-------|------|-------------|
| `bolt-plan` | `skills/construction/bolt-plan.md` | Plan bolts for unit |
| `bolt-start` | `skills/construction/bolt-start.md` | Start/continue bolt |
| `bolt-status` | `skills/construction/bolt-status.md` | Check bolt status |
| `bolt-list` | `skills/construction/bolt-list.md` | List bolts for unit |
| `navigator` | `skills/construction/navigator.md` | Show construction menu |

### Dependencies
- Memory Bank (read/write bolts, units)
- Bolt Types (read stage definitions)
- Standards (load tech-stack, coding-standards)
- Templates (construction templates)

---

## Unit 4: Operations Agent

### Description
DevOps engineer that manages deployment and monitoring.

### Responsibilities
- Verify construction completion
- Build deployment artifacts
- Deploy to environments
- Verify deployment success
- Setup monitoring and observability

### Skills
| Skill | File | Description |
|-------|------|-------------|
| `build` | `skills/operations/build.md` | Build deployment artifacts |
| `deploy` | `skills/operations/deploy.md` | Deploy to environment |
| `verify` | `skills/operations/verify.md` | Verify deployment success |
| `monitor` | `skills/operations/monitor.md` | Setup monitoring |

### Dependencies
- Memory Bank (read/write operations context)
- Standards (deployment configuration)

---

## Unit Dependency Graph

```
┌─────────────────┐
│  Master Agent   │
│  (Orchestrator) │
└────────┬────────┘
         │ routes to
         ▼
┌─────────────────┐
│ Inception Agent │
│   (Planning)    │
└────────┬────────┘
         │ produces artifacts for
         ▼
┌─────────────────┐
│Construction     │
│   Agent         │
│  (Building)     │
└────────┬────────┘
         │ produces artifacts for
         ▼
┌─────────────────┐
│ Operations Agent│
│  (Deploying)    │
└─────────────────┘
```


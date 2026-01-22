# fabriqa FIRE: Fast Intent-Run Engineering

## Press Release

**FOR IMMEDIATE RELEASE**

### fabriqa Launches FIRE: AI-Native Development That Ships in Hours, Not Weeks

*New methodology cuts AI-assisted development checkpoints by 85% while maintaining quality*

**Earth** — fabriqa today announced FIRE (Fast Intent-Run Engineering), a streamlined AI-native development methodology that enables teams to ship features in hours instead of weeks. FIRE reduces the overhead of traditional AI-assisted development from 10-26 checkpoints per feature down to just 0-2, while maintaining the quality and traceability teams need.

"Developers are spending more time managing their AI tools than building software," said the fabriqa team. "FIRE flips this equation. Tell the AI what you want, and it figures out the rest—checking in only when it truly needs human judgment."

FIRE introduces three execution modes that adapt to the risk level of each task:
- **Autopilot** for routine changes: zero checkpoints, maximum velocity
- **Confirm** for standard features: one checkpoint before implementation
- **Validate** for critical systems: two checkpoints with design review

The methodology is built around a simple hierarchy: **Intent → Work Item → Run**. No epics, no sprints, no story points. Just clear objectives decomposed into executable units.

FIRE is available today as a flow in specs.md.

---

## Frequently Asked Questions

### What is FIRE?

FIRE (Fast Intent-Run Engineering) is an AI-native development methodology that simplifies the software development lifecycle. It replaces complex multi-layered planning with a flat, intent-driven approach where AI agents do the heavy lifting and humans validate at key decision points.

### Why did you build FIRE?

Traditional methodologies weren't designed for AI-assisted development. Even modern AI-DLC approaches can require 10-26 checkpoints per feature, creating friction that slows down AI-human collaboration. FIRE was built to:

1. **Reduce cognitive overhead** — Developers shouldn't manage AI tools; AI should manage complexity
2. **Adapt to risk** — Not every change needs the same level of validation
3. **Maintain traceability** — Every decision is documented, every run is auditable
4. **Support real codebases** — Works with existing brownfield projects, not just greenfield

### How does FIRE differ from AI-DLC?

| Aspect | AI-DLC | FIRE |
|--------|--------|------|
| Hierarchy | Intent → Unit → Story | Intent → Work Item |
| Checkpoints | 10-26 per feature | 0-2 per work item |
| Phases | Inception → Construction → Operations | Plan → Execute (continuous) |
| Documentation | Extensive upfront | Generated as needed |
| Execution | Bolt-based (sequential) | Run-based (adaptive) |

FIRE isn't a replacement for AI-DLC—it's a complement. Use AI-DLC for large-scale initiatives with many stakeholders. Use FIRE for rapid feature delivery with small teams.

### What are the three execution modes?

**Autopilot Mode** (0 checkpoints)
- For: Bug fixes, minor updates, well-defined changes
- Process: AI executes directly, generates walkthrough
- Complexity: Low
- Best for: Experienced teams, non-critical paths

**Confirm Mode** (1 checkpoint)
- For: Standard features, moderate complexity
- Process: AI plans → Human confirms → AI executes
- Complexity: Medium
- Best for: Most development work

**Validate Mode** (2 checkpoints)
- For: Security features, payments, core architecture
- Process: AI plans → Human reviews design → Human approves → AI executes
- Complexity: High
- Best for: Critical systems, compliance requirements

### What is an Intent?

An Intent is a high-level objective that delivers user value. It's the "what" and "why" without the "how."

Example Intent:
```
Intent: User Authentication System
Goal: Allow users to securely log in and manage their sessions
Value: Enables personalized experience and protects user data
```

Intents are captured through guided conversation, not lengthy specification documents.

### What is a Work Item?

A Work Item is a discrete, executable unit of work derived from an Intent. Each work item:

- Has a clear definition of done
- Is assigned a complexity (low/medium/high)
- Gets an execution mode (Autopilot/Confirm/Validate)
- Completes in a single Run

Example Work Items for "User Authentication":
1. Create user database schema (low, autopilot)
2. Implement login endpoint (medium, confirm)
3. Add session management (medium, confirm)
4. Implement password reset flow (high, validate)

### What is a Run?

A Run is a single execution cycle for a work item. During a run, an AI agent:

1. Loads context (intent, work item, standards)
2. Executes based on mode (autopilot/confirm/validate)
3. Tracks all files created/modified
4. Generates a walkthrough for human review
5. Updates state upon completion

Runs are atomic—they either complete successfully or roll back.

### How does FIRE handle existing codebases (brownfield)?

FIRE includes workspace detection that analyzes your existing codebase:

**Quick Scan** (2-5 minutes)
- Pattern-based detection
- Identifies language, framework, structure
- Good for getting started fast

**Deep Scan** (10-30 minutes)
- Code parsing and analysis
- Maps integrations and dependencies
- Builds key files inventory
- Required for monorepo projects

FIRE infers your standards from existing code—it adapts to your patterns rather than imposing new ones.

### How does FIRE handle new projects (greenfield)?

For greenfield projects, FIRE offers two initialization paths:

**AI-Suggested** (Recommended)
1. Describe what you're building
2. AI suggests tech stack, standards, structure
3. You approve or modify

**Manual Setup**
1. Answer questions about each standard
2. Explicit choices for tech stack, conventions
3. Full control over every decision

### How does FIRE handle monorepos?

FIRE fully supports monorepo structures for both brownfield and greenfield projects.

**Brownfield Monorepos**

The workspace-detect skill identifies monorepos through:

- `pnpm-workspace.yaml`, `lerna.json`, `nx.json`, `turbo.json`
- `package.json` with `workspaces` field
- `packages/` or `apps/` directories

Deep scan (10-30 min) maps the full structure:

```yaml
workspace:
  structure: monorepo
  parts:
    - name: web-app
      path: apps/web
      tech: [typescript, next.js]
    - name: api
      path: apps/api
      tech: [typescript, express]
    - name: shared
      path: packages/shared
      tech: [typescript]
  integrations:
    - from: web-app
      to: api
      type: http
    - from: web-app
      to: shared
      type: npm-dependency
```

**Greenfield Monorepos**

For new projects, standards-init guides you through setup:

1. Describe your project (multiple apps/services)
2. FIRE suggests monorepo structure
3. Choose tooling (pnpm workspaces, Turborepo, Nx, Lerna)
4. FIRE scaffolds the structure

**Work Item Scoping**

Work items in monorepos specify which parts they affect:

```yaml
work_item:
  id: add-auth-middleware
  affects: [api, shared]
```

The builder agent loads only relevant package context for each run, avoiding bloat.

### What are the FIRE agents?

FIRE uses a three-agent architecture:

**Orchestrator Agent**
- Routes users to appropriate phase
- Manages session state
- Handles transitions between agents

**Planner Agent**
- Captures intents through conversation
- Decomposes intents into work items
- Generates design documents (Validate mode)
- Owns: intent-capture, work-item-decompose, design-doc-generate skills

**Builder Agent**
- Executes runs for work items
- Tracks file changes
- Generates walkthroughs
- Owns: run-execute, walkthrough-generate skills

### How do skills work?

Skills are reusable capabilities that agents invoke. Each skill has:

```
skill-name/
├── SKILL.md           # XML workflow definition
├── templates/         # Handlebars templates
└── scripts/           # TypeScript action scripts
```

**SKILL.md** defines the workflow in XML:
```xml
<skill name="intent-capture">
  <objective>Capture user intent through guided conversation</objective>

  <workflow>
    <step n="1" title="Understand Goal">
      <action>Ask: What do you want to build?</action>
    </step>
    <step n="2" title="Generate Brief">
      <action script="generate-brief.ts">Create intent document</action>
    </step>
  </workflow>
</skill>
```

**Templates** generate consistent documents:
```handlebars
# Intent: {{title}}

## Goal
{{goal}}

## Work Items
{{#each work_items}}
- [ ] {{title}} ({{complexity}})
{{/each}}
```

**Scripts** handle deterministic operations:
```typescript
export function updateState(intentId: string, status: string) {
  // Consistent state management
}
```

### How does state management work?

FIRE maintains a central `state.yaml` that tracks:

```yaml
project:
  name: "my-project"
  framework: fire-v1

workspace:
  type: brownfield
  structure: monolith
  default_mode: confirm

intents:
  - id: user-auth
    status: in_progress
    work_items:
      - id: login-endpoint
        status: completed
        run_id: run-001
      - id: session-management
        status: in_progress

active_run:
  id: run-002
  work_item: session-management
  started: 2026-01-19T10:00:00Z
```

State updates are handled by TypeScript scripts for consistency.

### What walkthroughs are generated?

After each run completes, FIRE generates a walkthrough documenting:

1. **Summary** — What was implemented
2. **Files Changed** — Created and modified files with purposes
3. **Key Decisions** — Choices made with rationale
4. **Verification Steps** — How to test the changes
5. **Test Coverage** — Tests added and coverage percentage

Walkthroughs enable effective human review and provide an audit trail.

### How do I get started with FIRE?

**Step 1: Initialize**
```
/fire
```

The orchestrator will detect your workspace type and guide you through initialization.

**Step 2: Capture Intent**
```
You: I want to add user authentication
FIRE: What authentication method? OAuth, JWT, or session-based?
You: JWT with refresh tokens
FIRE: [Generates intent brief]
```

**Step 3: Review Work Items**
```
FIRE: I've decomposed this into 4 work items:
1. Create user schema (low, autopilot)
2. Implement JWT service (medium, confirm)
3. Add auth middleware (medium, confirm)
4. Implement refresh flow (high, validate)

Proceed? [Y/n/modify]
```

**Step 4: Execute**
```
FIRE: Starting run for "Implement JWT service"...
[AI implements]
FIRE: Walkthrough generated. Review changes? [Y/n]
```

### What's the file structure?

```
project/
├── .specsmd/
│   └── fire/                    # FIRE flow definition
│       ├── agents/
│       │   ├── orchestrator/
│       │   ├── planner/
│       │   └── builder/
│       └── skills/              # Shared skills
│
└── .specs-fire/
    ├── state.yaml               # Central state
    ├── standards/               # Project standards
    │   ├── tech-stack.md
    │   ├── coding-standards.md
    │   └── folder-structure.md
    ├── intents/                 # Intent documentation
    │   └── {intent-id}/
    │       ├── brief.md
    │       └── work-items/
    │           └── {work-item-id}.md
    ├── runs/                    # Run logs
    │   └── {run-id}.md
    └── walkthroughs/            # Generated walkthroughs
        └── {run-id}-{work-item}.md
```

### What are the success metrics?

FIRE measures:

| Metric | Target | How |
|--------|--------|-----|
| Time to Ship | < 4 hours for medium complexity | Timestamp tracking |
| Checkpoint Ratio | < 2 per work item | Run metadata |
| First-Run Success | > 80% | Completion tracking |
| Walkthrough Quality | Human-approved | Review status |

### When should I NOT use FIRE?

FIRE is optimized for rapid iteration with small teams. Consider alternatives when:

- **Large team coordination** — Use AI-DLC for multi-team initiatives
- **Regulatory requirements** — Use Validate mode extensively or add custom checkpoints
- **Learning/exploration** — FIRE assumes you know what you want to build
- **Legacy migration** — Deep refactoring may need more structured approaches

### What's on the roadmap?

**Phase 1** (Current)
- Core agents and skills
- State management
- Three execution modes
- Brownfield support

**Phase 2** (Planned)
- VS Code integration
- Real-time collaboration
- Custom skill creation
- Metrics dashboard

**Phase 3** (Future)
- Multi-model support
- Team workflows
- Enterprise features

---

## Getting Help

- **Documentation**: https://specs.md/fire
- **Discord**: https://discord.specs.md (#fire-support)
- **GitHub**: https://github.com/fabriqaai/specsmd/issues

---

*FIRE: Ship faster. Validate smarter. Build with confidence.*

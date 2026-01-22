# PRD: fabriqa FIRE (Fast Intent-Run Engineering)

**Version:** 4.0
**Date:** 2026-01-18
**Author:** Han Cengiz
**Status:** Draft

> *"FIRE: Where intents ignite into runs"*

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Background & Context](#3-background--context)
4. [Goals & Non-Goals](#4-goals--non-goals)
5. [Proposed Solution](#5-proposed-solution)
6. [Detailed Design](#6-detailed-design)
7. [State Management Architecture](#7-state-management-architecture)
8. [Brownfield & Monorepo Support](#8-brownfield--monorepo-support)
9. [Project Initialization & Standards](#9-project-initialization--standards)
10. [XML Workflow System](#10-xml-workflow-system)
11. [Execution Modes](#11-execution-modes)
12. [Artifacts & Documentation](#12-artifacts--documentation)
13. [Workflow Comparison](#13-workflow-comparison)
14. [Implementation Roadmap](#14-implementation-roadmap)
15. [Migration Strategy](#15-migration-strategy)
16. [Success Metrics](#16-success-metrics)
17. [Trade-offs & Decisions](#17-trade-offs--decisions)
18. [Appendix](#18-appendix)

---

## 1. Executive Summary

This PRD proposes **fabriqa FIRE (Fast Intent-Run Engineering)**, a reimagined AI-native development methodology. FIRE simplifies the AI-Driven Development Lifecycle while adding first-class support for brownfield projects and monorepos—where most real-world development happens.

**Name Origin:** FIRE = **F**ast **I**ntent-**R**un **E**ngineering. The name captures the methodology's essence: rapid iteration from intent to execution.

**Key Changes:**
- **Flatten hierarchy:** Intent → Unit → Story → Bolt becomes **Intent → Work Item → Run**
- **Adaptive checkpoints:** 0-2 checkpoints per work item based on complexity (vs. 3-5 mandatory)
- **Unified artifacts:** Single design document instead of separate domain model, technical design, and ADRs
- **Simpler terminology:** "Run" instead of "Bolt", "Work Item" instead of "Unit + Story"
- **Brownfield-first:** Automatic workspace detection, existing code awareness, never-duplicate rules
- **Monorepo-native:** Multi-part project support with cross-package impact analysis

**Target Outcomes:**
- Reduce checkpoints from 10+ to 2-6 per feature
- Support brownfield projects from day one (not an afterthought)
- Handle monorepos with multiple packages seamlessly
- Maintain quality and traceability with less ceremony

---

## 2. Problem Statement

### 2.1 Current Pain Points

After extensive use of the current specs.md AI-DLC implementation, the following friction points have been identified:

#### 2.1.1 Too Many Checkpoints

**DDD Construction Bolt requires 5 checkpoints:**
1. Domain Model → STOP → approve
2. Technical Design → STOP → approve
3. ADR Analysis → STOP → approve
4. Implement → STOP → approve
5. Test → STOP → approve

**Simple Construction Bolt requires 3 checkpoints:**
1. Plan → STOP → approve
2. Implement → STOP → approve
3. Test → STOP → approve

For a feature with 3-4 work items, this results in 12-20 manual approvals.

#### 2.1.2 Documentation Before Code

The current flow forces creation and approval of abstract documentation (domain model, technical design) before any code exists. This feels like:
- "Design by committee" with AI
- Waterfall-ish sequential dependencies
- Overhead for simple changes

#### 2.1.3 Bolt Scope Too Small

Bolts may be scoped smaller than optimal, leading to:
- More bolt planning overhead
- More context switching
- Repeated ceremony for related work

#### 2.1.4 Hierarchy Depth

```
Intent → Unit → Story → Bolt → Stages
```

Four levels of decomposition before execution creates cognitive overhead and planning fatigue.

### 2.2 User Feedback

> "I feel like I'm running a bolt, and during the bolt run, I also create documentation. If it is DDD bolt, it's technical design and domain model. And if it is simple bolt, it is implementation plan. I verify it and confirm it. It feels like a cumbersome process."

---

## 3. Background & Context

### 3.1 What is AI-DLC?

AI-Driven Development Lifecycle (AI-DLC) is a methodology defined by AWS (Raja SP) for the agentic age of software development. Key principles:

| Principle | Description |
|-----------|-------------|
| **Reimagine, Not Retrofit** | New methodology, not Agile + AI |
| **AI Drives, Humans Validate** | AI leads conversations, humans approve |
| **Bolts, Not Sprints** | Rapid iterations in hours/days, not weeks |
| **DDD Integration** | Design techniques baked into core |
| **Human Oversight as Loss Function** | Catch errors early via checkpoints |

### 3.2 Current specs.md Implementation

specs.md is an open-source implementation of AI-DLC with:

- **3 Phases:** Inception, Construction, Operations
- **4 Agents:** Master, Inception, Construction, Operations
- **Memory Bank:** File-based artifact storage
- **Bolt Types:** DDD (5 stages), Simple (3 stages), Spike
- **10+ Tool Support:** Claude Code, Cursor, GitHub Copilot, etc.

**Strengths:**
- Complete lifecycle (all 3 phases implemented)
- Vendor agnostic (10+ tools)
- Formal ADR tracking
- VS Code extension

**Weaknesses (addressed by this PRD):**
- Too many mandatory checkpoints
- Deep hierarchy (Intent → Unit → Story → Bolt)
- Separate design artifacts that feel redundant

### 3.3 Evolution from Current AI-DLC

| Aspect | Current specs.md | fabriqa FIRE |
|--------|------------------|--------------|
| Phases | 3 | 3 (lightweight) |
| Hierarchy depth | 4 layers | **2 layers** |
| Checkpoints per feature | 10+ | **2-6** |
| Brownfield support | Basic | **Excellent** |
| Monorepo support | Basic | **Excellent** |
| Tool ecosystem | 10+ tools | 10+ tools |
| Workspace detection | None | **Automatic** |

---

## 4. Goals & Non-Goals

### 4.1 Goals

1. **Reduce checkpoint fatigue:** From 10+ to 2-6 checkpoints per feature
2. **Flatten hierarchy:** Remove Units and Stories as separate concepts
3. **Adaptive ceremony:** Simple tasks get less oversight; complex tasks get more
4. **Preserve traceability:** Still track intent → work item → execution
5. **Maintain AI-DLC principles:** AI drives, humans validate
6. **Enable multi-intent runs:** Work sessions can span multiple intents
7. **Simplify state management:** Central state.yaml for quick AI context loading
8. **Brownfield-first:** Automatic workspace detection, existing file awareness, never-duplicate rules
9. **Monorepo-native:** Support multi-package projects with cross-package impact analysis
10. **Adaptive defaults:** Brownfield projects get more conservative execution modes automatically

### 4.2 Non-Goals

1. **Replace full AI-DLC:** This is an alternative flow, not a replacement
2. **Enforce rigid ceremony:** FIRE adapts to complexity, not fixed workflows
3. **Satisfy regulatory requirements:** Not designed for audit-heavy environments
4. **Maintain backward compatibility:** New structure alongside existing

---

## 5. Proposed Solution

### 5.1 New Hierarchy

**Current:**
```
Intent (PRD)
  └── Unit (Epic)
      └── Story
          └── Bolt (Sprint)
              └── Stages (Tasks)
```

**Proposed:**
```
Intent (PRD)
  └── Work Item (Atomic deliverable)
      └── Run (Execution session)
```

### 5.2 Terminology Changes

| Current Term | New Term | Rationale |
|--------------|----------|-----------|
| Unit | *(removed)* | Unnecessary layer |
| Story | *(removed)* | Merged into Work Item |
| Bolt | Run | Simpler, no jargon |
| Stage | *(merged)* | Fewer handoffs |
| Domain Model + Technical Design + ADR | Design Document | Single artifact |

### 5.3 Core Concepts

#### 5.3.1 Intent

**Definition:** High-level statement of purpose (unchanged from current AI-DLC)

**Example:** "Build user authentication system"

**Contains:**
- Brief description
- Requirements (functional + non-functional)
- Success criteria

#### 5.3.2 Work Item

**Definition:** Atomic deliverable derived directly from an Intent

**Replaces:** Unit + Story combined

**Example Work Items for "Build user authentication":**
- User registration
- User login
- Password reset
- OAuth integration

**Properties:**
- `id`: Unique identifier
- `title`: Short description
- `status`: pending | in_progress | done | blocked
- `complexity`: low | medium | high
- `depends_on`: List of other work item IDs

#### 5.3.3 Run

**Definition:** Execution session (hours to days)

**Replaces:** Bolt

**Key Difference:** Can span multiple intents

**Properties:**
- `id`: Sequential number (001, 002, ...)
- `started`: Timestamp
- `ended`: Timestamp (when complete)
- `status`: in_progress | completed | abandoned
- `work_items`: List of items addressed (from any intent)

---

## 6. Detailed Design

### 6.1 File Structure

```
memory-bank/
│
├── state.yaml                    # Central state (AI reads first)
│
├── intents/
│   ├── auth-system/
│   │   ├── brief.md              # Intent description
│   │   └── work-items/
│   │       ├── registration.md   # Work item details
│   │       ├── login.md
│   │       └── password-reset.md
│   │
│   └── payment-flow/
│       ├── brief.md
│       └── work-items/
│           ├── checkout.md
│           └── stripe-integration.md
│
├── runs/
│   ├── 001.yaml                  # Completed run log
│   ├── 002.yaml
│   └── current.yaml              # Active run (if any)
│
├── walkthroughs/                 # Implementation walkthroughs (essential for review)
│   ├── 001-registration.md
│   ├── 002-login.md
│   └── 002-password-reset.md
│
└── standards/                    # Unchanged from current specs.md
    ├── tech-stack.md
    ├── coding-standards.md
    └── system-architecture.md
```

### 6.2 Intent Structure

```markdown
<!-- intents/auth-system/brief.md -->
---
id: auth-system
title: User Authentication System
status: in_progress
priority: high
created: 2025-01-15
---

# User Authentication System

## Overview
Enable users to securely register, login, and manage their accounts.

## Requirements

### Functional
- Users can register with email and password
- Users can login with credentials
- Users can reset forgotten passwords
- Users can logout from all devices

### Non-Functional
- Passwords must be hashed with bcrypt
- Sessions expire after 24 hours
- Rate limiting on auth endpoints

## Success Criteria
- [ ] All auth flows working end-to-end
- [ ] Security audit passed
- [ ] Performance < 200ms for auth operations
```

### 6.3 Work Item Structure

```markdown
<!-- intents/auth-system/work-items/login.md -->
---
id: login
title: User Login
complexity: medium
estimated_hours: 4
tags: [auth, security, api]
---

# User Login

## Description
Allow registered users to authenticate with email and password.

## Acceptance Criteria
- [ ] POST /auth/login endpoint accepts email + password
- [ ] Returns JWT token on success
- [ ] Returns 401 with message on failure
- [ ] Rate limited to 5 attempts per minute
- [ ] Logs authentication attempts

## Technical Notes
- Use existing User model from registration
- JWT secret from environment variable
- Consider refresh token strategy

## Dependencies
- Requires: registration (User model must exist)
```

### 6.4 Run Log Structure

```yaml
# runs/002.yaml

run:
  id: 002
  started: 2025-01-18T10:00:00Z
  ended: 2025-01-18T12:45:00Z
  duration: "2h 45m"
  status: completed

work_items:
  - intent: auth-system
    item: login
    status: completed
    mode: confirm
    files_created:
      - src/routes/auth.ts
      - src/services/authService.ts
    files_modified:
      - src/app.ts
    tests_added: 8

  - intent: auth-system
    item: password-reset
    status: partial
    mode: validate
    notes: "Email service not configured yet"
    resume_point: "implementation"
    design_doc: "intents/auth-system/work-items/password-reset-design.md"

decisions:
  - decision: "JWT expiry time"
    choice: "24 hours"
    rationale: "Balance security and UX"

  - decision: "Refresh token storage"
    choice: "HTTP-only secure cookie"
    rationale: "Prevent XSS access to tokens"

context_notes: |
  Password reset paused because SendGrid not configured.
  User asked to prioritize login completion first.
  OAuth deferred to next run.
```

---

## 7. State Management Architecture

### 7.1 Design Decision

**Chosen Approach:** Central `state.yaml` with frontmatter for static metadata

**Analysis Summary:**

| Criterion | Central state.yaml | Distributed Frontmatter | Winner |
|-----------|-------------------|------------------------|--------|
| AI loading speed | 1 file read | N file reads | Central |
| Human editing UX | Separate files | Co-located | Frontmatter |
| Consistency | Single source | Possible conflicts | Central |
| Git conflicts | High (same file) | Low (different files) | Frontmatter |
| Scalability | O(1) | O(n) | Central |
| Failure resilience | Single point | Distributed | Frontmatter |
| Implementation ease | Simple | Complex | Central |

**Decision Rationale:**
- Primary use case is solo/small team with AI
- Git conflicts less relevant
- AI efficiency is critical for good UX
- Simplicity enables faster v1

### 7.2 Central State Schema

```yaml
# memory-bank/state.yaml

project:
  name: "MyApp"
  created: 2025-01-15
  simplified_mode: true  # Flag indicating lite mode

intents:
  - id: auth-system
    title: "User Authentication"
    status: in_progress      # pending | in_progress | done
    priority: high
    work_items:
      - id: registration
        status: done
        completed_in_run: 001
      - id: login
        status: done
        completed_in_run: 002
      - id: password-reset
        status: in_progress
        started_in_run: 002
        blocked_reason: "Email service not configured"
      - id: oauth-google
        status: pending
        depends_on: [login]

  - id: payment-flow
    title: "Payment Processing"
    status: pending
    priority: medium
    blocked_by: auth-system
    work_items:
      - id: checkout
        status: pending
      - id: stripe-integration
        status: pending
        depends_on: [checkout]

summary:
  total_intents: 2
  intents_done: 0
  intents_in_progress: 1
  intents_pending: 1

  total_work_items: 6
  work_items_done: 2
  work_items_in_progress: 1
  work_items_pending: 3
  work_items_blocked: 1

runs:
  last_completed: 002
  active: null  # or run ID if in progress
```

### 7.3 State Update Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SESSION START                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Read state.yaml │
                    └─────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │ Any active run in progress?   │
              └───────────────────────────────┘
                     │              │
                    YES             NO
                     │              │
                     ▼              ▼
        ┌─────────────────┐  ┌──────────────────────┐
        │ "Resume run 003 │  │ Analyze pending work │
        │  or start new?" │  │ Suggest next items   │
        └─────────────────┘  └──────────────────────┘
                                       │
                                       ▼
                             ┌──────────────────────┐
                             │ User selects items   │
                             │ (can be multi-intent)│
                             └──────────────────────┘
                                       │
                                       ▼
                             ┌──────────────────────┐
                             │ Create run log       │
                             │ Set active run in    │
                             │ state.yaml           │
                             └──────────────────────┘
                                       │
                                       ▼
                             ┌──────────────────────┐
                             │ Execute work items   │
                             │ Update state as each │
                             │ item completes       │
                             └──────────────────────┘
                                       │
                                       ▼
                             ┌──────────────────────┐
                             │ Run complete:        │
                             │ • Finalize run log   │
                             │ • Clear active run   │
                             │ • Update summary     │
                             └──────────────────────┘
```

---

## 8. Brownfield & Monorepo Support

fabriqa FIRE is designed to be **brownfield-first**—most real-world projects involve existing code, not greenfield starts. This section defines how FIRE handles existing codebases and multi-package projects.

### 8.1 Workspace Detection

#### 8.1.1 Automatic Detection

On first run, FIRE automatically scans the project to understand its structure:

```
┌─────────────────────────────────────────────────────────────┐
│ WORKSPACE DETECTION                                          │
├─────────────────────────────────────────────────────────────┤
│ Scanning project structure...                                │
│                                                              │
│ Type: BROWNFIELD                                             │
│ Structure: MONOREPO                                          │
│                                                              │
│ Parts detected:                                              │
│ ├── apps/web        [React, TypeScript, Vite]                │
│ ├── apps/api        [Node.js, Express, PostgreSQL]          │
│ ├── packages/ui     [React, Storybook]                       │
│ └── packages/utils  [TypeScript]                             │
│                                                              │
│ Integrations:                                                │
│ ├── web → api (REST)                                         │
│ ├── web → ui (npm dependency)                                │
│ └── api → utils (npm dependency)                             │
│                                                              │
│ Default execution mode: CONFIRM (brownfield)                 │
└─────────────────────────────────────────────────────────────┘
```

#### 8.1.2 Detection Algorithm

**Quick Scan (Pattern-based, 2-5 minutes):**

```typescript
interface QuickScanResult {
  type: 'greenfield' | 'brownfield';
  structure: 'monolith' | 'monorepo' | 'multi-part';
  parts: ProjectPart[];
  integrations: Integration[];
  keyFiles: KeyFile[];
}

async function quickScan(rootPath: string): Promise<QuickScanResult> {
  // 1. Detect workspace root
  const root = await detectWorkspaceRoot(rootPath);

  // 2. Classify structure
  const structure = await classifyStructure(root);
  // - monorepo: Has workspace config (pnpm-workspace.yaml, lerna.json, etc.)
  // - monolith: Single package.json at root
  // - multi-part: Multiple entry points, no workspace config

  // 3. Discover parts
  const parts = await discoverParts(root, structure);
  // Pattern matching only - no file content reading
  // Looks for: package.json, go.mod, Cargo.toml, requirements.txt

  // 4. Detect tech stack per part
  for (const part of parts) {
    part.tech = await detectTechStack(part.path);
    // Inferred from: dependencies, file extensions, config files
  }

  // 5. Map integrations
  const integrations = await mapIntegrations(parts);
  // Looks for: imports, API routes, shared dependencies

  // 6. Create key files inventory
  const keyFiles = await inventoryKeyFiles(parts);
  // Entry points, config files, main routes

  return { type: 'brownfield', structure, parts, integrations, keyFiles };
}
```

**Deep Scan (Selective parsing, 10-30 minutes):**

Triggered when more context is needed:
- Work item touches core business logic
- Multiple packages affected by change
- Integration points involved
- User explicitly requests deeper analysis

Deep scan additions:
- Parse entry points to understand module graph
- Extract API contracts (routes, GraphQL schemas)
- Identify shared dependencies between parts
- Map data models and relationships

### 8.2 Workspace Schema in state.yaml

```yaml
# memory-bank/state.yaml

project:
  name: "MyApp"
  created: 2025-01-15
  framework: "fabriqa-fire-v1"

workspace:
  type: brownfield              # greenfield | brownfield
  structure: monorepo           # monolith | monorepo | multi-part
  scan_depth: quick             # quick | deep
  scanned_at: 2025-01-18T10:00:00Z
  default_mode: confirm         # autopilot | confirm | validate

  parts:
    - id: client
      path: apps/web
      type: web
      tech: [React, TypeScript, Vite]
      entry: src/main.tsx

    - id: api
      path: apps/api
      type: backend
      tech: [Node.js, Express, PostgreSQL]
      entry: src/index.ts

    - id: ui-lib
      path: packages/ui
      type: library
      tech: [React, Storybook]

  integrations:
    - from: client
      to: api
      type: REST
      contract: apps/api/src/routes/index.ts

    - from: client
      to: ui-lib
      type: npm

  key_files:
    - path: apps/api/src/routes/users.ts
      purpose: User management API endpoints
      last_modified: 2025-01-10

    - path: apps/web/src/contexts/AuthContext.tsx
      purpose: Authentication state management
      last_modified: 2025-01-12

intents: [...]
runs: [...]
```

### 8.3 Execution Mode Adaptation

Brownfield projects inherently carry more risk. FIRE adapts execution modes automatically:

| Workspace Type | Default Mode | Rationale |
|----------------|--------------|-----------|
| Greenfield | Autopilot | Low risk, no existing code to break |
| Brownfield (monolith) | Confirm | Existing code, need visibility |
| Brownfield (multi-part) | Confirm | Cross-package awareness needed |
| Multi-part change | Validate | Multiple packages = higher risk |

**Mode Override Logic:**

```typescript
function getDefaultMode(workItem: WorkItem, workspace: Workspace): ExecutionMode {
  // Start with workspace default
  let mode = workspace.default_mode;

  // Elevate if work item spans multiple parts
  if (workItem.affected_parts.length > 1) {
    mode = 'validate';
  }

  // Elevate if touching core business logic
  if (workItem.touches_core_files) {
    mode = mode === 'autopilot' ? 'confirm' : mode;
  }

  // User can always override
  return mode;
}
```

### 8.4 Existing File Protection

**Critical Rule: NEVER CREATE DUPLICATES**

Before creating any file, FIRE must check the workspace inventory:

```
┌─────────────────────────────────────────────────────────────┐
│ PRE-CREATE CHECK                                             │
├─────────────────────────────────────────────────────────────┤
│ Proposed: src/utils/formatDate.ts                            │
│                                                              │
│ ⚠️  Similar file found: src/helpers/dateUtils.ts             │
│                                                              │
│ Existing function: formatDateString(date: Date): string      │
│                                                              │
│ Options:                                                     │
│ 1. Extend existing file (recommended)                        │
│ 2. Create new file anyway                                    │
│ 3. Show me the existing code                                 │
└─────────────────────────────────────────────────────────────┘
```

**File Modification Rules:**

1. **Search before create** - Always check if similar functionality exists
2. **Extend over duplicate** - Prefer modifying existing modules
3. **Respect patterns** - Follow existing naming conventions, folder structures
4. **Preserve history** - Make small targeted edits over rewrites (git blame friendly)
5. **Document changes** - Run logs must capture files_modified vs files_created

### 8.5 Update Sequence Planning

When a work item spans multiple parts, order matters:

```yaml
# Automatically generated in run log
update_sequence:
  - step: 1
    target: database
    action: "Add email_verified column to users table"

  - step: 2
    target: api
    action: "Update User model and add verification endpoints"
    depends_on: [1]

  - step: 3
    target: client
    action: "Add email verification UI flow"
    depends_on: [2]

  - step: 4
    target: tests
    action: "Add integration tests for verification flow"
    depends_on: [2, 3]
```

**Sequence Rules:**
1. Database/Schema changes first - migrations before code
2. Backend before Frontend - API contracts before consumers
3. Shared libraries before dependents
4. Tests alongside code (not after)

### 8.6 Cross-Package Impact Analysis

Before starting multi-part work items, FIRE generates an impact summary:

```
┌─────────────────────────────────────────────────────────────┐
│ IMPACT ANALYSIS: Add user profile picture                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ PARTS AFFECTED: 3 of 4                                       │
│                                                              │
│ apps/api (6 files)                                           │
│ ├── src/models/User.ts (modify)                              │
│ ├── src/routes/users.ts (modify)                             │
│ ├── src/services/uploadService.ts (create)                   │
│ ├── src/middleware/upload.ts (create)                        │
│ └── migrations/004_profile_picture.sql (create)              │
│                                                              │
│ apps/web (4 files)                                           │
│ ├── src/components/ProfilePicture.tsx (create)               │
│ ├── src/components/UserProfile.tsx (modify)                  │
│ ├── src/api/users.ts (modify)                                │
│ └── src/hooks/useUpload.ts (create)                          │
│                                                              │
│ packages/ui (1 file)                                         │
│ └── src/Avatar/Avatar.tsx (modify - add upload variant)      │
│                                                              │
│ INTEGRATIONS AFFECTED:                                       │
│ • web → api: New upload endpoint                             │
│ • web → ui: Avatar component API change                      │
│                                                              │
│ RISK ASSESSMENT: Medium                                      │
│ • Database migration required                                │
│ • Shared component API change (ui/Avatar)                    │
│                                                              │
│ RECOMMENDED MODE: Validate                                   │
└─────────────────────────────────────────────────────────────┘
```

### 8.7 Key Files Inventory

FIRE maintains an inventory of important files for quick context:

```yaml
key_files:
  # Entry points
  - path: apps/api/src/index.ts
    purpose: API server entry point
    category: entry

  - path: apps/web/src/main.tsx
    purpose: Web app entry point
    category: entry

  # Core business logic
  - path: apps/api/src/services/orderService.ts
    purpose: Order processing business logic
    category: core

  # Configuration
  - path: apps/api/prisma/schema.prisma
    purpose: Database schema definition
    category: config

  # Shared types
  - path: packages/types/src/index.ts
    purpose: Shared TypeScript types
    category: shared
```

This inventory enables:
- Quick context loading at session start
- Smart file search (check key files first)
- Impact analysis without full codebase scan

---

## 9. Project Initialization & Standards

fabriqa FIRE uses a **smart initialization flow** that adapts to whether you're starting fresh (greenfield) or working with existing code (brownfield). Standards define the project's technical foundation and ensure AI agents generate consistent, appropriate code.

### 9.1 Initialization Flow Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PROJECT INITIALIZATION                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Detect Project  │
                    │     Type        │
                    └─────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │   GREENFIELD    │             │   BROWNFIELD    │
    │  (No existing   │             │ (Existing code  │
    │     code)       │             │    detected)    │
    └─────────────────┘             └─────────────────┘
              │                               │
              ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │ Choose approach:│             │ Inform user:    │
    │ • AI suggests   │             │ "We detected an │
    │   standards     │             │  existing       │
    │ • Manual Q&A    │             │  project..."    │
    └─────────────────┘             └─────────────────┘
              │                               │
              ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │ Create          │             │ Run brownfield  │
    │ standards docs  │             │ documentation   │
    │                 │             │ skill           │
    └─────────────────┘             └─────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │ Standards Ready │
                    │ → Start Intents │
                    └─────────────────┘
```

### 9.2 Greenfield Initialization

When no existing code is detected, users choose how to define standards:

#### 9.2.1 Option A: AI-Suggested Standards (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│ GREENFIELD PROJECT DETECTED                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ How would you like to define your project standards?         │
│                                                              │
│ 1 - **AI Suggests** (Recommended)                            │
│     Tell us what you want to build in a few sentences.       │
│     We'll recommend standards based on your goals and        │
│     best practices. You review and approve each suggestion.  │
│                                                              │
│ 2 - **Manual Setup**                                         │
│     Walk through each standard question one by one.          │
│     Full control over every decision. Takes longer but       │
│     gives you complete customization.                        │
│                                                              │
│ → **AI Suggests** - Get started faster with smart defaults   │
│                                                              │
│ Type 1 or 2, or press Enter for recommended option.          │
└─────────────────────────────────────────────────────────────┘
```

**AI-Suggested Flow:**

```
User: "I want to build a SaaS application for project management
      with real-time collaboration, user authentication, and
      a REST API for mobile apps"

AI: Based on your description, here are my recommendations:

═══════════════════════════════════════════════════════════════
SUGGESTED STANDARDS
═══════════════════════════════════════════════════════════════

## Tech Stack
┌─────────────────────────────────────────────────────────────┐
│ Language:      TypeScript                                    │
│ Framework:     Next.js 14 (App Router)                       │
│ Database:      PostgreSQL                                    │
│ Auth:          NextAuth.js                                   │
│ Real-time:     Socket.io                                     │
│ Deployment:    Vercel + Supabase                             │
├─────────────────────────────────────────────────────────────┤
│ Why: TypeScript + Next.js is ideal for SaaS with SEO needs.  │
│ PostgreSQL handles relational data (projects, tasks, users). │
│ Socket.io enables the real-time collaboration you need.      │
└─────────────────────────────────────────────────────────────┘

Accept this tech stack? [Y/n/modify]

User: Y

## Coding Standards
┌─────────────────────────────────────────────────────────────┐
│ Formatter:     Prettier (2-space indent, 100 char lines)     │
│ Linting:       ESLint (strict mode)                          │
│ Testing:       Vitest + React Testing Library                │
│ Organization:  Feature-based (/features/auth, /features/...)│
│ Coverage:      80% minimum                                   │
└─────────────────────────────────────────────────────────────┘

Accept? [Y/n/modify]

[... continues for each standard category ...]
```

#### 9.2.2 Option B: Manual Setup

Walk through each question from the catalog individually:

```
═══════════════════════════════════════════════════════════════
STANDARD 1 of 6: Tech Stack
═══════════════════════════════════════════════════════════════

Question 1 of 5: Primary Language

What programming language will you use?

1 - **TypeScript** - Type-safe JavaScript, great tooling
2 - **JavaScript** - Dynamic, widely supported
3 - **Python** - Excellent for data/ML, readable syntax
4 - **Go** - Fast compilation, great for APIs
5 - **Other** - Specify your choice

→ **TypeScript** - Recommended for web applications

Type a number or describe your preference:
```

### 9.3 Brownfield Initialization

When existing code is detected, FIRE automatically analyzes and documents the project:

```
┌─────────────────────────────────────────────────────────────┐
│ EXISTING PROJECT DETECTED                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ We detected an existing codebase:                            │
│                                                              │
│ Structure:     Monorepo (pnpm workspaces)                    │
│ Packages:      3 (web, api, shared)                          │
│ Languages:     TypeScript (98%), CSS (2%)                    │
│ Framework:     React (web), Express (api)                    │
│ Last commit:   2 days ago                                    │
│                                                              │
│ We will now analyze your project and generate:               │
│                                                              │
│ • Project summary & architecture overview                    │
│ • Tech stack documentation (inferred from code)              │
│ • Coding standards (inferred from existing patterns)         │
│ • Folder structure documentation                             │
│ • Testing strategy (from existing tests)                     │
│ • System context (external integrations)                     │
│                                                              │
│ This runs in the background. You can start working while     │
│ we analyze, and review the documentation when ready.         │
│                                                              │
│ Start analysis? [Y/n]                                        │
└─────────────────────────────────────────────────────────────┘
```

### 9.4 Brownfield Documentation Skill

The brownfield documentation skill creates comprehensive project documentation for AI agents to use when adding new features.

#### 9.4.1 Documents Generated

```yaml
# Generated in memory-bank/standards/

brownfield_documents:
  - file: project-summary.md
    purpose: High-level overview of what the project does
    contents:
      - Project name and description
      - Business domain
      - Key features
      - Target users
      - Project maturity/status

  - file: tech-stack.md
    purpose: Inferred technology choices
    contents:
      - Languages and versions
      - Frameworks and libraries
      - Build tools
      - Package manager
      - Runtime environment

  - file: architecture-overview.md
    purpose: System architecture documentation
    contents:
      - Architecture style (monolith/microservices/etc.)
      - Component diagram
      - Data flow
      - Key design patterns used
      - Module boundaries

  - file: folder-structure.md
    purpose: Project organization guide
    contents:
      - Directory tree with explanations
      - Naming conventions
      - Where to put new files
      - Monorepo package descriptions

  - file: coding-standards.md
    purpose: Inferred coding patterns
    contents:
      - Formatting rules (from config files)
      - Naming conventions (from existing code)
      - Import organization
      - Error handling patterns
      - Common patterns/idioms used

  - file: testing-strategy.md
    purpose: Testing approach documentation
    contents:
      - Test framework(s) used
      - Test file locations
      - Coverage requirements
      - Test naming conventions
      - Mocking patterns

  - file: system-context.md
    purpose: External integrations and dependencies
    contents:
      - External APIs consumed
      - Database connections
      - Third-party services (auth, payments, etc.)
      - Infrastructure dependencies
      - Environment variables
```

#### 9.4.2 System Context Analysis

The system context document captures how this project connects to the outside world:

```markdown
<!-- memory-bank/standards/system-context.md -->
---
generated: 2025-01-18T10:00:00Z
scan_depth: deep
---

# System Context

## Overview
This document describes external systems and integrations.

## External APIs Consumed

### Payment Processing
| Service | Type | Detection Source |
|---------|------|------------------|
| Stripe | Payment Gateway | `stripe` package in dependencies |
| | | Environment: `STRIPE_SECRET_KEY` |
| | | Files: `src/services/payment.ts` |

### Authentication
| Service | Type | Detection Source |
|---------|------|------------------|
| Auth0 | Identity Provider | `@auth0/nextjs-auth0` package |
| | | Environment: `AUTH0_*` variables |

### Email
| Service | Type | Detection Source |
|---------|------|------------------|
| SendGrid | Email Delivery | `@sendgrid/mail` package |
| | | Files: `src/services/email.ts` |

## Database Connections

| Database | Type | Connection |
|----------|------|------------|
| PostgreSQL | Primary | `DATABASE_URL` (Prisma) |
| Redis | Cache | `REDIS_URL` |

## Enterprise Integrations

| System | Type | Detection Source |
|--------|------|------------------|
| Salesforce | CRM | `jsforce` package |
| | | Files: `src/integrations/salesforce/` |
| SAP | ERP | `node-rfc` package |
| | | Environment: `SAP_*` variables |

## Infrastructure Dependencies

| Service | Purpose | Detection |
|---------|---------|-----------|
| AWS S3 | File Storage | `@aws-sdk/client-s3` |
| CloudFlare | CDN | `wrangler.toml` present |
| Vercel | Hosting | `vercel.json` present |

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `STRIPE_SECRET_KEY` | Payment processing | Yes |
| `AUTH0_SECRET` | Authentication | Yes |
| `SENDGRID_API_KEY` | Email delivery | Yes |
| `S3_BUCKET` | File uploads | No |

## Integration Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      YOUR PROJECT                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │   Web   │  │   API   │  │ Workers │  │  Admin  │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
└───────┼────────────┼────────────┼────────────┼──────────────┘
        │            │            │            │
        ▼            ▼            ▼            ▼
   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐
   │  Auth0  │  │PostgreSQL│  │  Redis  │  │   S3    │
   └─────────┘  └─────────┘  └─────────┘  └─────────┘
        │            │
        │            ▼
        │       ┌─────────┐
        │       │ Stripe  │
        │       └─────────┘
        │
        ▼
   ┌─────────┐  ┌─────────┐
   │SendGrid │  │Salesforce│
   └─────────┘  └─────────┘
```
```

### 9.5 Monorepo & Multi-Package Support

All initialization flows detect and handle monorepo structures:

#### 9.5.1 Structure Detection

```yaml
# Monorepo indicators checked:
monorepo_detection:
  workspace_files:
    - pnpm-workspace.yaml
    - lerna.json
    - nx.json
    - turbo.json
    - rush.json

  package_json_workspaces:
    - workspaces field present

  directory_patterns:
    - packages/*
    - apps/*
    - libs/*
    - services/*
```

#### 9.5.2 Monorepo Standards Template

For monorepo projects, standards include package-level documentation:

```markdown
<!-- memory-bank/standards/folder-structure.md (monorepo) -->

# Folder Structure

## Monorepo Layout

```
project-root/
├── apps/                      # Deployable applications
│   ├── web/                   # Next.js frontend
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── api/                   # Express backend
│       ├── src/
│       ├── package.json
│       └── README.md
│
├── packages/                  # Shared libraries
│   ├── ui/                    # React component library
│   │   ├── src/
│   │   └── package.json
│   │
│   ├── utils/                 # Shared utilities
│   │   ├── src/
│   │   └── package.json
│   │
│   └── types/                 # Shared TypeScript types
│       ├── src/
│       └── package.json
│
├── package.json               # Root package.json
├── pnpm-workspace.yaml        # Workspace configuration
└── turbo.json                 # Build orchestration
```

## Package Responsibilities

| Package | Type | Purpose | Dependencies |
|---------|------|---------|--------------|
| `apps/web` | Application | User-facing frontend | ui, utils, types |
| `apps/api` | Application | REST API server | utils, types |
| `packages/ui` | Library | Shared React components | types |
| `packages/utils` | Library | Helper functions | types |
| `packages/types` | Library | TypeScript definitions | - |

## Where to Put New Code

| Type of Code | Location | Example |
|--------------|----------|---------|
| New feature UI | `apps/web/src/features/{name}/` | `features/dashboard/` |
| New API endpoint | `apps/api/src/routes/{name}/` | `routes/users/` |
| Shared component | `packages/ui/src/components/` | `Button.tsx` |
| Shared utility | `packages/utils/src/` | `formatDate.ts` |
| Shared type | `packages/types/src/` | `User.ts` |

## Cross-Package Rules

1. **Dependency direction**: apps → packages (never reverse)
2. **No circular deps**: packages cannot depend on each other circularly
3. **Types first**: Update `packages/types` before implementation
4. **Shared = tested**: Code in `packages/` must have tests
```

#### 9.5.3 Single-Project Standards Template

For non-monorepo projects:

```markdown
<!-- memory-bank/standards/folder-structure.md (single project) -->

# Folder Structure

## Project Layout

```
project-root/
├── src/
│   ├── components/            # React components
│   │   ├── ui/                # Generic UI components
│   │   └── features/          # Feature-specific components
│   │
│   ├── pages/                 # Next.js pages (routes)
│   │
│   ├── lib/                   # Utilities and helpers
│   │   ├── api.ts             # API client
│   │   ├── auth.ts            # Auth utilities
│   │   └── utils.ts           # General utilities
│   │
│   ├── hooks/                 # Custom React hooks
│   │
│   ├── services/              # Business logic
│   │
│   ├── types/                 # TypeScript definitions
│   │
│   └── styles/                # Global styles
│
├── public/                    # Static assets
├── tests/                     # Test files
├── package.json
└── README.md
```

## Where to Put New Code

| Type of Code | Location | Example |
|--------------|----------|---------|
| New page | `src/pages/` | `settings.tsx` |
| New feature | `src/components/features/{name}/` | `Dashboard/` |
| API utility | `src/lib/` | `payments.ts` |
| React hook | `src/hooks/` | `useAuth.ts` |
| Type definition | `src/types/` | `user.ts` |
```

### 9.6 Standards Catalog

Standards are defined in a catalog that drives both suggestion and manual flows:

```yaml
# catalog.yaml structure

standards:
  - id: tech-stack
    name: Tech Stack
    importance: critical
    required: true
    order: 1
    decisions:
      - id: language
        question: "What programming language?"
        options: [TypeScript, JavaScript, Python, Go, Rust]
        default_for:
          saas: TypeScript
          api: TypeScript
          cli: Go
          ml: Python

      - id: framework
        question: "What framework?"
        depends_on: language
        options_by_language:
          TypeScript: [Next.js, Remix, Express, Fastify, NestJS]
          Python: [FastAPI, Django, Flask]
          Go: [Gin, Echo, Fiber]

      - id: database
        question: "What database?"
        options: [PostgreSQL, MySQL, MongoDB, SQLite]
        default: PostgreSQL

  - id: coding-standards
    name: Coding Standards
    importance: critical
    required: true
    order: 2
    depends_on: tech-stack
    decisions:
      - id: formatter
        question: "Code formatter?"
        options: [Prettier, dprint, none]
        default: Prettier

      - id: linter
        question: "Linting strictness?"
        options: [strict, recommended, minimal]
        default: strict

      - id: test-framework
        question: "Testing framework?"
        depends_on: tech-stack.language
        options_by_language:
          TypeScript: [Vitest, Jest, Mocha]
          Python: [pytest, unittest]
          Go: [built-in testing]

  # ... additional standards
```

### 9.7 Standards File Structure

```
memory-bank/
├── state.yaml                 # Project state (includes workspace info)
│
├── standards/                 # All standards documents
│   ├── tech-stack.md          # Technology choices
│   ├── coding-standards.md    # Code style and patterns
│   ├── folder-structure.md    # Project organization
│   ├── testing-strategy.md    # Test approach
│   ├── system-context.md      # External integrations (brownfield)
│   ├── architecture-overview.md  # System design (brownfield)
│   └── project-summary.md     # What the project does (brownfield)
│
├── intents/                   # Feature intents
├── runs/                      # Execution logs
└── walkthroughs/              # Implementation docs
```

### 9.8 Standards in Agent Context

When AI agents work on tasks, they load relevant standards:

```yaml
# Agent context loading order:
context_loading:
  always_load:
    - state.yaml              # Current project state
    - standards/tech-stack.md # Know what tech to use

  load_for_new_code:
    - standards/coding-standards.md
    - standards/folder-structure.md

  load_for_integrations:
    - standards/system-context.md

  load_for_architecture:
    - standards/architecture-overview.md

  load_for_brownfield:
    - standards/project-summary.md  # Understand existing project
```

---

## 10. XML Workflow System

### 10.1 Why XML Over Markdown

fabriqa FIRE uses **pure XML structure** for all workflow definitions, skills, and agent instructions. This is a deliberate architectural choice based on extensive analysis.

**The Fundamental Difference:**

| Aspect | Markdown | XML |
|--------|----------|-----|
| `## Step 1` | "This is a header about step 1" | N/A |
| `<step n="1">` | N/A | "This is step 1, I must execute this" |
| Interpretation | Documentation to reference | Instructions to execute |
| Boundaries | Visual (indentation) | Explicit (opening/closing tags) |
| Semantics | Inferred from content | Encoded in tag names |
| Adherence | Suggestive | Directive |

**Key Insight:** XML creates a **state machine** that AI agents traverse. Each tag transition is a state change. Markdown creates **documentation** that AI interprets freely.

```
XML State Machine:
<step n="1"> → execute → <step n="2"> → execute → <checkpoint> → wait → <step n="3">

Markdown Documentation:
## Step 1 → read → ## Step 2 → read → ... → generate output inspired by documentation
```

### 10.2 Core XML Tag Vocabulary

#### Structural Tags (Organize Workflow)

| Tag | Purpose | Attributes |
|-----|---------|------------|
| `<step>` | Major workflow step | `n`, `title`, `if`, `optional` |
| `<substep>` | Sub-operation | `n`, `title`, `if` |
| `<phase>` | Sequential phase | `n` |
| `<iterate>` | Loop construct | `over`, `as` |

#### Directive Tags (Things AI MUST Do)

| Tag | Purpose | Example |
|-----|---------|---------|
| `<llm>` | Direct instruction to AI | `<llm critical="true">` |
| `<mandate>` | Non-negotiable rule | `<mandate>NEVER skip steps</mandate>` |
| `<critical>` | Cannot be skipped | `<critical>Validate before save</critical>` |
| `<constraint>` | Hard boundary | `<constraint>Max 500 lines</constraint>` |

#### Execution Tags (Actions to Perform)

| Tag | Purpose | Attributes |
|-----|---------|------------|
| `<action>` | Perform operation | `if`, `exact` |
| `<check>` | Conditional block | `if` |
| `<ask>` | Get user input and WAIT | - |
| `<goto>` | Jump to step | `step` |
| `<invoke-workflow>` | Call workflow | `path` |
| `<invoke-protocol>` | Reusable protocol | `name` |

#### Output Tags (Checkpoints and Results)

| Tag | Purpose | Attributes |
|-----|---------|------------|
| `<template-output>` | Save content checkpoint | `section` |
| `<checkpoint>` | Pause for confirmation | `message` |
| `<success_criteria>` | Completion definition | - |

### 10.3 Workflow File Structure

```xml
---
name: fire-intent-capture
description: Capture user's product vision through structured conversation
version: 1.0.0
---

<workflow id="fire-intent-capture" name="FIRE Intent Capture">
  <objective>
    Capture user's product vision, producing a validated Intent Document.
  </objective>

  <llm critical="true">
    <mandate>Listen more than assume</mandate>
    <mandate>Ask clarifying questions before documenting</mandate>
    <mandate>Validate understanding before proceeding</mandate>
  </llm>

  <workflow-rules critical="true">
    <rule n="1">Never rush to document - understand first</rule>
    <rule n="2">Each section requires explicit user confirmation</rule>
    <rule n="3">Offer elicitation at every checkpoint</rule>
  </workflow-rules>

  <flow>
    <step n="1" title="Initialize">
      <action>Detect greenfield vs brownfield</action>
      <check if="brownfield">
        <invoke-protocol name="discover_inputs"/>
      </check>
    </step>

    <step n="2" title="Vision Capture">
      <ask>What do you want to build?</ask>
      <template-output section="vision">
        Document the product vision.
        <ask>[a] Elicitate [c] Continue [e] Edit</ask>
      </template-output>
    </step>

    <step n="3" title="Generate Intent Document">
      <action>Compile all sections</action>
      <checkpoint message="Intent Document generated"/>
    </step>
  </flow>

  <execution-modes>
    <mode name="normal">Full interaction at every checkpoint</mode>
    <mode name="fast">Reduced confirmations</mode>
    <mode name="yolo">Full automation</mode>
  </execution-modes>

  <success_criteria>
    <criterion>Intent Document saved</criterion>
    <criterion>User confirmed document</criterion>
  </success_criteria>
</workflow>
```

### 10.4 Skill Architecture

Skills are modular capabilities with **progressive disclosure**:

```
skill-name/
├── SKILL.md              # Router + principles (< 500 lines)
├── workflows/            # Step-by-step procedures
│   ├── create-new.md
│   └── update-existing.md
├── references/           # Domain knowledge (loaded on demand)
│   ├── api-security.md
│   └── common-patterns.md
└── templates/            # Output structures
```

**SKILL.md Structure:**
```xml
---
name: create-fire-workflow
description: Generate XML workflow files following fabriqa FIRE standards
---

<objective>Create properly structured XML workflow files.</objective>

<quick_start>
1. Run /create-fire-workflow
2. Describe the workflow purpose
3. Answer clarifying questions
4. Receive generated workflow file
</quick_start>

<intake>
  <ask>What should this workflow accomplish?</ask>
  <options>
    <option value="capture">Capture intent/requirements</option>
    <option value="generate">Generate artifacts</option>
    <option value="execute">Execute runs</option>
  </options>
</intake>

<routing>
  <route if="capture" workflow="workflows/capture.md"/>
  <route if="generate" workflow="workflows/generate.md"/>
  <route if="execute" workflow="workflows/execute.md"/>
</routing>

<references_index>
  <reference name="xml-tags" path="references/xml-vocabulary.md"
             load_when="creating workflow"/>
</references_index>

<success_criteria>
  <criterion>Valid XML workflow file generated</criterion>
  <criterion>All required tags present</criterion>
</success_criteria>
```

### 10.5 Meta-Skills for Self-Generation

fabriqa FIRE includes meta-skills that generate other artifacts:

| Meta-Skill | Purpose | Output |
|------------|---------|--------|
| `create-fire-workflow` | Generate XML workflow files | `workflows/*.xml` |
| `create-fire-skill` | Generate skill definitions | `skills/*/SKILL.md` |
| `create-fire-agent` | Generate agent definitions | `agents/*.md` |
| `create-fire-command` | Generate slash commands | `commands/*.md` |
| `heal-fire-skill` | Self-improve from failures | Updated skill files |

**The Heal Skill Pattern:**

When a skill fails:
1. Analyze conversation context for errors
2. Compare "what skill instructed" vs "what actually worked"
3. Propose updates to skill
4. Apply fixes and commit

```xml
<workflow id="heal-fire-skill">
  <step n="1" title="Analyze Failure">
    <action>Review conversation for errors</action>
    <action>Identify skill instruction vs actual solution</action>
  </step>
  <step n="2" title="Generate Fix">
    <action>Create updated skill content</action>
    <ask>[a] Apply [r] Review [d] Discard</ask>
  </step>
  <step n="3" title="Apply">
    <action if="approved">Update skill file</action>
    <action>Test updated skill</action>
  </step>
</workflow>
```

### 10.6 Slash Command Wrappers

For 100% skill invocation (vs relying on auto-detection), use thin command wrappers:

```xml
---
description: Start FIRE Intent Capture
argument-hint: [optional project description]
---

<command>
  <tool>Skill</tool>
  <invoke>fire-intent-capture</invoke>
  <pass_arguments>true</pass_arguments>
</command>
```

Now `/fire-intent` ALWAYS invokes the skill. The commands directory structure:

```
.fire/
├── commands/
│   ├── fire-intent.md       # → skills/fire-intent-capture/
│   ├── fire-prd.md          # → skills/fire-prd-generation/
│   ├── fire-run.md          # → skills/fire-run-execution/
│   └── fire-heal.md         # → skills/heal-fire-skill/
└── skills/
    ├── fire-intent-capture/
    ├── fire-prd-generation/
    ├── fire-run-execution/
    └── heal-fire-skill/
```

### 10.7 Progressive Disclosure

**Three-Level Loading:**

| Level | What | Token Cost | When Loaded |
|-------|------|------------|-------------|
| 1 | Metadata (name, description) | ~15-50 | Session start |
| 2 | Core instructions | ~200-500 | Skill invoked |
| 3 | Deep references | ~500-5000 each | On demand |

**Implementation:**
```xml
<references_index>
  <reference
    name="api-security"
    path="references/api-security.md"
    load_when="skill involves external API calls"
    size="~2000 tokens"/>
</references_index>

<!-- In workflow -->
<step n="3">
  <action if="uses_api">
    <see_reference>api-security</see_reference>
    Apply security patterns from reference
  </action>
</step>
```

### 10.8 Degrees of Freedom Principle

Match instruction specificity to task fragility:

| Freedom | Task Type | XML Pattern |
|---------|-----------|-------------|
| **High** | Creative (review, design) | `<guidance>`, `<principle>` |
| **Medium** | Standard (API, transform) | `<pattern>`, `<template>` |
| **Low** | Fragile (migrations, payments) | `<action exact="true">`, `<mandate>` |

```xml
<!-- High freedom -->
<guidance>Consider edge cases and error handling</guidance>

<!-- Medium freedom -->
<pattern>Use retry logic with exponential backoff</pattern>

<!-- Low freedom -->
<action exact="true">
  Run exactly: ALTER TABLE users ADD COLUMN status VARCHAR(20);
</action>
<constraint>DO NOT modify this command</constraint>
```

### 10.9 Reference Documentation

For detailed XML patterns, tag vocabulary, and complete examples, see:
- **[Anthropic Guides](./anthropic-guides.md)** - Comprehensive XML workflow design tutorial

---

## 11. Execution Modes

### 11.1 Overview

Instead of mandatory checkpoints for every stage, use **adaptive execution modes** based on work item characteristics.

| Mode | Checkpoints | Trigger Conditions |
|------|-------------|-------------------|
| **Autopilot** | 0 | High confidence, low complexity, no breaking changes |
| **Confirm** | 1 | Medium confidence, some design decisions |
| **Validate** | 2 | Low confidence, high complexity, architectural impact |

### 11.2 Mode Selection Algorithm

```typescript
interface WorkItem {
  complexity: 'low' | 'medium' | 'high';
  uncertainty: number;        // 0-1, based on requirement clarity
  hasBreakingChanges: boolean;
  touchesSecurityCode: boolean;
  touchesPaymentCode: boolean;
  estimatedFiles: number;
}

function selectMode(item: WorkItem): 'autopilot' | 'confirm' | 'validate' {
  const score =
    (item.complexity === 'high' ? 0.5 : item.complexity === 'medium' ? 0.3 : 0.1) +
    (item.uncertainty * 0.25) +
    (item.hasBreakingChanges ? 0.15 : 0) +
    (item.touchesSecurityCode ? 0.1 : 0) +
    (item.touchesPaymentCode ? 0.1 : 0) +
    (item.estimatedFiles > 5 ? 0.1 : 0);

  if (score < 0.3) return 'autopilot';
  if (score < 0.6) return 'confirm';
  return 'validate';
}
```

### 11.3 Mode Details

#### 11.3.1 Autopilot Mode (0 Checkpoints)

**When:** Simple, well-understood tasks with clear requirements

**Flow:**
```
User: "Add a logout button to the navbar"

AI: Executing in Autopilot mode (high confidence, low complexity)

[AI designs, implements, tests autonomously]

AI: ✅ Done. Here's what I did:

Changes:
• Created LogoutButton component (src/components/LogoutButton.tsx)
• Added to Navbar (src/components/Navbar.tsx)
• Wired to auth context
• Added 3 unit tests

Files: 2 created, 1 modified
Tests: 3 added, all passing

[No approval needed - just informational]
```

**User Override:** User can always say "wait, let me review first" to elevate to Confirm mode.

#### 11.3.2 Confirm Mode (1 Checkpoint)

**When:** Medium complexity, some design decisions needed

**Flow:**
```
User: "Add email verification to user registration"

AI: This requires some design decisions.
Recommended mode: Confirm

┌─────────────────────────────────────────────────────────────┐
│ PLAN SUMMARY                                                │
├─────────────────────────────────────────────────────────────┤
│ Approach: Token-based email verification                    │
│                                                             │
│ Components:                                                 │
│ • New table: verification_tokens                            │
│ • New endpoint: POST /auth/verify-email                     │
│ • Email template: verification.html                         │
│ • Modified: registration flow to send email                 │
│                                                             │
│ Key Decision: Token expiry = 24 hours                       │
│                                                             │
│ Estimated files: 5 new, 2 modified                          │
└─────────────────────────────────────────────────────────────┘

Proceed with this plan? [Y/n/modify]

User: Y

AI: [Implements according to plan]

✅ Done.
Files created: 5
Tests added: 12
All tests passing.
```

#### 11.3.3 Validate Mode (2 Checkpoints)

**When:** High complexity, architectural decisions, security-critical

**Flow:**
```
User: "Implement OAuth2 with Google and GitHub providers"

AI: This is complex with architectural implications.
Recommended mode: Validate

═══════════════════════════════════════════════════════════════
DESIGN DOCUMENT
═══════════════════════════════════════════════════════════════

## Summary
Multi-provider OAuth2 implementation using Strategy pattern.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Strategy pattern | Easy to add providers |
| Token storage | HTTP-only cookies | XSS protection |
| Session mgmt | Redis-backed | Scalability |
| DB schema | oauth_connections table | Separation of concerns |

## Domain Model

Entities:
• User (existing, extended)
• OAuthConnection (new)
• OAuthProvider (enum)

## Technical Approach

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────┐
│   Client    │───▶│  OAuthController │───▶│ OAuthService│
└─────────────┘    └──────────────────┘    └─────────────┘
                                                  │
                          ┌───────────────────────┼───────────────────────┐
                          ▼                       ▼                       ▼
                   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐
                   │GoogleStrategy│         │GitHubStrategy│         │...Provider │
                   └─────────────┘         └─────────────┘         └─────────────┘
```

## Risks

1. Token refresh during deployment - Mitigate with grace period
2. Account linking conflicts - Require email verification

═══════════════════════════════════════════════════════════════

Approve design? [Y/n/modify]

User: Y

AI: [Implements]

═══════════════════════════════════════════════════════════════
IMPLEMENTATION COMPLETE
═══════════════════════════════════════════════════════════════

Files created: 12
Files modified: 4
Tests added: 28
Coverage: 87%

Key changes:
• New OAuth module (src/oauth/*)
• Extended User model
• New migration for oauth_connections
• Environment variables documented

Review implementation? [Y/n/see diff]

User: Y

AI: ✅ Complete. Committed to feature/oauth-integration
```

### 11.4 Mode Override

Users can always override AI's mode suggestion:

```
AI: Recommended mode: Autopilot

User: "Actually, validate this one - it's security-sensitive"

AI: Switching to Validate mode. Let me prepare the design document...
```

---

## 12. Artifacts & Documentation

### 12.1 Artifact Reduction

**Current specs.md (DDD Bolt):**
1. `ddd-01-domain-model.md`
2. `ddd-02-technical-design.md`
3. `adr-{N}-{slug}.md` (multiple)
4. `ddd-03-test-report.md`
5. `implementation-plan.md`
6. `implementation-walkthrough.md`
7. `test-walkthrough.md`
8. `bolt.md`

**Total: 7-10+ artifacts per bolt**

**fabriqa FIRE:**
1. `design.md` (only for Validate mode)
2. `walkthrough.md` (always generated after implementation)
3. Run log captures execution details

**Total: 1-2 artifacts per work item + 1 run log per session**

### 12.1.1 Walkthrough Documents (Essential)

Walkthrough documents are **essential** for human-in-the-loop validation. After completing each work item, the AI generates a walkthrough that enables effective code review:

```markdown
<!-- walkthroughs/002-login.md -->
---
work_item: login
run: 002
generated: 2025-01-18T12:45:00Z
---

# Implementation Walkthrough: User Login

## Summary
Implemented user authentication with JWT tokens.

## Files Changed

### Created
| File | Purpose |
|------|---------|
| `src/routes/auth.ts` | Authentication endpoints |
| `src/services/authService.ts` | JWT generation/validation |
| `src/middleware/authenticate.ts` | Auth middleware |

### Modified
| File | Changes |
|------|---------|
| `src/app.ts` | Registered auth routes |

## Key Implementation Details

### 1. Authentication Flow
\`\`\`
POST /auth/login
  → Validate credentials
  → Generate JWT (24h expiry)
  → Set HTTP-only cookie
  → Return user data
\`\`\`

### 2. Security Measures
- Passwords hashed with bcrypt (12 rounds)
- JWT stored in HTTP-only secure cookie
- Rate limiting: 5 attempts per minute

### 3. Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Token storage | HTTP-only cookie | XSS protection |
| Expiry time | 24 hours | Balance security/UX |

## How to Verify

1. **Start the server:** `npm run dev`
2. **Test login:**
   \`\`\`bash
   curl -X POST http://localhost:3000/auth/login \\
     -H "Content-Type: application/json" \\
     -d '{"email": "test@example.com", "password": "password123"}'
   \`\`\`
3. **Expected response:** JWT token in cookie, user object in body

## Test Coverage
- Unit tests: 8 added
- Coverage: 92%
- All tests passing

---
*Generated by fabriqa FIRE Run 002*
```

**Why Walkthroughs Are Essential:**

1. **Human Review Enabler** - Provides context for meaningful code review
2. **Decision Transparency** - Documents why choices were made
3. **Verification Guide** - Shows exactly how to test the changes
4. **Knowledge Transfer** - Helps team members understand changes
5. **Audit Trail** - Creates permanent record of implementation details

### 12.2 Unified Design Document Template

Only created for Validate mode work items:

```markdown
<!-- intents/auth-system/work-items/oauth-design.md -->
---
work_item: oauth-google
created: 2025-01-18
run: 003
mode: validate
---

# Design: OAuth2 Multi-Provider Integration

## Summary
Implement OAuth2 authentication supporting Google and GitHub providers using Strategy pattern.

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Provider architecture | Strategy pattern | Extensible for future providers |
| Token storage | HTTP-only secure cookies | Prevents XSS token theft |
| Session backend | Redis | Horizontal scalability |
| Account linking | Email-based | Users can link multiple providers |

## Domain Model

### Entities
- **User** (existing): Extended with `oauth_connections` relation
- **OAuthConnection** (new): Links user to OAuth provider

### Value Objects
- **OAuthProvider**: Enum (GOOGLE, GITHUB)
- **OAuthTokens**: Access token + refresh token pair

### Events
- **UserLinkedOAuthProvider**: When user connects a provider
- **OAuthLoginSucceeded**: Successful OAuth authentication

## Technical Approach

### Component Diagram
```
┌─────────────────┐
│  OAuthController │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   OAuthService  │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│ Google │ │ GitHub │
│Strategy│ │Strategy│
└────────┘ └────────┘
```

### API Endpoints
- `GET /auth/oauth/:provider` - Initiate OAuth flow
- `GET /auth/oauth/:provider/callback` - Handle callback
- `DELETE /auth/oauth/:provider` - Unlink provider

### Database Changes
```sql
CREATE TABLE oauth_connections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  provider VARCHAR(20) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Token refresh during deployment | Users logged out | 5-minute grace period |
| Duplicate accounts | Data fragmentation | Require email verification |
| Provider API changes | Auth failures | Version-specific adapters |

## Implementation Checklist
- [ ] OAuthService with strategy pattern
- [ ] Google provider implementation
- [ ] GitHub provider implementation
- [ ] Database migration
- [ ] Environment variable documentation
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests for OAuth flows

---
*Generated in Run 003 | Mode: Validate*
```

### 12.3 Run Log as Execution Record

The run log captures what happened without being a formal design document:

```yaml
# runs/003.yaml
run:
  id: 003
  started: 2025-01-18T14:00:00Z
  ended: 2025-01-18T18:30:00Z
  status: completed

work_items:
  - intent: auth-system
    item: oauth-google
    status: completed
    mode: validate
    design_doc: intents/auth-system/work-items/oauth-design.md
    files_created:
      - src/oauth/OAuthService.ts
      - src/oauth/strategies/GoogleStrategy.ts
      - src/oauth/strategies/GitHubStrategy.ts
      - src/oauth/OAuthController.ts
      - migrations/003_oauth_connections.sql
    files_modified:
      - src/models/User.ts
      - src/routes/index.ts
    tests_added: 28
    coverage: 87%

decisions:
  - "Strategy pattern for provider extensibility"
  - "HTTP-only cookies for token storage"
  - "Redis for session management"

notes: |
  Completed full OAuth implementation.
  Both Google and GitHub working in dev environment.
  Need to add production OAuth app credentials before deploy.
```

---

## 13. Workflow Comparison

### 13.1 Current specs.md Workflow

```
INCEPTION PHASE
├── 1. Start intent
│   └── AI asks clarifying questions → ✋ CHECKPOINT
├── 2. Generate requirements
│   └── AI creates requirements.md → ✋ CHECKPOINT
├── 3. Define system context
│   └── AI creates system-context.md → ✋ CHECKPOINT
├── 4. Decompose to units
│   └── AI proposes units → ✋ CHECKPOINT
├── 5. Create stories per unit
│   └── AI generates stories → ✋ CHECKPOINT
└── 6. Plan bolts
    └── AI plans bolt sequence → ✋ CHECKPOINT

CONSTRUCTION PHASE (per bolt)
├── 7. Domain Model
│   └── AI creates domain model → ✋ CHECKPOINT
├── 8. Technical Design
│   └── AI creates technical design → ✋ CHECKPOINT
├── 9. ADR Analysis
│   └── AI proposes ADRs → ✋ CHECKPOINT
├── 10. Implement
│    └── AI generates code → ✋ CHECKPOINT
└── 11. Test
     └── AI runs tests → ✋ CHECKPOINT

TOTAL: 11+ checkpoints minimum per feature
With 3 bolts: 6 + (5 × 3) = 21 checkpoints
```

### 13.2 fabriqa FIRE Workflow

```
CAPTURE INTENT
├── 1. Describe goal
│   └── AI asks questions + generates requirements
│   └── → ✋ CHECKPOINT (approve intent)

DECOMPOSE TO WORK ITEMS
├── 2. AI proposes work items
│   └── → ✋ CHECKPOINT (approve work items)

EXECUTE WORK ITEMS
├── 3a. Autopilot items (simple)
│   └── AI executes → No checkpoint (just inform)
├── 3b. Confirm items (medium)
│   └── AI shows plan → ✋ CHECKPOINT → AI executes
└── 3c. Validate items (complex)
    └── AI shows design → ✋ CHECKPOINT → AI executes → ✋ CHECKPOINT

TOTAL: 2 + (0-2 per item) checkpoints
With 4 work items (2 autopilot, 1 confirm, 1 validate):
2 + 0 + 0 + 1 + 2 = 5 checkpoints
```

### 13.3 Side-by-Side Comparison

| Metric | Current specs.md | fabriqa FIRE | Reduction |
|--------|-----------------|-------------------|-----------|
| Minimum checkpoints | 11 | 2 | 82% |
| Typical checkpoints | 15-21 | 4-6 | 70-75% |
| Artifacts per feature | 15-20 | 3-5 | 75% |
| Hierarchy depth | 4 levels | 2 levels | 50% |
| Planning phases | 6 | 2 | 67% |

### 13.4 Example: "Add User Authentication"

**Current specs.md:**
```
1. Create intent → checkpoint
2. Generate requirements → checkpoint
3. System context → checkpoint
4. Decompose to units (registration, login, password-reset, oauth) → checkpoint
5. Create stories for each unit → checkpoint
6. Plan 4 bolts → checkpoint

Bolt 1 (Registration):
  7. Domain model → checkpoint
  8. Technical design → checkpoint
  9. ADR → checkpoint
  10. Implement → checkpoint
  11. Test → checkpoint

Bolt 2 (Login):
  12-16: Same 5 checkpoints

Bolt 3 (Password Reset):
  17-21: Same 5 checkpoints

Bolt 4 (OAuth):
  22-26: Same 5 checkpoints

TOTAL: 26 checkpoints
```

**fabriqa FIRE:**
```
1. Create intent (auth system) → checkpoint
2. Approve work items (registration, login, password-reset, oauth) → checkpoint

Work Item 1 (Registration): Confirm mode
  3. Approve plan → checkpoint

Work Item 2 (Login): Autopilot mode
  (no checkpoint)

Work Item 3 (Password Reset): Confirm mode
  4. Approve plan → checkpoint

Work Item 4 (OAuth): Validate mode
  5. Approve design → checkpoint
  6. Review implementation → checkpoint

TOTAL: 6 checkpoints
```

**Reduction: 26 → 6 checkpoints (77% reduction)**

---

## 14. Implementation Roadmap

### Phase 1: Core Simplification (MVP)

**Duration:** 2-3 weeks

**Deliverables:**
- [ ] New `state.yaml` schema
- [ ] Work item concept (markdown template)
- [ ] Run concept (yaml template)
- [ ] Basic execution with Confirm mode only
- [ ] Single unified agent (no master/inception/construction split)
- [ ] CLI command: `specsmd lite init`

**Success Criteria:**
- Can create intent → work items → execute run
- State persists between sessions
- Run logs capture execution history

### Phase 2: Adaptive Execution

**Duration:** 2 weeks

**Deliverables:**
- [ ] Confidence scoring algorithm
- [ ] Autopilot mode implementation
- [ ] Validate mode implementation
- [ ] Mode override capability
- [ ] Design document generation (Validate mode)

**Success Criteria:**
- AI correctly suggests appropriate mode
- User can override mode
- All three modes working end-to-end

### Phase 3: Enhanced UX

**Duration:** 2 weeks

**Deliverables:**
- [ ] Session resume with full context
- [ ] AI suggestions for next work
- [ ] Dependency-aware suggestions
- [ ] Progress visualization in terminal
- [ ] Run history browsing

**Success Criteria:**
- AI remembers context across sessions
- Suggestions account for dependencies
- User can view past runs

### Phase 4: Advanced Features

**Duration:** 3 weeks

**Deliverables:**
- [ ] Multi-intent runs
- [ ] Blocked item detection and reporting
- [ ] Complexity auto-estimation
- [ ] VS Code extension adaptation
- [ ] Migration tool from full AI-DLC

**Success Criteria:**
- Can work on items from multiple intents in one run
- Blocked items clearly surfaced
- Existing specs.md users can migrate

---

## 15. Migration Strategy

### 15.1 Coexistence Model

fabriqa FIRE will live **alongside** existing AI-DLC in specs.md:

```
specsmd/
├── flows/
│   ├── aidlc/              # Existing full AI-DLC
│   │   ├── agents/
│   │   ├── skills/
│   │   └── templates/
│   │
│   └── fire/               # NEW: fabriqa FIRE
│       ├── agent.md        # Single unified agent
│       ├── templates/
│       └── schemas/
```

### 15.2 Mode Selection

On project initialization, user chooses:

```
$ npx specsmd@latest init

? Which mode would you like to use?

  ❯ Full AI-DLC
    Complete methodology with DDD bolts, formal stages,
    and comprehensive documentation. Best for complex
    systems and larger teams.

  ❯ fabriqa FIRE (NEW)
    Fast Intent-Run Engineering with adaptive checkpoints,
    brownfield support, and fewer artifacts. Best for solo
    developers and small teams prioritizing velocity.
```

### 15.3 Migration Path

For existing projects wanting to switch to FIRE:

```
$ npx specsmd@latest migrate-to-fire

Analyzing current project...

Found:
• 3 intents
• 8 units with 24 stories
• 12 completed bolts

Migration plan:
• Units will be converted to work items
• Stories will be merged into work items
• Bolt history preserved in run format
• Design artifacts consolidated

Proceed? [Y/n]
```

### 15.4 Backward Compatibility

- Existing `memory-bank/` structure preserved
- New `state.yaml` added alongside existing files
- Full AI-DLC projects unaffected
- Can switch modes per-project

---

## 16. Success Metrics

### 16.1 Quantitative Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Checkpoints per feature | 15-21 | 4-6 | Count during usage |
| Artifacts per feature | 15-20 | 3-5 | File count |
| Time to first code | Variable | -50% | Timestamp tracking |
| Session setup time | 2-5 min | <1 min | State loading time |
| User satisfaction | Baseline | +30% | Survey/feedback |

### 16.2 Qualitative Metrics

- **Reduced "cumbersome" feeling:** Primary user pain point addressed
- **Flow state preservation:** Fewer interruptions during execution
- **Context continuity:** AI remembers where user left off
- **Appropriate ceremony:** Simple tasks feel simple; complex tasks get attention

### 16.3 Anti-Metrics (What NOT to Optimize)

- **Not optimizing for:** Zero human oversight (still need validation)
- **Not optimizing for:** Maximum speed at cost of quality
- **Not optimizing for:** Large team coordination (different use case)

---

## 17. Trade-offs & Decisions

### 17.1 What We're Trading Away

| We Lose | Why It's Acceptable |
|---------|---------------------|
| Formal domain model documents | Captured in unified design doc when needed |
| Separate technical design docs | Merged into single design artifact |
| Mandatory ADRs | Only created when genuinely valuable |
| Stage-level tracking | Run log captures sufficient detail |
| Story-level granularity | Work items are atomic enough |
| Unit concept | Direct intent → work item is clearer |

### 17.2 What We're Explicitly Keeping

| We Keep | Why It's Essential |
|---------|-------------------|
| **Walkthrough documents** | Enable meaningful human review; audit trail |
| Human oversight | Catch errors before they compound |
| Context persistence | AI must remember across sessions |
| AI-drives principle | Core value of AI-DLC |
| DDD option | Available via Validate mode |
| Traceability | Intent → Work Item → Run chain |
| Multi-tool support | Vendor agnostic remains important |

### 17.3 Design Decisions Log

| Decision | Options Considered | Choice | Rationale |
|----------|-------------------|--------|-----------|
| State storage | Central YAML vs Frontmatter | Central YAML | AI loading speed, simplicity |
| Hierarchy depth | Keep 4 levels vs Flatten to 2 | Flatten to 2 | Reduce cognitive overhead |
| Checkpoint model | Mandatory vs Adaptive | Adaptive | Match ceremony to complexity |
| Terminology | Keep "Bolt" vs Use "Run" | Use "Run" | Simpler, no jargon |
| Multi-intent runs | Allow vs Restrict | Allow | Matches real work patterns |
| Artifact count | Keep separate vs Unify | Unify | Reduce overhead |

---

## 18. Appendix

### 18.1 Glossary

| Term | Definition |
|------|------------|
| **Intent** | High-level goal or feature to build |
| **Work Item** | Atomic deliverable derived from an intent |
| **Run** | Execution session spanning hours to days |
| **Walkthrough** | Documentation generated after implementation enabling human review |
| **Mode** | Execution style (Autopilot, Confirm, Validate) |
| **Checkpoint** | Point where human approval is required |
| **State** | Central tracking of all project status |
| **Standards** | Project-level technical decisions (tech stack, coding style, etc.) that guide AI generation |
| **Standards Catalog** | YAML definition of all standard categories, questions, and options |
| **Workspace** | Project structure and type (greenfield/brownfield, monolith/monorepo) |
| **Greenfield** | New project with no existing code |
| **Brownfield** | Existing project with code to analyze and preserve |
| **Quick Scan** | Fast pattern-based workspace detection (2-5 minutes) |
| **Deep Scan** | Detailed workspace analysis with code parsing (10-30 minutes) |
| **System Context** | External integrations (APIs, databases, third-party services) the project connects to |
| **Monorepo** | Single repository containing multiple packages/applications |
| **XML Workflow** | Pure XML structure for defining agent workflows with strict adherence |
| **Mandate** | Non-negotiable rule within XML workflow using `<mandate>` tag |
| **Skill** | Modular, file-system based capability with progressive disclosure |
| **Meta-Skill** | Skill that generates other skills, workflows, or agents |
| **Heal Skill** | Meta-skill that improves skills by analyzing failures and applying fixes |
| **Progressive Disclosure** | Three-level loading system: metadata (session start), core instructions (invocation), deep references (on demand) |
| **Degrees of Freedom** | Principle matching instruction specificity to task fragility (high/medium/low) |
| **Slash Command Wrapper** | Thin command that invokes a skill for 100% activation rate |

### 18.2 Full State Schema

```yaml
# memory-bank/state.yaml - Complete Schema

# Project metadata
project:
  name: string                    # Project name
  created: datetime               # Creation timestamp
  mode: "fire"                    # Always "lite" for simplified mode
  version: "1.0"                  # Schema version

# All intents
intents:
  - id: string                    # Unique identifier (kebab-case)
    title: string                 # Human-readable title
    status: enum                  # pending | in_progress | done
    priority: enum                # low | medium | high | critical
    created: datetime             # When created
    completed: datetime?          # When completed (if done)
    blocked_by: string?           # ID of blocking intent

    work_items:
      - id: string                # Unique within intent
        title: string             # Short description
        status: enum              # pending | in_progress | done | blocked
        complexity: enum          # low | medium | high
        depends_on: string[]?     # IDs of dependencies
        started_in_run: number?   # Run ID where started
        completed_in_run: number? # Run ID where completed
        blocked_reason: string?   # If blocked, why

# Summary statistics (auto-calculated)
summary:
  total_intents: number
  intents_done: number
  intents_in_progress: number
  intents_pending: number

  total_work_items: number
  work_items_done: number
  work_items_in_progress: number
  work_items_pending: number
  work_items_blocked: number

# Run tracking
runs:
  last_completed: number?         # ID of last completed run
  active: number?                 # ID of active run (null if none)
```

### 18.3 Run Log Schema

```yaml
# runs/{NNN}.yaml - Complete Schema

run:
  id: number                      # Sequential run number
  started: datetime               # Start timestamp
  ended: datetime?                # End timestamp (null if active)
  duration: string?               # Human-readable duration
  status: enum                    # in_progress | completed | abandoned

work_items:
  - intent: string                # Intent ID
    item: string                  # Work item ID
    status: enum                  # completed | partial | skipped
    mode: enum                    # autopilot | confirm | validate

    # If partial
    resume_point: string?         # Where to resume
    notes: string?                # Why incomplete

    # If validate mode
    design_doc: string?           # Path to design document

    # Change tracking
    files_created: string[]?      # New files
    files_modified: string[]?     # Modified files
    files_deleted: string[]?      # Deleted files
    tests_added: number?          # New test count
    coverage: number?             # Test coverage %

# Decisions made during run
decisions:
  - decision: string              # What was decided
    choice: string                # The choice made
    rationale: string             # Why

# Free-form notes for context
context_notes: string?            # Markdown notes for future reference
```

### 18.4 Example AI Interaction

```
═══════════════════════════════════════════════════════════════
                    fabriqa FIRE
═══════════════════════════════════════════════════════════════

Reading project state...

PROJECT: MyApp
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INTENTS:

1. auth-system (IN PROGRESS) ████████░░ 75%
   ✅ registration (done in run 001)
   ✅ login (done in run 002)
   ⏳ password-reset (partial - blocked: email service)
   ○  oauth-google (pending, depends on: login ✓)

2. payment-flow (PENDING) ░░░░░░░░░░ 0%
   ○  checkout (pending)
   ○  stripe-integration (pending, depends on: checkout)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUGGESTED NEXT WORK:

Based on dependencies and priorities:

1. 🔧 password-reset (auth-system)
   Status: Partial - needs email service configuration
   Mode: Confirm (medium complexity)

2. 🔐 oauth-google (auth-system)
   Status: Ready (login dependency satisfied)
   Mode: Validate (high complexity)

3. 🛒 checkout (payment-flow)
   Status: Blocked by auth-system completion
   Note: Can start after auth-system done

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

What would you like to work on?

> Let's finish password-reset and start oauth-google

Starting Run 003 with:
• password-reset (auth-system) - Confirm mode
• oauth-google (auth-system) - Validate mode

═══════════════════════════════════════════════════════════════

WORK ITEM: password-reset
Mode: Confirm

You were mid-way through this. Picking up where we left off...

Last session notes:
"Email service not configured yet"

I see SendGrid is still not configured. Before we continue,
would you like to:

1. Configure SendGrid now (I can help)
2. Use a mock email service for development
3. Skip email and implement the token logic only

> 2

Got it. I'll implement with a mock email service that logs to console.

PLAN:
┌─────────────────────────────────────────────────────────────┐
│ • Create MockEmailService (logs to console)                 │
│ • Implement password reset token generation                 │
│ • Create reset endpoint: POST /auth/reset-password          │
│ • Create confirm endpoint: POST /auth/confirm-reset         │
│ • Add rate limiting (3 requests per hour per email)         │
│ • Unit tests for all flows                                  │
└─────────────────────────────────────────────────────────────┘

Proceed? [Y/n/modify]

> Y

Implementing...

✅ password-reset COMPLETE

Files created: 4
Tests added: 8
All tests passing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WORK ITEM: oauth-google
Mode: Validate

Preparing design document...

[Design document displayed as shown in section 9.2]

Approve design? [Y/n/modify]

> Y

Implementing OAuth integration...

[Progress updates]

✅ oauth-google COMPLETE

Files created: 12
Files modified: 4
Tests added: 28
Coverage: 87%

═══════════════════════════════════════════════════════════════

RUN 003 COMPLETE
Duration: 2h 15m

Summary:
• password-reset: ✅ Completed
• oauth-google: ✅ Completed

auth-system is now 100% complete! 🎉

Next suggested work:
• checkout (payment-flow) - now unblocked

Save run and exit? [Y/n]

> Y

Run saved. See you next time!
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-18 | Han Cengiz | Initial draft |
| 2.0 | 2025-01-18 | Han Cengiz | Renamed to fabriqa FIRE; added comprehensive brownfield/monorepo support; added walkthrough documents as essential artifact; removed competitor references |
| 3.0 | 2025-01-18 | Han Cengiz | Added Section 9: Project Initialization & Standards with smart greenfield/brownfield flows, AI-suggested standards, brownfield documentation skill, system context analysis, monorepo templates |
| 4.0 | 2026-01-18 | Han Cengiz | Added Section 10: XML Workflow System - pure XML structure for strict flow adherence; semantic tag vocabulary; skill architecture with progressive disclosure; meta-skills for self-generation (create-fire-workflow, create-fire-skill, create-fire-agent, create-fire-command, heal-fire-skill); slash command wrappers; degrees of freedom principle; created companion anthropic-guides.md document |

---

*End of PRD*

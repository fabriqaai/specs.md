# Skill: Explain Flow

---

## Role

Educational skill to explain AI-DLC methodology and help users understand their position in the workflow.

**NO Checkpoint** - Explanation is educational, not a decision point.

---

## Goal

Explain the AI-DLC methodology and help the user understand where they are in the process.

---

## Input

- **Required**: User's question about the flow
- **Optional**: Current project state (from `analyze-context.md`)

---

## Process

### 1. Provide Overview

```markdown
## AI-DLC: AI-Driven Development Lifecycle

AI-DLC is a reimagined development methodology where AI drives the workflow and humans validate at key decision points.

### The Three Phases

1. **Inception** → Planning & Design
   - Capture intents (high-level goals)
   - Elaborate into requirements, units, and stories
   - Plan bolts for construction
   - Output: Complete implementation plan

2. **Construction** → Building & Testing
   - Execute bolts through their stages (stages vary by bolt type)
   - AI generates designs, code, and tests
   - Human validates at each stage
   - Output: Tested, working code

   **DDD Bolt** (for domain-heavy business logic):
   - Stage 1: Domain Model → AI models entities, aggregates, events
   - Stage 2: Technical Design → AI architects layers, APIs, data
   - Stage 3: ADR Analysis → Capture architectural decisions (optional)
   - Stage 4: Implement → AI generates code from designs
   - Stage 5: Test → AI writes and runs tests

   **Simple Bolt** (for straightforward tasks):
   - Stage 1: Plan → Define what to build
   - Stage 2: Implement → AI generates code
   - Stage 3: Test → AI writes and runs tests

3. **Operations** → Deploy & Monitor
   - Package deployment units
   - Deploy through environments (Dev → Staging → Prod)
   - Setup monitoring and observability
   - Output: Running production system

### Key Concepts

- **Intent**: High-level goal or feature request
- **Unit**: Independently deployable component (like a bounded context)
- **Story**: User story with acceptance criteria
- **Bolt**: Time-boxed execution session (hours/days, not weeks)
- **Bolt Type**: Methodology template (DDD or Simple)

### Core Principles

- **AI Drives, Human Validates**: AI proposes, humans approve
- **Human Oversight as Loss Function**: Catch errors early before they compound
- **Semantically Rich Context**: Each step builds context for the next
- **Rapid Iteration**: Bolts are hours/days, not weeks
```

### 2. Show Current Position (if known)

```markdown
### Where You Are Now

    Inception ──────► Construction ──────► Operations
        │                  │                   │
        ▼                  ▼                   ▼
    [CURRENT] ───────► [Planned] ────────► [Future]

You are in the **{phase}** phase, working on **{intent/unit/bolt}**.

Next step: {specific action}

```

### 3. Answer Specific Questions

- **"What is a bolt?"** → Explain bolt concept with analogy to sprints
- **"How long does inception take?"** → Hours, not weeks - it's intensive but fast
- **"When do I move to construction?"** → When all stories are defined and bolts planned
- **"What's the difference from Agile?"** → AI-DLC is AI-native, rapid iterations, integrated design

---

## Output

Provide a tailored explanation based on the user's question:

```markdown
## {Topic} Explained

{Clear, concise explanation}

### Your Current Context
{Where user is in the flow, if known}

### What This Means For You
{Practical implications}

### Actions

1 - **proceed**: Execute recommended action
2 - **more**: Learn more about this topic
3 - **different**: Ask about something else

### Suggested Next Step
→ **proceed** - {Recommended action}

**Type a number or press Enter for suggested action.**
```

---

## Human Validation Point

> "Does this explanation help? Would you like me to elaborate on any part, or are you ready to proceed with {next action}?"

---

## Transition

After explanation:

- → **Route Request** (`.specsmd/skills/master/route-request.md`) - if user wants to proceed
- → **Answer Question** (`.specsmd/skills/master/answer-question.md`) - if user has more questions

---

## Test Contract

```yaml
input: User question about AI-DLC flow
output: Tailored explanation with current position highlighted
checkpoints: 0 (educational only)
```

# Ideation Flow — Design Plan

## Overview

A standalone creative intelligence flow for specsmd that transforms AI-assisted brainstorming. Installed independently as `.specs-ideation/`.

**Identity**: "Ideation" — a general-purpose creative thinking flow
**Metaphor**: Spark → Flame → Forge (generate → evaluate → shape)
**Philosophy**: AI as creative partner, not facilitator. Ideas first, process invisible.

---

## Core Principles

1. **Zero-to-Ideas** — User gives a topic, gets ideas in 30 seconds. No setup friction.
2. **Invisible Techniques** — AI uses brainstorming techniques internally. User never sees "SCAMPER" or "Six Hats" by name. They just get great creative output.
3. **Technique-Driven Interaction** — No upfront mode choice. The technique determines whether the AI generates, asks, or co-builds:
   - **Generate** (80% in Spark, 60% in Flame, 40% in Forge): AI produces creative output, user reacts
   - **Elicit** (5%/15%/20%): AI asks only when user has knowledge AI doesn't (feelings, constraints, stakeholders)
   - **Co-build** (15%/25%/40%): AI starts, user extends, AI builds on extension
   - The mode **emerges** from interaction — user can shift anytime ("you decide" → more generation, "ask me" → more elicitation)
   - Hard rule: Never more than 2 questions in a row before generating something
4. **Anti-Bias Engine** — Enforced protocol (not just advice) that ensures genuinely diverse ideas through domain cycling, perspective shifts, and provocation injection.
5. **Deep Thinking** — AI uses structured multi-step reasoning (sequential thinking MCP when available, built-in protocol when not) for every batch of ideas.
6. **Energy-Adaptive** — AI reads user's engagement and adjusts pace, depth, and direction accordingly.
7. **Beautiful Output** — Polished documents, not raw session logs. Immediately shareable.

---

## The Three Skills

### Spark (Generate)

**What it does**: Rapid-fire idea generation with cross-domain connections
**AI's role**: Creative partner proposing ideas the user wouldn't think of
**Interaction**: Generate:80% — AI generates batches of 5 ideas → user reacts (pick favorites, say "more", "wilder", "more like #3") → AI adapts → repeat. Rare elicitation only for constraints/context the AI can't infer.
**Anti-bias**: Domain wheel ensures each batch spans 3+ different domains
**Deep thinking**: 6-7 step reasoning chain per batch (domain check → raw concepts → novelty filter → cross-pollinate → provoke → polish)
**Output**: Spark Bank document — organized by theme, favorites highlighted, domain coverage tracked

### Flame (Evaluate)

**What it does**: Multi-perspective analysis of selected sparks
**AI's role**: Analyst wearing different thinking hats
**Interaction**: Generate:60% — AI provides rapid Six Hats analysis per idea (facts, risks, benefits, creative extensions). Elicit:15% — pauses at Red Hat for user's gut feeling. Co-build:25% — user adds their own perspective, AI integrates.
**Techniques**: Six Hats rapid analysis, impact/feasibility matrix, force field analysis
**Output**: Flame Report — scored ideas with multi-hat analysis, recommended direction

### Forge (Shape)

**What it does**: Develops top flames into actionable concepts
**AI's role**: Concept developer and pitch writer
**Interaction**: Generate:40% — AI dreams and develops. Elicit:20% — asks about key constraints and priorities. Co-build:40% — AI applies Disney Strategy (Dream → Reality → Critique), user refines and defends choices during Critic phase.
**Techniques**: Disney Strategy, concept canvas, pitch structuring
**Output**: Concept Brief — one-liner, problem, concept, why it works, risks/mitigations, next steps

---

## Built-in Deep Thinking Protocol

The AI performs structured multi-step reasoning for idea generation. This works regardless of whether the sequential thinking MCP tool is available.

**When MCP is available**: Uses the sequential-thinking tool with 5-10 thoughts per spark batch, providing traceable reasoning.

**When MCP is unavailable**: Executes the same reasoning chain as an internal skill protocol:

```
[Think 1/N — Domain Check]: Which domains are underexplored?
[Think 2/N — Raw Concepts]: Generate raw ideas per domain
[Think 3/N — Novelty Filter]: Are these genuinely new or just repackaged?
[Think 4/N — Cross-pollinate]: Can any combine with user's favorites?
[Think 5/N — Provocation]: Invert one assumption, add one absurd idea
[Think 6/N — Polish]: Make each idea vivid, specific, memorable
[Think 7/N — Meta-check]: Is this batch genuinely diverse? (optional)
```

**Visibility modes**:
- `visible`: Show thinking steps to user (transparency/learning mode)
- `collapsed`: Show "Thinking..." then results (default)
- `hidden`: Show only results (fast mode)

The thinking protocol is a **skill feature**, not an MCP dependency. The MCP tool is an optimization, but the cognitive pattern is enforced by the workflow XML regardless.

---

## Anti-Bias Engine

A structured protocol (not text advice) that forces genuine idea diversity.

**Domain Wheel** (12 sectors):
1. Technology/Engineering
2. Human Psychology/Behavior
3. Business/Economics
4. Nature/Biology
5. Art/Design/Aesthetics
6. Games/Play
7. Social/Community
8. Physical Space/Architecture
9. Time/Temporal
10. Extreme/Edge Cases
11. Inversion/Opposite
12. Random Cross-Pollination

**Rules**:
- Each spark batch of 5 ideas MUST include 3+ different domains
- Never 2 consecutive ideas from the same domain
- After every 15 ideas, inject a provocation (deliberately absurd idea)
- Track domain usage, prioritize underused domains
- If user favorites cluster in one domain, diversify next batch

**Provocation Types**:
- Inversion: What if the opposite were true?
- Exaggeration: What if this were 1000x bigger/smaller?
- Elimination: What if we removed the core assumption?
- Random: Force connection with unrelated concept
- Time shift: What if this existed 100 years ago/from now?
- Stakeholder swap: What if designed for a completely different user?

---

## Interaction Adaptation Protocol

The technique determines whether the AI generates, asks, or co-builds — not a mode toggle.

**Principle**: Default to GENERATE. Only ELICIT when the user has knowledge the AI doesn't.

### Interaction Types

| Type | When Used | Example |
|------|-----------|---------|
| **Generate** | Technique is generative (SCAMPER, analogy, inversion, random-word) | AI produces 5 ideas across different domains |
| **Elicit** | Only user has the answer (feelings, constraints, stakeholders, context) | "What's your gut feeling on this?" (Red Hat) |
| **Co-build** | Combining ideas, refining concepts, critiquing together | User says "combine #2 and #7" → AI extends the combination |

### Technique Index with Interaction Types

Each technique in `references/techniques/index.yaml` declares its natural interaction:

```yaml
techniques:
  - id: scamper
    interaction: generate
    asks: null
    ai_behavior: "Apply S-C-A-M-P-E-R transformations and present modified concepts"

  - id: five-whys
    interaction: elicit
    asks:
      - trigger: "each why-level"
        question: "Why does [previous answer] happen?"
    ai_fallback: "AI hypothesizes the next 'why' and asks user to confirm/correct"

  - id: six-hats
    interaction: generate
    asks:
      - trigger: "red-hat"
        question: "What's your gut feeling about this idea?"
    ai_fallback: "AI infers likely emotional reaction from user's previous preferences"

  - id: disney-strategy
    interaction: co-build
    asks:
      - trigger: "critic-phase"
        question: "What concerns you most about this concept?"
    ai_fallback: "AI plays critic role and presents concerns for user to react to"
```

### Rules

- Never more than 2 questions in a row before generating something
- If user says "you decide" or "you try" → switch to generate even for elicitative techniques
- If user says "ask me" or "guide me" → increase elicitation temporarily
- Track question-to-generation ratio; if exceeds 1:3, generate more
- Every elicitative technique has an `ai_fallback` so the flow never stalls on user input

### Phase Ratios

| Skill | Generate | Elicit | Co-build |
|-------|----------|--------|----------|
| **Spark** | 80% | 5% | 15% |
| **Flame** | 60% | 15% | 25% |
| **Forge** | 40% | 20% | 40% |

Generation-heavy at start (Spark), increasingly collaborative as ideas become concrete (Forge).

---

## Folder Structure

### Source (in specsmd repo)
```
src/flows/ideation/
├── README.md                          # Research references & inspiration sources
├── flow.xml                           # Orchestrator manifest
├── config.yaml                        # Default configuration
├── skills/
│   ├── spark/                         # Generate skill
│   │   ├── SKILL.md                   # Router (XML body)
│   │   ├── workflows/
│   │   │   ├── freeform.xml           # AI generates freely with anti-bias
│   │   │   ├── technique-driven.xml   # AI uses specific technique(s)
│   │   │   └── provocation.xml        # AI generates provocations + builds
│   │   ├── references/
│   │   │   ├── techniques/
│   │   │   │   ├── index.yaml         # Technique metadata index
│   │   │   │   ├── scamper.md
│   │   │   │   ├── random-word.md
│   │   │   │   ├── what-if.md
│   │   │   │   ├── inversion.md
│   │   │   │   ├── analogy.md
│   │   │   │   ├── first-principles.md
│   │   │   │   └── questorming.md
│   │   │   └── anti-bias.md           # Anti-bias protocol reference
│   │   └── templates/
│   │       └── spark-bank.md          # Spark Bank output template
│   ├── flame/                         # Evaluate skill
│   │   ├── SKILL.md
│   │   ├── workflows/
│   │   │   ├── six-hats-rapid.xml     # Rapid multi-hat analysis
│   │   │   ├── impact-matrix.xml      # Impact/Feasibility scoring
│   │   │   └── force-field.xml        # Forces for/against
│   │   ├── references/
│   │   │   ├── six-hats-method.md
│   │   │   └── evaluation-criteria.md
│   │   └── templates/
│   │       └── flame-report.md        # Flame Report output template
│   └── forge/                         # Shape skill
│       ├── SKILL.md
│       ├── workflows/
│       │   ├── disney-strategy.xml    # Dreamer → Realist → Critic
│       │   └── concept-develop.xml    # Full concept development
│       ├── references/
│       │   ├── disney-method.md
│       │   └── pitch-framework.md
│       └── templates/
│           └── concept-brief.md       # Concept Brief output template
├── protocols/                         # Shared reusable protocols
│   ├── diverge-converge.xml           # Dual-thinking pattern
│   ├── deep-thinking.xml              # Sequential thinking (MCP or built-in)
│   ├── anti-bias.xml                  # Anti-LLM-bias enforcement
│   ├── interaction-adaptation.xml     # Technique-driven ask/generate/co-build
│   └── session-management.xml         # State tracking, continuation
├── templates/                         # Shared templates
│   └── session-header.yaml            # Common YAML frontmatter
└── prompts/                           # Slash command definitions
    ├── ideation.md                    # Orchestrator: /ideation
    ├── spark.md                       # Direct: /spark
    ├── flame.md                       # Direct: /flame
    └── forge.md                       # Direct: /forge
```

### Installed in a project
```
.specs-ideation/  → symlink or copy of src/flows/ideation/
.claude/commands/  → slash commands installed from prompts/
```

### Session output
```
ideation-sessions/
└── {session-id}/
    ├── session.yaml                   # State tracking (resumable)
    ├── spark-bank.md                  # Ideas generated
    ├── flame-report.md                # Evaluation results
    └── concept-briefs/                # One per forged concept
        └── {concept-name}.md
```

### Flow README
The flow includes a `README.md` at the root that references the research resources that inspired the design. Points to `/resources/brainstorming/` for the full source materials and analysis.

---

## Configuration (config.yaml)

```yaml
flow:
  name: ideation
  version: 1.0.0
  install-path: .specs-ideation

session:
  output-dir: ideation-sessions

spark:
  batch-size: 5                  # Ideas per batch
  target-count: 50               # Min ideas before suggesting convergence
  max-batches: 20                # Safety limit

deep-thinking:
  prefer-mcp: true               # Use sequential-thinking MCP if available
  fallback: built-in             # Use built-in protocol if MCP unavailable
  steps-per-batch: 6             # Reasoning steps per idea batch
  visibility: collapsed          # visible | collapsed | hidden

anti-bias:
  domain-diversity-min: 3        # Min different domains per batch
  provocation-frequency: 15      # Every N ideas, add provocation
  perspective-shift-frequency: 20
  domains:
    - Technology/Engineering
    - Human Psychology/Behavior
    - Business/Economics
    - Nature/Biology
    - Art/Design/Aesthetics
    - Games/Play
    - Social/Community
    - Physical Space/Architecture
    - Time/Temporal
    - Extreme/Edge Cases
    - Inversion/Opposite
    - Random Cross-Pollination

flame:
  default-method: six-hats-rapid
  shortlist-size: 5              # Top ideas to carry forward

forge:
  default-method: concept-develop
  include-pitch: true
  include-risks: true
```

---

## Slash Commands

| Command | Description | Invokes |
|---------|-------------|---------|
| `/ideation` | Full guided flow: Spark → Flame → Forge | Orchestrator |
| `/spark` | Direct idea generation | Spark skill |
| `/flame` | Direct idea evaluation | Flame skill |
| `/forge` | Direct concept shaping | Forge skill |

Each command is a `.md` file that loads the corresponding skill XML and passes user arguments as the topic/input.

---

## Comparison: specsmd Ideation vs classic Brainstorming

| Aspect | classic | specsmd Ideation |
|--------|------|-----------------|
| **First 30 seconds** | Setup questions (topic, format, technique, constraints) | Immediate spark batch — ideas in 30 seconds |
| **AI Role** | Facilitator asking questions | Creative partner — generates by default, asks only when user has unique knowledge |
| **Mode** | Single (facilitation) | Technique-driven — interaction type (generate/elicit/co-build) determined by what the technique needs |
| **Techniques** | User chooses from 62 in CSV | AI selects invisibly based on context |
| **Technique Awareness** | Users must understand academic methods | Techniques invisible — AI uses them internally |
| **Anti-Bias** | Text instruction ("pivot domains every 10 ideas") | Enforced protocol with domain wheel, provocation injection, tracking |
| **Deep Thinking** | Not integrated | Built-in reasoning protocol (MCP or native) per idea batch |
| **Output** | Append-only session document | Polished documents: Spark Bank, Flame Report, Concept Brief |
| **State** | YAML frontmatter in single markdown | Dedicated session.yaml + separate output files |
| **Architecture** | Markdown steps + CSV | XML state machine + YAML config + structured references |
| **Resumability** | Basic (frontmatter state) | Full session resumability with state tracking |
| **Energy Adaptation** | None | Detects engagement, adjusts pace and depth |
| **Configurability** | Hardcoded in workflow | config.yaml — customizable domains, batch sizes, modes |
| **Skill Modularity** | Single monolithic workflow | 3 independent skills, usable standalone or in sequence |

---

## The "Magic Moment"

What makes people say "this is better":

1. **Immediate creative value** — No setup. Topic → ideas in 30 seconds. User goes "whoa, these are actually interesting."
2. **Cross-domain surprises** — AI connects your problem to nature, games, history, architecture. Ideas you genuinely wouldn't have thought of.
3. **Genuine reasoning** — AI doesn't just list variations. It thinks through 6-7 steps per batch, producing deeper, more surprising connections.
4. **React, don't work** — User just picks favorites and says "more like this." The AI does the heavy creative lifting.
5. **Beautiful output** — Concept Briefs you can share in a meeting. Not raw notes.
6. **It gets better** — Each batch learns from your reactions. The session genuinely improves over time.

---

## Implementation Phases

### Phase 1: Foundation
- Create folder structure
- Write `flow.xml` (orchestrator manifest)
- Write `config.yaml`
- Write shared protocols (diverge-converge, deep-thinking, anti-bias, session-management)
- Write shared templates

### Phase 2: Spark Skill (most impactful — usable after this phase)
- Write `skills/spark/SKILL.md`
- Write `freeform.xml` workflow (the core experience)
- Write `technique-driven.xml` and `provocation.xml` workflows
- Write technique index + 7 core technique references
- Write anti-bias reference
- Write spark-bank template
- Write `/spark` and `/ideation` slash commands

### Phase 3: Flame Skill
- Write `skills/flame/SKILL.md`
- Write `six-hats-rapid.xml` workflow
- Write `impact-matrix.xml` workflow
- Write references and templates
- Write `/flame` slash command

### Phase 4: Forge Skill
- Write `skills/forge/SKILL.md`
- Write `disney-strategy.xml` workflow
- Write `concept-develop.xml` workflow
- Write references and templates
- Write `/forge` slash command

### Phase 5: Polish & Test
- End-to-end testing
- Session management (resume, archive)
- Energy adaptation refinement
- Documentation

---

## Research Foundation

This design synthesizes insights from the sources below. The flow's `README.md` references these directly.

### Source Materials (in `/resources/brainstorming/`)
- **Applied Imagination** — Alex Osborn (1953): The foundational text on brainstorming. Deferred judgment, quantity-first, Osborn-Parnes CPS 6-stage model, idea prompter checklists (became SCAMPER). PDF + analysis in `Applied_Imagination.pdf`.
- **Six Thinking Hats** — Edward de Bono (1985): Parallel thinking paradigm, ego protection via colored hat roles, hat sequencing methodology. PDF in `Edward De Bono - Six Thinking Hats*.pdf`.
- **Enhancing Your Creative Spirit** — Dr. John Kapeleris (2009): Creativity decline with age data (90% at age 5 → 2% in adults), Wallas creative process, 10 stimulation methods. PDF in `Enhancing_Your_Creative_Spirit*.pdf`.
- **Creative & Group Thinking Techniques** — Skillfluence Handbook: 25 practical techniques with when-to-use guidance, organized by phase (Problem Definition → Idea Generation → Evaluation). PDF in `LandD_skillfluence-creativity_-handbook.pdf`.
- **Brainstorming (Wikipedia)**: 9 brainstorming variations, 6 research-backed challenges (production blocking, collaborative fixation, evaluation apprehension), improvement methods, incentive models. PDF in `Brainstorming.pdf`.

### Design Methodology
- **Anthropic XML Guide** (`/memory-bank/ideas/anthropic-guides.md`): State machine execution, semantic tags, progressive disclosure, skill architecture, protocol patterns.

### Comprehensive Analysis
Full cross-resource synthesis: `/resources/brainstorming/analysis.md`

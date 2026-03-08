# Ideation Flow

**Spark → Flame → Forge** — AI-powered creative ideation.

## Overview

The Ideation flow transforms AI into a creative partner, not a facilitator. Give it a topic and get ideas in 30 seconds — no setup, no technique selection, no friction.

```
Topic → Spark (generate) → Flame (evaluate) → Forge (shape) → Concept Brief
```

## Quick Start

```bash
# Full guided flow
/specsmd-ideation

# Or jump directly to a skill
/specsmd-spark      # Generate ideas
/specsmd-flame      # Evaluate ideas
/specsmd-forge      # Shape concepts
```

## The Three Skills

### Spark (Generate)

Rapid-fire idea generation with cross-domain connections.

- AI generates batches of 5 ideas spanning 3+ domains
- You react: pick favorites, say "more", "wilder", "more like #3"
- AI adapts and generates more
- **Output**: Spark Bank document

### Flame (Evaluate)

Multi-perspective analysis of selected sparks.

- AI runs rapid Six Hats analysis per idea
- Scores on impact, feasibility, novelty
- You add your gut feeling and priorities
- **Output**: Flame Report with shortlist

### Forge (Shape)

Develops top flames into actionable concepts.

- AI applies Disney Strategy: Dream → Reality → Critique
- You co-build during the Critic phase
- Produces polished, shareable concept
- **Output**: Concept Brief

## Project Structure

When initialized, Ideation creates:

```
.specs-ideation/
├── sessions/
│   └── {session-id}/
│       ├── session.yaml         # Session state (resumable)
│       ├── spark-bank.md        # Ideas generated
│       ├── flame-report.md      # Evaluation results
│       └── concept-briefs/      # Shaped concepts
│           └── {concept-name}.md
└── standards/                   # Project standards (if initialized)
```

## Key Principles

1. **Zero friction** — Topic → ideas in 30 seconds
2. **Invisible techniques** — AI uses SCAMPER, Six Hats, etc. internally. You never see method names.
3. **Anti-bias engine** — Domain wheel ensures genuinely diverse ideas, not variations on a theme
4. **Deep thinking** — Multi-step reasoning per batch, not surface-level brainstorming
5. **Beautiful output** — Polished documents, immediately shareable

## Configuration

See `memory-bank.yaml` for:

- Session structure and naming
- Artifact paths
- Skill configuration (batch sizes, domains, convergence thresholds)

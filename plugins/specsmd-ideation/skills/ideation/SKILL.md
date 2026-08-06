---
name: ideation
description: Use when the user wants to brainstorm, generate ideas, explore possibilities, evaluate or compare ideas they already have, or shape a promising idea into a concept — including phrasings like "give me ideas for X", "help me think through X", "which of these is best", or "flesh this one out". Runs a creative ideation session and routes to the right stage of the Spark, Flame, and Forge progression.
license: MIT
metadata:
  version: "1.0.0"
  flow: ideation
  phase: orchestrator
---

# Ideation

Creative ideation guide for specsmd. Energetic, concise, action-oriented — get to ideas fast.

**Principle**: Zero friction. Topic to ideas in 30 seconds. Never ask setup questions.

## Constraints (critical)

- NEVER ask setup questions (technique choice, mode, format) — jump straight to generating.
- NEVER name techniques to the user (no "Let's use SCAMPER" or "Applying Six Hats").
- NEVER generate more than 2 questions in a row before producing creative output.
- ALWAYS maintain anti-bias diversity across idea domains.
- MUST use the deep thinking protocol for every idea batch.

## On Activation

1. **Load config** — read `references/memory-bank.yaml` in this skill's directory for the session schema, naming conventions, and per-stage configuration (batch size, target count, anti-bias domains, shortlist size).

2. **Check for existing sessions** — check whether `.specs-ideation/sessions/` exists and holds active sessions. If an active session has `phase != complete`, offer to resume: "You have an active session on '{topic}'. Resume or start fresh?"

3. **Route by input**:
   - User provided a topic → go straight to the `spark` skill with the topic.
   - User provided ideas to evaluate → go to the `flame` skill with the ideas.
   - User provided concepts to shape → go to the `forge` skill with the concepts.
   - No input provided → ask "What would you like to explore ideas about?" and, on response, go to the `spark` skill.

## Skills

| Command | Skill | Description |
|---------|-------|-------------|
| `spark`, `generate`, `ideas` | `spark` | Generate ideas — rapid-fire batches with cross-domain diversity |
| `flame`, `evaluate`, `score` | `flame` | Evaluate ideas — multi-perspective analysis and scoring |
| `forge`, `shape`, `develop` | `forge` | Shape concepts — develop top ideas into actionable concept briefs |

## Session Management

Sessions track state across skills:

```text
.specs-ideation/sessions/{session-id}/
├── session.yaml         # State (phase, favorites, scores)
├── spark-bank.md        # Generated ideas
├── flame-report.md      # Evaluation results
└── concept-briefs/      # Shaped concepts
```

- Create a session on the first Spark batch.
- Update `session.yaml` at each phase transition.
- Session ID format: `{topic-slug}-{YYYYMMDD}`.

## Flow Transitions

Natural flow progression:

```text
Spark → "Ready to evaluate?" → Flame → "Ready to shape?" → Forge → Complete
```

Users can also:

- Skip Spark (bring their own ideas to Flame)
- Skip Flame (bring evaluated ideas to Forge)
- Loop back (Forge → more Spark to explore new angles)
- Use any skill standalone

## Success Criteria

- User gets creative ideas within 30 seconds of providing a topic.
- Ideas span genuinely diverse domains.
- Flow transitions feel natural, not procedural.
- Output documents are polished and shareable.
- Session state is maintained for resumability.

## Begin

Check for existing sessions, then route based on user input. If a topic is provided, go straight to Spark.

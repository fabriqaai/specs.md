# Deep Thinking Protocol

Structured multi-step reasoning for idea generation. Executes before every Spark batch to ensure ideas are genuinely thought through, not surface-level pattern matching.

## MCP Detection

The protocol adapts based on available tools:

### When Sequential Thinking MCP is Available

Use the `mcp__sequential-thinking__sequentialthinking` tool with 6-7 thoughts per batch:

```
Thought 1/6 — Domain Check
Thought 2/6 — Raw Concepts
Thought 3/6 — Novelty Filter
Thought 4/6 — Cross-pollinate
Thought 5/6 — Provocation (if due)
Thought 6/6 — Polish
Thought 7/7 — Meta-check (optional, if diversity seems low)
```

Each thought should set `nextThoughtNeeded: true` until the final thought.

### When MCP is Unavailable (Built-in Fallback)

Execute the same reasoning chain as an internal process. Think through each step before generating output. The cognitive pattern is the same — only the mechanism differs.

## The 6-Step Reasoning Chain

### Think 1 — Domain Check
- Review domain usage tracking from session state
- Which domains are underexplored?
- Select 3+ target domains for this batch
- If user expressed preferences, balance between preferred and underexplored

### Think 2 — Raw Concepts
- Generate 1-2 raw ideas per selected domain
- Use a technique internally: SCAMPER, analogy, inversion, random-word, what-if, first-principles, or questorming
- Select technique based on: what hasn't been used recently, what fits the user's energy, what the topic needs
- Aim for 6-8 raw concepts to select 5 from

### Think 3 — Novelty Filter
- For each raw concept, ask: "Is this genuinely new or a repackaged version of an obvious idea?"
- Check against ideas already generated in this session
- Replace any that feel generic, incremental, or too similar to existing ideas
- The bar: would this make someone say "huh, I never thought of that"?

### Think 4 — Cross-pollinate
- If user has stated favorites, can any new ideas combine with them?
- Look for unexpected connections between the raw concepts themselves
- Create at least one idea that bridges two different domains

### Think 5 — Provocation
- Check: is a provocation due? (every 15 ideas)
- If yes: select a provocation type and generate one deliberately absurd idea
- If no: ensure at least one idea in the batch challenges a core assumption
- The provocation should be surprising but contain a genuine insight

### Think 6 — Polish
- For each of the 5 selected ideas:
  - Make it vivid: use concrete details, not abstractions
  - Make it specific: "a quest system where..." not "gamification"
  - Make it memorable: could someone retell this idea to a colleague?
- Final anti-bias check: do the 5 ideas span 3+ domains? No 2 consecutive from same domain?

### Think 7 — Meta-check (Optional)
- Only if something feels off about the batch
- Is this batch genuinely diverse or are the ideas structurally similar?
- Does this batch feel different from the previous batch?
- If concerns, regenerate the weakest 1-2 ideas

## Visibility Modes

| Mode | Behavior |
|------|----------|
| `visible` | Show all thinking steps to user (learning/transparency mode) |
| `collapsed` | Show "Thinking..." indicator, then present results (default) |
| `hidden` | Show only the resulting ideas (fast mode) |

Default is `collapsed`. User can request visibility changes at any time.

## Key Principle

The deep thinking protocol is a **skill feature**, not an MCP dependency. The sequential-thinking MCP tool is an optimization that provides traceability, but the cognitive pattern is enforced by this protocol regardless of tool availability.

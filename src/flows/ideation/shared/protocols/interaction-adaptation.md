# Interaction Adaptation Protocol

The technique determines whether the AI generates, asks, or co-builds — not a mode toggle. This protocol governs all interactions across Spark, Flame, and Forge.

## Interaction Types

| Type | When Used | AI Behavior |
|------|-----------|-------------|
| **Generate** | Technique is generative (SCAMPER, analogy, inversion, random-word) | AI produces creative output, user reacts |
| **Elicit** | Only user has the answer (feelings, constraints, stakeholders, context) | AI asks a specific question, waits for response |
| **Co-build** | Combining ideas, refining concepts, critiquing together | AI starts, user extends, AI builds on extension |

## Phase Ratios

| Skill | Generate | Elicit | Co-build |
|-------|----------|--------|----------|
| **Spark** | 80% | 5% | 15% |
| **Flame** | 60% | 15% | 25% |
| **Forge** | 40% | 20% | 40% |

Generation-heavy at start (Spark), increasingly collaborative as ideas become concrete (Forge).

## Hard Rules

### The 2-Question Limit
**NEVER more than 2 questions in a row before generating something creative.**

If the AI has asked 2 questions, it MUST generate output next — even if it doesn't have complete information. Use the `ai_fallback` for the technique and generate based on available context.

### User Override Signals

| User Says | Shift To |
|-----------|----------|
| "you decide" / "you try" / "surprise me" | More generation, less elicitation |
| "ask me" / "guide me" / "help me think" | More elicitation temporarily |
| "let's work on this together" | More co-build |
| "just give me ideas" | Maximum generation |
| (short responses, low engagement) | More generation to re-energize |
| (detailed responses, high engagement) | More co-build to leverage engagement |

### Ratio Tracking
Track the question-to-generation ratio. If it exceeds 1:3 (more than 1 question per 3 generated outputs), shift toward more generation.

## Technique-Interaction Mapping

Each technique declares its natural interaction type:

| Technique | Natural Mode | Elicit Trigger | AI Fallback |
|-----------|-------------|---------------|-------------|
| SCAMPER | Generate | — | — |
| Random Word | Generate | — | — |
| What-If | Generate | — | — |
| Inversion | Generate | — | — |
| Analogy | Generate | — | — |
| First Principles | Generate | — | — |
| Questorming | Co-build | "Which question matters most?" | AI picks the most provocative question |
| Six Hats | Generate | Red Hat: "What's your gut feeling?" | AI infers from user's previous preferences |
| Disney Strategy | Co-build | Critic: "What concerns you most?" | AI plays critic and presents concerns |

## Energy Adaptation

The AI reads engagement signals and adapts:

### High Energy Signals
- Long responses, exclamation marks, building on ideas
- **Response**: Match energy, increase pace, go bolder

### Medium Energy Signals
- Moderate responses, picking favorites, giving direction
- **Response**: Steady pace, follow their direction

### Low Energy Signals
- Short responses ("ok", "sure", "next"), slow replies
- **Response**: Generate more (don't ask), try a different angle, offer to pause or switch skills

### Re-energizing Tactics
When energy drops:
1. Switch technique (if SCAMPER isn't landing, try inversion or random-word)
2. Switch domain (if tech ideas aren't exciting, try nature or games)
3. Inject a provocation (absurd idea can re-spark interest)
4. Offer direction change: "Want me to go wilder? More practical? Different angle entirely?"

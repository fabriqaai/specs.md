# Anti-Bias Protocol

A structured enforcement protocol — not advisory text — that ensures genuinely diverse idea generation. This protocol is MANDATORY for every Spark batch.

## Domain Wheel

The domain wheel has 12 sectors. Every idea must be tagged with its primary domain.

| # | Domain | Description |
|---|--------|-------------|
| 1 | **Technology/Engineering** | Systems, algorithms, automation, tools, platforms |
| 2 | **Human Psychology/Behavior** | Motivation, habits, cognition, emotion, perception |
| 3 | **Business/Economics** | Markets, incentives, pricing, value chains, models |
| 4 | **Nature/Biology** | Ecosystems, evolution, biomimicry, growth patterns |
| 5 | **Art/Design/Aesthetics** | Form, beauty, expression, sensory experience |
| 6 | **Games/Play** | Competition, rules, progression, fun, challenge |
| 7 | **Social/Community** | Networks, culture, belonging, collaboration, identity |
| 8 | **Physical Space/Architecture** | Layout, flow, wayfinding, environment, materials |
| 9 | **Time/Temporal** | Timing, rhythm, duration, history, future, pacing |
| 10 | **Extreme/Edge Cases** | Exceptions, outliers, extremes, stress scenarios |
| 11 | **Inversion/Opposite** | Reversal, contradiction, paradox, opposing approach |
| 12 | **Random Cross-Pollination** | Unrelated connections, serendipity, distant transfer |

## Enforcement Rules

### Per-Batch (5 ideas)
1. **Minimum 3 different domains** per batch — HARD REQUIREMENT
2. **Never 2 consecutive ideas from the same domain**
3. **Track domain usage** across the entire session
4. **Prioritize underused domains** — if a domain has 0 ideas, it should appear in the next 2 batches

### Per-Session
5. **After every 15 ideas**: inject 1 provocative idea (see Provocation Types below)
6. **After every 20 ideas**: shift perspective entirely (different user persona, different era, different culture)
7. **If user favorites cluster in 1-2 domains**: deliberately diversify the next batch into 4+ domains
8. **By session end**: aim for 8+ domains covered

### Domain Tracking Format

Maintain internal tracking (not shown to user):

```
Domain usage: Tech(4) Psych(2) Biz(3) Nature(1) Art(0) Games(2) Social(1) Space(0) Time(1) Extreme(1) Inversion(0) Random(0)
Underused: Art, Space, Inversion, Random → prioritize these in next batch
```

## Provocation Types

Provocations are deliberately absurd or extreme ideas that break fixation patterns.

| Type | Trigger | Example |
|------|---------|---------|
| **Inversion** | Reverse a core assumption | "What if users paid to NOT use it?" |
| **Exaggeration** | Scale to absurdity | "What if 1 million people used it simultaneously?" |
| **Elimination** | Remove the central element | "What if there was no UI at all?" |
| **Random** | Force unrelated connection | "How would a coral reef solve this?" |
| **Time shift** | Transplant to different era | "How would this work in 1890? In 2150?" |
| **Stakeholder swap** | Different user entirely | "Design this for a 5-year-old. Now for a 90-year-old." |

### Provocation Rules
- Label provocations internally but present them naturally among other ideas
- If a provocation resonates with the user, develop it into a real idea
- Provocations should be surprising but contain a kernel of insight

## LLM-Specific Bias Mitigations

AI language models have known ideation biases. This protocol counters them:

| LLM Bias | Mitigation |
|----------|------------|
| **Technology bias** — defaults to tech solutions | Domain wheel forces non-tech domains |
| **Recency bias** — favors recent/trendy concepts | Time-shift provocations and historical analogies |
| **Clustering** — ideas that sound different but are structurally similar | Novelty filter in deep thinking (Think 3) |
| **Safety bias** — avoids bold/risky ideas | Inversion and exaggeration provocations |
| **Verbosity bias** — abstract descriptions instead of vivid ideas | "Polish" step requires specific, concrete, memorable output |
| **Anchoring** — first idea dominates subsequent ones | Each batch starts with fresh domain selection |

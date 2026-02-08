# Disney Creative Strategy

**Origin**: Modeled after Walt Disney's creative process by Robert Dilts (1994). Disney reportedly used three distinct "rooms" for thinking: the Dreamer room, the Realist room, and the Critic room.

## Core Concept

The same idea is examined through three completely separate lenses, in sequence. The key insight is **strict separation** — you never dream and critique simultaneously.

## The Three Roles

### The Dreamer
- **Mindset**: "Anything is possible"
- **Perspective**: User/visionary — what would be amazing?
- **Time horizon**: Infinite
- **Constraints**: None
- **Question**: "If we could do anything, what would this look like?"

**AI behavior in Dreamer mode**:
- Generate the most ambitious version of the idea
- No "but" or "however" — pure expansion
- Think about the emotional impact on users
- Explore adjacent possibilities and long-term potential
- Use vivid, exciting language

### The Realist
- **Mindset**: "How would this actually work?"
- **Perspective**: Project manager/engineer — what's the plan?
- **Time horizon**: 3-12 months
- **Constraints**: Resources, technology, time
- **Question**: "What needs to be true for this to work?"

**AI behavior in Realist mode**:
- Break the dream into concrete components
- Identify the minimum viable version
- Map resources, skills, and technology needed
- Propose an implementation sequence
- Focus on what can be leveraged from existing work

### The Critic
- **Mindset**: "What could go wrong?"
- **Perspective**: Quality assurance/risk analyst — what are the weak spots?
- **Time horizon**: Full lifecycle
- **Constraints**: Reality, competition, human nature
- **Question**: "Why might this fail, and how do we prevent it?"

**AI behavior in Critic mode**:
- Identify genuine risks (not token concerns)
- Challenge the weakest assumptions
- Consider second-order effects and unintended consequences
- For EACH criticism, propose a mitigation
- The goal is to strengthen, not to kill

## Sequencing Rules

```
Dreamer → Realist → Critic
```

1. **Always start with Dreamer** — establishes the vision before constraints appear
2. **Realist grounds the dream** — but doesn't shrink it, just makes it buildable
3. **Critic strengthens** — finds weaknesses AND fixes them
4. **Optional loop**: If Critic reveals fundamental issues → mini Dreamer pass to re-envision → Realist → Critic again

## Co-build Integration

The Forge skill uses Disney Strategy with a co-build emphasis:

| Phase | AI Role | User Role |
|-------|---------|-----------|
| **Dreamer** | AI expands (generates 70%) | User adds aspirations (30%) |
| **Realist** | AI structures (generates 60%) | User validates and adjusts (40%) |
| **Critic** | AI raises concerns (generates 40%) | User identifies personal concerns and co-develops mitigations (60%) |

The Critic phase has the highest user involvement because:
- Users know their context, stakeholders, and politics better than AI
- Risk assessment requires domain-specific knowledge
- Co-developing mitigations builds ownership and confidence

## Anti-Pattern: The Premature Critic

The most common failure mode is jumping to critique too early. Signals:
- "That won't work because..." (before the idea is fully developed)
- "But what about..." (during Dreamer phase)
- Listing constraints before exploring possibilities

**Mitigation**: Explicitly signal phase transitions. "We're in Dreamer mode — no limits yet. We'll stress-test in a moment."

# Unit Brief: Facilitation Guides

## Overview

Facilitation Guides are markdown files that instruct the Master Agent on HOW to have a conversation with the user to gather decisions for each standard. They provide question strategies, recommendations, tradeoff explanations, and adaptive communication styles.

---

## Scope

### In Scope
- Conversational prompts for each decision area
- Recommendations by use case
- Tradeoff explanations
- Adaptive communication strategies
- Validation questions
- Summary templates

### Out of Scope
- What decisions exist (handled by standards-catalog)
- Output format (handled by standards-templates)

---

## Technical Context

### File Location
`.specsmd/aidlc/templates/standards/{standard-id}.guide.md`

### Available Guides
- `tech-stack.guide.md`
- `coding-standards.guide.md`
- `system-architecture.guide.md`
- `ux-guide.guide.md`
- `api-conventions.guide.md`

---

## Implementation Details

### Guide Structure

Every facilitation guide follows this structure:

```markdown
# {Standard Name} Facilitation Guide

## Purpose
{Why this standard matters to the project}

---

## Facilitation Approach

{How to adapt to user's expertise level}

**Adapt your style:**
- If they mention specific technologies confidently → be concise
- If they seem uncertain → provide more context, examples
- If they have strong preferences → respect them, ask about tradeoffs

**Your role:**
- Guide discovery, don't dictate choices
- Surface tradeoffs they may not have considered
- Ensure choices are coherent (no conflicting technologies)
- Capture rationale, not just the choice

---

## Discovery Areas

### 1. {Decision Area Name}

**Goal**: {What we're trying to understand}

**Open with context:**
> "{Contextual statement about why this matters}"

**Explore:**
- {Question 1}
- {Question 2}
- {Question 3}

**If they're unsure, guide by use case:**

| Use Case | Recommendation | Why |
|----------|----------------|-----|
| {case 1} | {recommendation} | {rationale} |
| {case 2} | {recommendation} | {rationale} |

**Common signals to listen for:**
- "{signal}" → {interpretation}

**Validate before moving on:**
> "So we're going with {choice}. This means {implication}. Sound right?"

---

### 2. {Next Decision Area}
{Same structure...}

---

## Completing the Discovery

Once you've explored all relevant areas, summarize:

```markdown
## {Standard Name} Summary

Based on our conversation, here's what I understand:

**{Decision 1}**: {choice}
{brief rationale}

**{Decision 2}**: {choice}
{brief rationale}

...

Does this capture your choices accurately? Any adjustments needed?
```

---

## Output Generation

After confirmation, create `standards/{output-file}.md`:

{Template for final output}

---

## Notes for Agent

- Don't ask all questions linearly - adapt based on context
- Skip irrelevant decisions - CLI tools don't need UI discussion
- Capture rationale - "why" is as important as "what"
- Respect existing choices - don't second-guess without reason
- It's okay to leave things TBD - not every decision needed upfront
```

### Example: Tech Stack Guide Excerpt

```markdown
### 1. Languages

**Goal**: Understand what programming language(s) they'll use.

**Open with context:**
> "Let's start with languages. This affects everything else -
> framework options, available libraries, team hiring, and
> performance characteristics."

**Explore:**
- What languages is the team already comfortable with?
- Is type safety important?
- What's the runtime environment? (Browser, Node.js, Edge, Native)
- Any organizational standards or constraints?

**If they're unsure, guide by use case:**

| Use Case | Recommendation | Why |
|----------|----------------|-----|
| Web app (full-stack) | TypeScript | Type safety, React/Next.js ecosystem |
| API service | TypeScript or Go | TS for ecosystem, Go for performance |
| ML/AI/Data | Python | Libraries (PyTorch, pandas) |
| High-performance | Go or Rust | Go for simplicity, Rust for safety |
| Scripts/automation | Python or TypeScript | Readability, quick iteration |

**Common signals:**
- "We're a React shop" → TypeScript
- "We do ML/AI" → Python, possibly with TypeScript frontend
- "Performance is critical" → Go, Rust, or optimized Node.js

**Validate:**
> "So we're going with {language}. This means {implication}. Sound right?"
```

### Adaptive Communication

The guide instructs the agent to adapt based on signals:

**Expert signals** (be concise):
- Mentions specific versions ("Node 20", "React 18")
- Uses technical jargon correctly
- States preferences with confidence
- Knows about tradeoffs

**Beginner signals** (provide context):
- Asks "what's the difference between..."
- Says "I've heard of X but..."
- Uncertain language ("maybe", "I think")
- No strong preferences

**Opinionated signals** (respect, probe):
- "We always use X"
- Strong negative reactions to suggestions
- Mentions past experiences

---

## Key Facilitation Principles

1. **Discovery over forms**: Have a conversation, don't fill out a checklist
2. **Rationale over choices**: Capture WHY not just WHAT
3. **Coherence over completeness**: Ensure choices work together
4. **Adaptability**: Adjust depth based on user expertise
5. **Respect agency**: User makes final decisions
6. **Allow TBD**: Not everything needs answering now

---

## Acceptance Criteria

### AC-1: Guide Loading
- GIVEN Master Agent facilitating tech-stack
- WHEN guide is loaded
- THEN all decision areas are available
- AND recommendations are context-appropriate

### AC-2: Adaptive Communication
- GIVEN user says "We're a TypeScript shop"
- WHEN agent continues facilitation
- THEN agent skips basic language explanation
- AND focuses on framework selection

### AC-3: Tradeoff Surfacing
- GIVEN user selects Next.js
- WHEN agent validates choice
- THEN agent mentions React lock-in
- AND confirms user is comfortable with implication

### AC-4: Summary Generation
- GIVEN all decisions made
- WHEN facilitation completes
- THEN summary includes all choices with rationale
- AND user can request adjustments

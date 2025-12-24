# Unit Brief: Construction Agent

## Overview

The Construction Agent is the software engineer that executes bolts through their defined stages. It transforms inception artifacts into working code.

---

## Scope

### In Scope
- Bolt planning for units (bolt-plan skill)
- Bolt execution and management (bolt-start skill)
- Bolt status tracking (bolt-status skill)
- Bolt listing (bolt-list skill)
- Navigation menu (navigator skill)

### Out of Scope
- Requirements gathering (Inception Agent)
- Project routing (Master Agent)
- Deployment (Operations Agent)

---

## Technical Context

### Entry Points
- `/specsmd-construction-agent` - Activate Construction Agent

### Dependencies
- Memory Bank schema (`memory-bank.yaml`)
- Unit briefs from Inception
- Bolt type definitions (`bolt-types/`)
- Project standards (`memory-bank/standards/`)
- Construction templates (`templates/construction/`)

### Outputs
- Bolt artifacts (`memory-bank/bolts/{bolt-id}.md`)
- Domain designs
- Logical designs
- Implementation code
- Tests

---

## Estimation Guidelines (AI-DLC)

**AI-DLC uses dual estimation**: AI Implementation Time + Human Validation Time

### Stage-Level Estimates

| Stage Type | AI Time | Human Validation | Total |
|------------|---------|------------------|-------|
| Domain Design (DDD) | 15-30 min | 15-30 min | 30-60 min |
| Logical Design | 15-30 min | 15-30 min | 30-60 min |
| Implementation | 30-60 min | 30-60 min | 1-2 hours |
| Testing | 20-40 min | 20-40 min | 40-80 min |

### Bolt-Level Estimates

| Bolt Size | Stories | AI Time | Human Time | Total |
|-----------|---------|---------|------------|-------|
| Simple | 1-3 | 30-60 min | 30-60 min | 1-2 hours |
| Medium | 3-5 | 1-2 hours | 1-2 hours | 2-4 hours |
| Complex | 5-8 | 2-3 hours | 2-4 hours | 4-7 hours |

**Only use DAY estimates when:**
- Requires learning unfamiliar technology (human ramp-up)
- Heavy external API integration with unknowns
- Complex cross-system coordination
- Extended manual testing/verification cycles required

---

## Implementation Notes

### Persona Characteristics
- Role: Software Engineer
- Communication Style: Technical and methodical
- Principle: Follow bolt stages exactly as defined, never skip validation

### Critical Actions
1. ALWAYS read bolt type definition before starting
2. LOAD project standards (tech-stack, coding-standards) before coding
3. EXECUTE stages in order - never skip stages
4. VALIDATE stage completion before advancing to next
5. NEVER assume what stages a bolt has - read the definition
6. USE hour-based estimates for bolt execution (AI-assisted development is fast)
7. TRACK both AI implementation time and human validation time separately
8. READ unit-brief.md Story Summary to understand story count and priorities
9. CHECK global story index for cross-unit story dependencies
10. CHECK bolt dependencies (requires_bolts, requires_units) before starting

### Output Formatting Requirements
All agent outputs MUST follow the output formatting standards:
- 🚫 **NEVER** use ASCII tables for options
- ✅ **ALWAYS** use numbered list format: `N - **Option**: Description`
- ✅ **ALWAYS** use status indicators: ✅ (done) ⏳ (current) [ ] (pending) 🚫 (blocked)
- ✅ **ALWAYS** end with suggested next step pattern

See `specs/standards/output-formatting.md` for complete specification.

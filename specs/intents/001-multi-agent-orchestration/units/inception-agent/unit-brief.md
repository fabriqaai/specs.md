# Unit Brief: Inception Agent

## Overview

The Inception Agent is the requirements architect that transforms high-level intents into actionable plans. It handles all inception phase activities.

---

## Scope

### In Scope
- Intent creation and management (intent-create, intent-list skills)
- Requirements gathering (requirements skill)
- System context definition (context skill)
- Unit decomposition using DDD principles (units skill)
- User story creation (story-create skill)
- Bolt planning for construction (bolt-plan skill)
- Inception phase review (review skill)
- Navigation menu (navigator skill)

### Out of Scope
- Project state analysis (Master Agent)
- Bolt execution (Construction Agent)
- Deployment (Operations Agent)

---

## Technical Context

### Entry Points
- `/specsmd-inception-agent` - Activate Inception Agent

### Dependencies
- Memory Bank schema (`memory-bank.yaml`)
- Intent templates (`templates/inception/`)
- Requirements template
- Unit brief template
- Story template

### Outputs
- Intent artifacts (`memory-bank/intents/{intent-name}/`)
- Requirements documents
- System context documents
- Unit decomposition
- User stories with acceptance criteria
- Bolt plans

---

## Naming Conventions (CRITICAL)

All naming is derived from folder/file names - NO frontmatter prefixes needed.

| Artifact | Format | Example |
|----------|--------|---------|
| **Intent folder** | `{NNN}-{intent-name}` | `001-user-authentication` |
| **Unit folder** | `{unit-name}` | `auth-service` |
| **Story file** | `{SSS}-{unit-name}.md` | `001-auth-service.md` |
| **Bolt file** | `bolt-{unit-name}-{N}.md` | `bolt-auth-service-1.md` |

Where:
- `{NNN}` = 3-digit intent number (001, 002, etc.)
- `{SSS}` = 3-digit story number within unit (001, 002, etc.)
- `{N}` = Sequential bolt number for unit (1, 2, 3, etc.)

**Global uniqueness** comes from the full path:
`memory-bank/intents/001-user-authentication/units/auth-service/stories/001-auth-service.md`

---

## Estimation Guidelines (AI-DLC)

**AI-DLC uses dual estimation**: AI Implementation Time + Human Validation Time

### Story-Level Estimates

| Story Complexity | AI Implementation | Human Validation | Total |
|------------------|-------------------|------------------|-------|
| Simple CRUD | 15-30 min | 15-30 min | 30-60 min |
| Moderate feature | 30-60 min | 30-60 min | 1-2 hours |
| Complex feature | 1-2 hours | 1-2 hours | 2-4 hours |
| Integration work | 1-2 hours | 2-3 hours | 3-5 hours |

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
- Role: Requirements Architect
- Communication Style: Inquisitive and structured
- Principle: Gather requirements through conversation, validate before proceeding

### Critical Actions
1. ALWAYS read existing intents before creating new ones
2. VALIDATE intent names follow numbered prefix convention (001-, 002-, etc.)
3. NEVER proceed without human validation at key decision points
4. CREATE all artifacts using templates
5. USE hour-based estimates, not day-based (AI-assisted development is fast)
6. ALWAYS include dual estimates (AI time + Human validation time)
7. UPDATE unit-brief.md with Story Summary after creating stories
8. UPDATE global story index (default: `memory-bank/story-index.md`) after creating stories

### Output Formatting Requirements
All agent outputs MUST follow the output formatting standards:
- 🚫 **NEVER** use ASCII tables for options
- ✅ **ALWAYS** use numbered list format: `N - **Option**: Description`
- ✅ **ALWAYS** use status indicators: ✅ (done) ⏳ (current) [ ] (pending) 🚫 (blocked)
- ✅ **ALWAYS** end with suggested next step pattern

See `specs/standards/output-formatting.md` for complete specification.

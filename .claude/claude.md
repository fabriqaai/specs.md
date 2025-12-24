# Claude Instructions for specsmd Development

## Primary Directive: Strict AI-DLC Adherence

**Core Principle**: We are implementing AI-DLC as defined by AWS, not creating our own version of it.

---

## 1. **Required Reading Before Any AI-DLC Changes**

When working on AI-DLC flow implementation or documentation, you MUST read these files **IN ORDER**:

### Primary Source (ALWAYS FIRST)
1. **AI-DLC Specification**
   - PDF: `/resources/aidlc.pdf` (original AWS specification)
   - Text: `/resources/ai-dlc-specification.md` (readable version)
   - This is the authoritative source for AI-DLC concepts
   - If something is not in the official spec, it's not AI-DLC

### Implementation Files (READ SECOND)
2. **`/src/flows/aidlc/agents/`** - Agent implementations
   - Contains: Master, Inception, Construction, Operations agents
3. **`/src/flows/aidlc/`** - Memory bank configuration and skills
   - Contains: memory-bank.yaml, context-config.yaml, skills, templates

### Specifications (Reference)
4. **`/specs/`** - Project specifications
   - Contains: PRFAQ, glossary, term-mappings, intents, standards
   - Structure follows AI-DLC: intents → units → stories

---

## 2. **AI-DLC Immutable Principles**

The following are FROM THE PDF and CANNOT be changed:

1. **Three Phases Only**: Inception → Construction → Operations
2. **Mob Rituals**: Mob Elaboration (Inception), Mob Construction (Construction)
3. **Bolt Duration**: "hours or days" (flexible, NOT fixed like "1-2 days")
4. **DDD Integration**: Domain-Driven Design is integral to AI-DLC
5. **Sequential Phases**: NOT iterative like Agile (phases are sequential, execution within Construction is iterative)
6. **AI Drives, Human Validates**: AI proposes, humans approve

---

## 3. **Forbidden Actions**

When working on AI-DLC features, you MUST NOT:

- ❌ Invent or modify AI-DLC concepts not in the PDF
- ❌ Add phases beyond Inception/Construction/Operations
- ❌ Change "hours or days" to fixed durations (e.g., "1-2 days")
- ❌ Use terms like "Discovery Bolt" or "Design Bolt" (these don't exist in AI-DLC)
- ❌ Make AI-DLC iterative like Agile (phases are sequential)
- ❌ Use verb-noun command patterns (use noun-verb instead)
- ❌ Duplicate documentation content in this file (point to specs instead)
- ❌ Invoke Bolt commands (`bolt-plan`, `bolt-start`, etc.) outside of Construction Agent context

---

## 4. **Where to Find Specifications**

Instead of duplicating content here, refer to these files:

| Topic | File Location |
|-------|---------------|
| **Term Mappings** | `/specs/term-mappings.md` |
| **Glossary** | `/specs/glossary.md` |
| **PRFAQ** | `/specs/PRFAQ.md` |
| **Standards** | `/specs/standards/` (tech-stack, coding-standards, system-architecture) |
| **Agent Specs** | `/specs/intents/001-multi-agent-orchestration/units/` |
| **Memory Bank Specs** | `/specs/intents/003-memory-bank-system/units/` |
| **Agent Implementation** | `/src/flows/aidlc/agents/` |
| **Skills** | `/src/flows/aidlc/skills/` (inception, construction) |
| **Templates** | `/src/flows/aidlc/templates/` |
| **Memory Bank Config** | `/src/flows/aidlc/memory-bank.yaml` |

---

## 5. **Process for AI-DLC Feature Development**

Follow this process for ANY AI-DLC feature work:

1. **Review existing agent implementations** (`/src/flows/aidlc/agents/`)
   - Understand established patterns and conventions
   - Follow existing agent structure (Persona, Critical Actions, Skills, Workflow)

2. **Check specifications** (`/specs/`)
   - Review glossary and term-mappings for consistent terminology
   - Check relevant unit-briefs for requirements

3. **Review skills and templates** (`/src/flows/aidlc/`)
   - Skills define agent capabilities
   - Templates ensure consistent artifact creation

4. **If uncertain, ask rather than invent**
   - Don't make assumptions about AI-DLC methodology
   - Don't "improve" or modify AI-DLC concepts without discussion

---

## 6. **Project Context**

### Company & Branding
- **Company**: specsmd (all lowercase)
- **Website**: https://specs.md
- **Project**: specsmd (all lowercase)
- **Primary Focus**: AI-DLC implementation for AI-native engineers

### Key Conventions
- Command naming: noun-verb pattern (e.g., `bolt-start`, `intent-create`)
- File structure: See `/specs/` for specifications, `/src/flows/aidlc/` for implementation

---

## 7. **Quick Validation Checklist**

Before implementing any AI-DLC feature, ask:

- ✅ Have I reviewed existing agent implementations in `/src/flows/aidlc/agents/`?
- ✅ Am I following established patterns (Persona, Critical Actions, Skills, Workflow)?
- ✅ Am I using noun-verb command pattern?
- ✅ Am I respecting the 3-phase structure (Inception → Construction → Operations)?
- ✅ Am I pointing to specs rather than duplicating content?
- ✅ Have I checked `/specs/glossary.md` for consistent terminology?

---

*These instructions ensure specsmd delivers a faithful, world-class AI-DLC implementation.*

*Last updated: 2025-12-06 - Updated file references to match actual project structure*

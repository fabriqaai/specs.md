# Unit Decomposition: 004-standards-system

## Overview

The Standards System provides a three-tier architecture for creating project standards: a catalog that defines available standards, facilitation guides that help agents gather decisions, and templates for generating the final standard files.

---

## Units Created

| Unit | Purpose | Dependencies |
|------|---------|--------------|
| `standards-catalog` | Registry of available standards with decisions | None |
| `facilitation-guides` | Conversational prompts for gathering decisions | `standards-catalog` |
| `standards-templates` | Output templates for generated standards | `facilitation-guides` |

---

## Dependency Graph

```
┌─────────────────────┐
│  standards-catalog  │
│     (catalog.yaml)  │
└──────────┬──────────┘
           │ defines what to ask
           ▼
┌─────────────────────┐
│ facilitation-guides │
│    (*.guide.md)     │
└──────────┬──────────┘
           │ generates output using
           ▼
┌─────────────────────┐
│ standards-templates │
│  (*-template.md)    │
└─────────────────────┘
           │
           ▼
     memory-bank/standards/*.md
        (generated output)
```

---

## File Structure

```
.specsmd/aidlc/templates/standards/
├── catalog.yaml                    # Registry of all standards
├── tech-stack.guide.md             # Facilitation guide for tech stack
├── coding-standards.guide.md       # Facilitation guide for code style
├── system-architecture.guide.md    # Facilitation guide for architecture
├── ux-guide.guide.md               # Facilitation guide for UX (optional)
├── api-conventions.guide.md        # Facilitation guide for APIs (optional)
├── tech-stack-template.md          # Output template
├── coding-standards-template.md    # Output template
└── system-architecture-template.md # Output template
```

---

## Three-Tier Architecture

### Tier 1: Standards Catalog
Defines WHAT standards exist and WHAT decisions need to be made.

### Tier 2: Facilitation Guides
Defines HOW to gather each decision through conversation.

### Tier 3: Standards Templates
Defines the OUTPUT format for generated standards.

---

## Available Standards

| Standard ID | Name | Importance | Required |
|-------------|------|------------|----------|
| `tech-stack` | Technology Stack | Critical | Yes |
| `coding-standards` | Coding Standards | Critical | Yes |
| `system-architecture` | System Architecture | High | Recommended |
| `ux-guide` | UX Guide | Medium | Optional |
| `api-conventions` | API Conventions | Medium | Optional |

---

## Project Types

Different project types require different standards:

| Project Type | Required | Recommended |
|--------------|----------|-------------|
| `full-stack-web` | tech-stack, coding-standards | system-architecture, ux-guide, api-conventions |
| `backend-api` | tech-stack, coding-standards | system-architecture, api-conventions |
| `frontend-app` | tech-stack, coding-standards | ux-guide |
| `cli-tool` | tech-stack, coding-standards | - |
| `library` | tech-stack, coding-standards | api-conventions |

---

## Artifacts Created

- `004-standards-system/units.md` (this file)
- `004-standards-system/units/standards-catalog/unit-brief.md`
- `004-standards-system/units/facilitation-guides/unit-brief.md`
- `004-standards-system/units/standards-templates/unit-brief.md`

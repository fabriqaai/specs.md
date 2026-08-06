---
name: spec-design
description: Use when the user asks to write or update the technical design for a feature spec whose requirements are approved. Produces `specs/{feature}/design.md` with architecture diagrams, interfaces, data models, and error handling.
license: MIT
metadata:
  version: "1.0.0"
  flow: simple
  phase: design
disable-model-invocation: true
---

# Generate Design

## Context Preflight

Load before generating:

| Artifact | Purpose | If missing |
|----------|---------|------------|
| `specs/{feature}/requirements.md` | What the design must satisfy | Stop and tell the user requirements must exist and be approved first |
| `references/design-template.md` (this skill's directory) | Document structure for the design file | Warn and continue using the structure described below |
| `specs/{feature}/design.md` | Existing design, when updating rather than creating | Warn and continue — treat as a new design |

## Purpose

Generate a technical design document based on approved requirements. This is Phase 2 of the spec-driven development workflow.

## Preconditions

- `requirements.md` exists for this feature
- User has explicitly approved the requirements

## Trigger Conditions

- Requirements phase completed and approved
- User requests updates to existing design
- User provides feedback on design document

## Workflow

### Initial Generation

1. **Read requirements** from `specs/{feature}/requirements.md`
2. **Research codebase** if needed:
   - Identify existing patterns and conventions
   - Check existing project standards if available
   - Look for similar implementations to reference
3. **Generate design.md** following the template:
   - Overview (solution approach, tech decisions)
   - Architecture (Mermaid diagram)
   - Components and Interfaces
   - Data Models (with validation rules)
   - Error Handling (recovery strategies)
   - Testing Strategy
4. **Write file** to `specs/{feature}/design.md`
5. **Ask for approval**: "Does the design look good? If so, we can move on to the implementation plan."

### Update Flow

1. **Read existing** `design.md` and `requirements.md`
2. **Apply user feedback** - modify specific sections
3. **Write updated file**
4. **Ask for approval again**

## Critical Rules

1. **Design MUST address ALL requirements**
   - Every requirement from Phase 1 should be covered
   - Trace design decisions back to requirements

2. **Include Architecture Diagram**
   - Use Mermaid syntax for diagrams
   - Show component relationships and data flow

3. **Define Clear Interfaces**
   - Use TypeScript-like syntax for interface definitions
   - Include method signatures with types

4. **Error Handling is Mandatory**
   - Define error types and conditions
   - Specify recovery strategies

5. **Approval Gate**
   - Do NOT proceed to Tasks phase without explicit approval
   - If gaps found, may return to Requirements phase

## Output

- **File**: `specs/{feature-name}/design.md`
- **Approval Prompt**: "Does the design look good? If so, we can move on to the implementation plan."

## Design Sections Checklist

- [ ] Overview (3-5 sentences)
- [ ] Architecture diagram (Mermaid)
- [ ] Architectural principles (2-4 bullet points)
- [ ] Components and interfaces (all major classes/modules)
- [ ] Data models (with TypeScript interfaces)
- [ ] Validation rules (per field)
- [ ] Error handling (by category)
- [ ] Recovery strategies
- [ ] Testing strategy (unit + integration)

## Phase Transitions

**Backward**: If user identifies missing requirements:

- "Let's go back to requirements to add [X]"
- Invoke the `spec-requirements` skill, update, get approval, then return here

**Forward**: On explicit approval:

- Invoke the `spec-tasks` skill to generate the implementation plan

## Template Reference

See `references/design-template.md` in this skill's directory for full template structure.

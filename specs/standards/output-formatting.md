# Output Formatting Standards

Standards for consistent AI agent output formatting across specsmd.

---

## Overview

All AI agents and skills in specsmd MUST follow these output formatting standards. These rules are embedded directly in every skill file to ensure the AI cannot deviate from them.

**Design Principle**: Formatting rules are embedded in each skill file rather than relying on agents reading shared documentation. The AI cannot deviate from rules embedded in the file it must execute.

---

## Core Rules

### 1. No ASCII Tables for Options

**Rule**: 🚫 **NEVER** use ASCII tables for presenting options or choices to users.

**Why**: ASCII tables break at different terminal widths and are harder to read in CLI environments.

**Incorrect**:
```markdown
| # | Option | Description |
|---|--------|-------------|
| 1 | Build | Create artifacts |
| 2 | Deploy | Deploy to env |
```

**Correct**:
```markdown
1 - **Build**: Create artifacts
2 - **Deploy**: Deploy to env
```

### 2. Numbered List Format

**Rule**: ✅ **ALWAYS** use numbered list format: `N - **Option**: Description`

**Format**:
```
{number} - **{option-name}**: {description}
```

**Example**:
```markdown
1 - **requirements**: Gather functional and non-functional requirements
2 - **context**: Define system context and integrations
3 - **units**: Decompose into deployable units
```

### 3. Status Indicators

**Rule**: ✅ **ALWAYS** use consistent status indicators for progress display.

**Indicators**:

- `✅` - **Completed**: Step/task is done
- `⏳` - **In progress**: Currently active step (mark with `← current`)
- `[ ]` - **Not started**: Pending future step
- `🚫` - **Blocked**: Requires human decision
- `⚠️` - **Warning**: Needs attention

**Example**:
```markdown
### Progress

- ✅ Requirements gathered
- ✅ System context defined
- ⏳ Units decomposed ← current
- [ ] Stories created
- [ ] Bolts planned
```

### 4. Suggested Next Step Pattern

**Rule**: ✅ **ALWAYS** end skill outputs with a suggested next step.

**Format**:
```markdown
### Actions

1 - **option1**: Description of first option
2 - **option2**: Description of second option
3 - **option3**: Description of third option

### Suggested Next Step
→ **option1** - Recommended action for `{context}`

**Type a number or press Enter for suggested action.**
```

**Components**:
- **Actions section**: Numbered list of all available options
- **Suggested Next Step**: Arrow (`→`) pointing to recommended option
- **Call-to-action**: Clear instruction for user input

---

## Mandatory Output Rules Section

Every skill file MUST include this section at the top:

```markdown
## Mandatory Output Rules (READ FIRST)

- 🚫 **NEVER** use ASCII tables for options - they break at different terminal widths
- ✅ **ALWAYS** use numbered list format: `N - **Option**: Description`
- ✅ **ALWAYS** use status indicators: ✅ (done) ⏳ (current) [ ] (pending) 🚫 (blocked)
- {skill-specific rules}

## Success Metrics

- ✅ Options presented as numbered list (not table)
- ✅ Progress shown with status indicators
- ✅ {skill-specific success criteria}

## Failure Modes

- ❌ Using ASCII tables for options
- ❌ {skill-specific failure modes}
```

---

## Emoji Conventions

Use these emoji prefixes consistently in Mandatory Rules:

- `🚫` - **Forbidden**: Actions that must never be done
- `✅` - **Required**: Actions that must always be done
- `🛑` - **Stop/Critical**: Critical rules that halt execution
- `📖` - **Read**: File/document reading requirements
- `💾` - **Save/Persist**: Data persistence requirements
- `🎯` - **Goal/Focus**: Primary objectives
- `⛔` - **Human Gate**: Requires explicit human approval

---

## Human Validation Points

When human input is required, format as:

```markdown
### ⏸️ Human Validation Required

> "{question or confirmation request}"

**Options:**
1 - **Continue**: Proceed to next step
2 - **Request changes**: Modify before continuing
3 - **Pause**: Save progress for later
```

For critical decisions (production deployments, etc.):

```markdown
### ⚠️ APPROVAL REQUIRED

> "This action affects production. Confirm to proceed? (yes/no)"
```

---

## Tables in Documentation vs Output

**Important Distinction**:

- **Agent OUTPUT to user**: No ASCII tables (use lists)
- **Documentation/Templates**: Tables are acceptable for reference material

Tables inside ```` ```markdown ```` blocks in skill files are showing *artifact format*, not agent output. These are intentional.

---

## Rationale

1. **CLI Compatibility**: Numbered lists work at any terminal width
2. **Consistency**: Same format across all agents reduces cognitive load
3. **Scannability**: Status indicators are instantly recognizable
4. **Actionability**: Suggested next step guides users forward
5. **Reliability**: Embedded rules prevent AI deviation

---

## Related Standards

- `specs/standards/skill-template.md` - Complete skill file template
- `specs/standards/coding-standards.md` - General coding standards
- `specs/glossary.md` - Term definitions

---

*Last updated: 2025-12-09*

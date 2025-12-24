# Skill File Template

This document defines the standard structure for AI-DLC skill files. All skills MUST follow this template to ensure consistent output formatting across agents.

**Design Decision**: Output formatting rules are embedded directly in each skill file rather than relying on agents reading shared documentation. This ensures consistency because the AI cannot deviate from rules embedded in the file it must execute.

---

## Skill File Structure

Every skill file MUST have these sections in order:

```markdown
# Skill: {Skill Name}

## Mandatory Output Rules (READ FIRST)

{Formatting rules - embedded in every skill}

## Success Metrics

{What correct output looks like}

## Failure Modes

{What to avoid}

---

## Goal

{Single sentence describing what this skill does}

---

## Input

{Required and optional inputs}

---

## Process

{Step-by-step execution instructions}

---

## Output

{Example output showing correct formatting}

---

## Transition

{What happens after skill completes}
```

---

## Mandatory Output Rules Section

Every skill MUST include these rules at the top:

```markdown
## Mandatory Output Rules (READ FIRST)

- 🚫 **NEVER** use ASCII tables for options - they break at different terminal widths
- ✅ **ALWAYS** use numbered list format: `N - **Option**: Description`
- ✅ **ALWAYS** use status indicators: ✅ (done) ⏳ (current) [ ] (pending) 🚫 (blocked)
- {Additional skill-specific rules}

## Success Metrics

- ✅ Options presented as numbered list (not table)
- ✅ Progress shown with status indicators
- ✅ {Skill-specific success criteria}

## Failure Modes

- ❌ Using ASCII table for options
- ❌ Plain list without status indicators
- ❌ {Skill-specific failure modes}
```

---

## Status Indicators

Use these consistently across all skills:

- `✅` - **Completed**: Step/task is done
- `⏳` - **In progress**: Currently active step
- `[ ]` - **Not started**: Pending future step
- `🚫` - **Blocked**: Requires human decision
- `⚠️` - **Warning**: Needs attention

**Note**: Use `✅` for completed items in output displays. Use standard markdown checkboxes `[ ]` for pending items. Use emoji indicators `⏳` and `🚫` for in-progress and blocked states.

---

## Option Formatting

### Correct Format (Numbered List)

```markdown
1 - **Option Name**: Description of what this option does
2 - **Another Option**: Description of this option
3 - **Third Option**: Description of the third option

**Type a number to continue.**
```

### Incorrect Format (ASCII Table)

```markdown
| # | Option | Description |
|---|--------|-------------|
| 1 | Option Name | Description |
| 2 | Another Option | Description |
```

**Why**: ASCII tables break at different terminal widths and are harder to read in CLI environments.

---

## Progress Display

### Correct Format

```markdown
### Progress

- ✅ Step 1 complete
- ✅ Step 2 complete
- ⏳ Step 3 ← current
- [ ] Step 4
- [ ] Step 5
```

Use `✅` for completed items and `[ ]` for pending items. Use `⏳` only for the currently active step.

### Incorrect Format

```markdown
### Progress

- Done: Step 1
- Done: Step 2
- Current: Step 3
- Pending: Step 4
```

**Why**: Checkboxes are universally recognized. The `⏳` indicator clearly marks the active step.

---

## Decision Points

When human input is required:

```markdown
🚫 {Phase/Stage}: BLOCKED

**Decision Required**: {clear description of what's needed}

1 - **Option name**: Description of this option
2 - **Option name**: Description of this option
3 - **Option name**: Description of this option

**Waiting for your input to continue.**
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

---

## Example Skill File

```markdown
# Skill: Example Navigator

## Mandatory Output Rules (READ FIRST)

- 🚫 **NEVER** use ASCII tables for options - they break at different terminal widths
- ✅ **ALWAYS** use numbered list format: `N - **Option**: Description`
- ✅ **ALWAYS** use status indicators: ✅ (done) ⏳ (current) [ ] (pending) 🚫 (blocked)
- 📖 **ALWAYS** load context before presenting menu
- 🚫 **FORBIDDEN** to execute without user selection

## Success Metrics

- ✅ Options presented as numbered list (not table)
- ✅ Progress shown with status indicators
- ✅ Context loaded and displayed

## Failure Modes

- ❌ Using ASCII table for options
- ❌ Plain list without status indicators
- ❌ Executing without user confirmation

---

## Goal

Present available actions and guide user to next step.

---

## Input

- **Required**: `.specsmd/aidlc/memory-bank.yaml` - artifact schema
- **Optional**: `--context` - Additional context parameter

---

## Process

### 1. Load Context

Read project state from memory bank.

### 2. Present Menu

\`\`\`markdown
## Example Agent

### Current State

- ✅ Step 1 complete
- ⏳ Step 2 ← current
- [ ] Step 3

### Actions

1 - **Action One**: Description of first action
2 - **Action Two**: Description of second action
3 - **Action Three**: Description of third action

**Type a number to continue.**
\`\`\`

### 3. Handle Selection

Execute selected action.

---

## Transition

After user selection:
- Load corresponding skill file
- Pass context
- Execute
```

---

## Rationale


1. **Embedded Rules**: Formatting rules are in every skill file, not just a shared doc
2. **Success/Failure Metrics**: Clear criteria for correct vs incorrect output
3. **Emoji Conventions**: Visual markers for quick rule identification
4. **Examples in Every Skill**: Show correct format, not just describe it

The AI cannot deviate from rules embedded in the file it must execute. This ensures consistency across all agents and skills.

---

## Suggested Next Step Pattern

Every skill output MUST end with a suggested next step:

```markdown
### Actions

1 - **option1**: Description of first option
2 - **option2**: Description of second option
3 - **option3**: Description of third option

### Suggested Next Step
→ **option1** - Recommended action for `{context}`

**Type a number or press Enter for suggested action.**
```

This pattern:
- Presents all available options as numbered list
- Highlights the recommended action with `→`
- Provides clear call-to-action for the user

---

*Last updated: 2025-12-09*

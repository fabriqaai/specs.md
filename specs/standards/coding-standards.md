# Coding Standards

Code style and quality standards for specsmd.

---

## Formatting

### Style: No Formatter Enforced

**Rationale**: Project is primarily markdown and simple JavaScript. Consistent style maintained manually.

### Indentation
- JavaScript: 4 spaces
- Markdown: 2 spaces for lists
- YAML: 2 spaces

---

## Naming Conventions

### Files
- **JavaScript**: `camelCase.js` (e.g., `cli-utils.js`, `installer.js`)
- **Classes**: `PascalCase.js` (e.g., `ClaudeInstaller.js`, `InstallerFactory.js`)
- **Markdown**: `kebab-case.md` (e.g., `tech-stack.md`, `bolt-plan.md`)
- **Agents**: `{name}-agent.md` (e.g., `master-agent.md`)
- **Skills**: `{skill-name}.md` (e.g., `analyze-context.md`)

### Variables & Functions
- **Variables**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Functions**: `camelCase`
- **Classes**: `PascalCase`

### Directories
- Lowercase with hyphens (e.g., `bolt-types/`, `skills/`)

---

## File Organization

### Source Structure
```
src/
├── bin/          # CLI entry points
├── lib/          # Core library modules
│   └── installers/   # Tool-specific installers
└── flows/        # SDLC flow implementations
    └── aidlc/    # AI-DLC flow
        ├── agents/   # Agent definitions
        ├── commands/ # Slash commands
        └── .specsmd/ # Runtime assets
            ├── skills/
            └── templates/
```

### Agent File Structure
```markdown
# Agent Name

## Persona
- Role
- Identity
- Communication Style
- Principles

## Critical Actions

## Skills

## Workflow

## Begin
```

### Skill File Structure
```markdown
# Skill: {Name}

## Mandatory Output Rules (READ FIRST)
{Formatting rules - embedded in every skill}

## Success Metrics
{What correct output looks like}

## Failure Modes
{What to avoid}

---

## Goal
{Single sentence purpose}

## Input
{Required and optional inputs}

## Process
{Step-by-step instructions}

## Output
{Example output with correct formatting}

## Transition
{What happens after skill completes}
```

See `specs/standards/skill-template.md` for complete specification.

---

## Testing Strategy

### Current: Manual Testing

**Rationale**: Project is primarily configuration and markdown. Automated testing would require complex setup for minimal benefit.

### Future Consideration
- Integration tests for installer flow
- Validation tests for agent/skill loading

---

## Error Handling

### CLI Errors
- Display user-friendly error messages with chalk colors
- Exit with appropriate exit codes
- Never expose stack traces to end users

### File Operations
- Always check file existence before read
- Create directories recursively with `fs-extra`
- Handle permission errors gracefully

---

## Logging Standards

### Console Output
- Use `chalk` for colored output
- Info: Default color
- Success: Green
- Warning: Yellow/Amber
- Error: Red

### No Debug Logging
- Production code should not include console.log for debugging
- Remove debug statements before commit

---

## Documentation

### Code Comments
- Comment complex logic only
- No redundant comments that restate the code
- Use JSDoc for function signatures in complex utilities

### Markdown Documentation
- Every agent has a `-agent.md` file
- Every skill has a `.md` file
- Templates define artifact structure

---

## Version Control

### Commit Messages
- Use conventional commits style
- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `refactor`, `chore`

### Branch Strategy
- `main` - stable releases
- Feature branches for development

---

## Summary

- **Indentation**: 4 spaces (JS), 2 spaces (MD/YAML)
- **File Naming**: camelCase.js, kebab-case.md
- **Variable Naming**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Classes**: PascalCase
- **Error Handling**: User-friendly messages, proper exit codes
- **Logging**: chalk-colored console output
- **Commits**: Conventional commits

---

## Output Formatting (AI Agents)

Agent and skill outputs MUST follow these rules:

- 🚫 **NEVER** use ASCII tables for options - they break at different terminal widths
- ✅ **ALWAYS** use numbered list format: `N - **Option**: Description`
- ✅ **ALWAYS** use status indicators: ✅ (done) ⏳ (current) [ ] (pending) 🚫 (blocked)
- ✅ **ALWAYS** end with suggested next step pattern

See `specs/standards/output-formatting.md` for complete specification.

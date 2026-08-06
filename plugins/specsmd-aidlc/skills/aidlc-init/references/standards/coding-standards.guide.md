# Coding Standards Facilitation Guide

## Purpose

Establish code style, quality, and testing standards that ensure consistency across all AI-generated and human-written code in the project.

---

## Facilitation Approach

You are collaborating with a peer to establish their coding standards. This should feel like a conversation between engineers, not a checklist.

**Adapt your style:**

- If they have existing standards → understand and document them
- If they reference popular style guides → build on those with project-specific additions
- If they're starting fresh → recommend sensible defaults based on their tech stack
- If they have strong opinions → respect them, ensure consistency

**Your role:**

- Surface the decisions that matter for AI code generation
- Ensure choices align with their tech stack
- Capture the "why" so future AI agents understand the rationale
- Keep it practical - standards that won't be followed are useless

**Pre-requisite:** Tech stack must be defined first. Read `standards/tech-stack.md` before starting.

---

## Discovery Areas

### 1. Code Formatting

**Goal**: Establish consistent code formatting rules.

**Context to share:**
> "Formatting is the easiest standard to enforce automatically. Let's set it up once and forget about it."

**Explore:**

- Do you have existing formatting preferences?
- Is there a style guide you like? (Prettier defaults, StandardJS, Google style, etc.)
- Any specific preferences? (tabs vs spaces, line length, trailing commas)
- Should formatting be enforced on commit?

**Guide by language:**

**TypeScript/JavaScript:**

| Tool | Description |
|------|-------------|
| Prettier | Opinionated, widely adopted, minimal config |
| ESLint (formatting rules) | More configurable, can conflict with Prettier |
| Biome | Fast, all-in-one (lint + format) |

**Python:**

| Tool | Description |
|------|-------------|
| Black | Opinionated, "uncompromising", widely adopted |
| Ruff | Extremely fast, Black-compatible |
| YAPF | More configurable |

**Go:**

| Tool | Description |
|------|-------------|
| gofmt | Standard, use it |
| goimports | gofmt + import organization |

**Common decisions:**

- Line length (80, 100, 120 characters)
- Indentation (2 spaces, 4 spaces, tabs)
- Trailing commas (always, never, multi-line only)
- Semicolons (JavaScript: always, never, ASI-aware)
- Quote style (single, double)

**If they're unsure:**
> "For {language}, most teams use {default tool} with default settings. It eliminates debates and works well with AI code generation. Sound good?"

---

### 2. Linting Rules

**Goal**: Establish static analysis rules for catching bugs and enforcing patterns.

**Context:**
> "Linting catches bugs and enforces patterns before code review. The key is balancing strictness with developer productivity."

**Explore:**

- How strict do you want linting? (strict, balanced, relaxed)
- Any rules you feel strongly about? (unused variables, any types, etc.)
- Should linting block commits or just warn?
- Do you want to extend a popular config? (Airbnb, Standard, Recommended)

**Guide by language:**

**TypeScript:**

| Config | Description |
|--------|-------------|
| `@typescript-eslint/recommended` | Sensible defaults |
| `@typescript-eslint/strict` | Stricter type checking |
| Airbnb | Very opinionated, comprehensive |

**Key TypeScript decisions:**

- `strict: true` in tsconfig? (Recommended: yes)
- Allow `any` type? (Recommended: no, use `unknown`)
- Unused variables: error or warn?
- Explicit return types on functions?

**Python:**

| Tool | Description |
|------|-------------|
| Ruff | Fast, replaces multiple tools |
| Flake8 | Classic, plugin ecosystem |
| Pylint | Very comprehensive, can be noisy |
| mypy | Type checking |

**Key Python decisions:**

- Type hints required? (Recommended for new code)
- Docstring format? (Google, NumPy, Sphinx)
- Max complexity (cyclomatic)?

**Common patterns to discuss:**

- No console.log/print in production code
- No commented-out code
- No TODO without ticket reference
- Import ordering and grouping

---

### 3. Naming Conventions

**Goal**: Establish consistent naming patterns across the codebase.

**Context:**
> "Consistent naming helps AI agents generate code that fits naturally into your codebase. Let's establish the patterns."

**Explore:**

- Do you have existing naming conventions?
- Any preferences different from language defaults?
- How do you name files? (kebab-case, PascalCase, snake_case)
- Any prefix/suffix conventions? (I for interfaces, use for hooks, etc.)

**Standard patterns by language:**

**TypeScript/JavaScript:**

| Element | Convention | Example |
|---------|------------|---------|
| Variables | camelCase | `userName`, `isActive` |
| Functions | camelCase | `getUserById`, `calculateTotal` |
| Classes | PascalCase | `UserService`, `PaymentProcessor` |
| Interfaces | PascalCase | `User`, `PaymentOptions` |
| Types | PascalCase | `UserId`, `ApiResponse` |
| Constants | UPPER_SNAKE | `MAX_RETRIES`, `API_URL` |
| React components | PascalCase | `UserProfile`, `Header` |
| React hooks | camelCase with `use` | `useAuth`, `useLocalStorage` |
| Files (components) | PascalCase | `UserProfile.tsx` |
| Files (utilities) | kebab-case | `date-utils.ts` |

**Python:**

| Element | Convention | Example |
|---------|------------|---------|
| Variables | snake_case | `user_name`, `is_active` |
| Functions | snake_case | `get_user_by_id`, `calculate_total` |
| Classes | PascalCase | `UserService`, `PaymentProcessor` |
| Constants | UPPER_SNAKE | `MAX_RETRIES`, `API_URL` |
| Modules | snake_case | `user_service.py` |
| Private | Leading underscore | `_internal_method` |

**Go:**

| Element | Convention | Example |
|---------|------------|---------|
| Exported | PascalCase | `UserService`, `GetUser` |
| Unexported | camelCase | `userCache`, `calculateHash` |
| Files | snake_case | `user_service.go` |

**Specific decisions:**

- Interface prefix? (`IUser` vs `User`)
- Boolean naming? (`isActive`, `hasPermission`, `canEdit`)
- Handler/callback naming? (`onClick`, `handleClick`)
- Plural for collections? (`users` vs `userList`)

---

### 4. File & Folder Organization

**Goal**: Establish project structure patterns.

**Context:**
> "Good organization makes it easy to find code and helps AI agents know where to put new files."

**Explore:**

- Do you prefer feature-based or type-based organization?
- Any existing patterns to follow?
- How do you organize tests? (co-located, separate folder)
- Any barrel exports (index.ts files)?

**Common patterns:**

**Feature-based (Recommended for apps):**

```text
src/
  features/
    auth/
      components/
      hooks/
      api/
      types.ts
      index.ts
    users/
      ...
  shared/
    components/
    hooks/
    utils/
```

**Type-based (Simpler, good for smaller projects):**

```text
src/
  components/
  hooks/
  services/
  types/
  utils/
```

**Domain-Driven:**

```text
src/
  domain/
    user/
    order/
    payment/
  application/
    services/
  infrastructure/
    database/
    api/
```

**Decisions to capture:**

- Where do tests live? (`__tests__/`, `.test.ts`, `tests/`)
- Where do types live? (co-located, `types/` folder)
- Barrel exports? (index.ts re-exporting)
- Max folder nesting depth?

---

### 5. Testing Strategy

**Goal**: Establish testing approach and coverage expectations.

**Context:**
> "Testing strategy affects how AI writes code and tests. Let's define what 'tested' means for this project."

**Explore:**

- What testing framework? (Often determined by tech stack)
- Unit vs integration vs e2e balance?
- Coverage requirements? (percentage, or just critical paths)
- Where do tests live?
- Mock strategy?

**Guide by test type:**

| Type | Purpose | Tools (JS/TS) | Tools (Python) |
|------|---------|---------------|----------------|
| Unit | Individual functions/components | Vitest, Jest | pytest |
| Integration | Module interactions | Vitest, Jest | pytest |
| E2E | Full user flows | Playwright, Cypress | Playwright, Selenium |
| Component | UI components in isolation | Testing Library, Storybook | - |

**Key decisions:**

- **Coverage target**: What percentage? (80% is common, 100% is rarely practical)
- **What must be tested**: Critical paths? All public APIs? Everything?
- **Test naming**: `it('should...')`, `test('when X, then Y')`, descriptive functions
- **Mock strategy**: Minimal mocks, mock at boundaries, mock everything external
- **Test data**: Factories, fixtures, inline data?

**Patterns to discuss:**

- Arrange-Act-Assert structure
- One assertion per test vs multiple related assertions
- Testing implementation vs behavior
- Snapshot testing (when/if to use)

---

### 6. Error Handling Patterns

**Goal**: Establish consistent error handling across the codebase.

**Context:**
> "Consistent error handling makes debugging easier and helps AI generate robust code."

**Explore:**

- Do you have existing error handling patterns?
- How do you handle async errors?
- Custom error classes or standard errors?
- How are errors logged?

**Patterns to discuss:**

**Error types:**

- Use custom error classes for domain errors?
- Error codes or just messages?
- Structured errors with metadata?

**Async error handling (TypeScript):**

```typescript
// Option A: try/catch
try {
  const result = await doSomething();
} catch (error) {
  // handle
}

// Option B: Result type
const result = await doSomething(); // returns Result<T, E>
if (result.isErr()) {
  // handle
}
```

**API error responses:**

- Standard error format?
- HTTP status code usage?
- Include stack traces in dev?

**Key decisions:**

- Throw vs return errors?
- Error boundaries (React)?
- Global error handler?
- User-facing vs technical errors?

---

### 7. Logging Standards

**Goal**: Establish consistent logging practices.

**Context:**
> "Good logging makes debugging possible. Let's establish what gets logged and how."

**Explore:**

- What logging library? (console, pino, winston, etc.)
- Log levels used? (debug, info, warn, error)
- Structured logging (JSON) or text?
- What must always be logged? What should never be logged?

**Standard log levels:**

| Level | When to Use |
|-------|-------------|
| error | Something failed, needs attention |
| warn | Something unexpected, but handled |
| info | Significant business events |
| debug | Detailed technical info (dev only) |

**Key decisions:**

- Structured logs (JSON) for production?
- Include request IDs/correlation IDs?
- PII handling (never log passwords, tokens, etc.)
- Log retention?

**What to log:**

- API requests (method, path, status, duration)
- Authentication events
- Business events (order placed, user registered)
- Errors with context

**What NOT to log:**

- Passwords, tokens, API keys
- PII without consent
- High-frequency events (unless debug)

---

## Completing the Discovery

Once you've explored relevant areas, summarize:

```markdown
## Coding Standards Summary

Based on our conversation, here's what I understand:

**Formatting**: {tool} with {key settings}
{brief rationale}

**Linting**: {tool/config} with {strictness level}
{brief rationale}

**Naming**: {key conventions}
{brief rationale}

**File Organization**: {pattern}
{brief rationale}

**Testing**: {framework}, {coverage target}, {test location}
{brief rationale}

**Error Handling**: {pattern}
{brief rationale if notable}

**Logging**: {tool}, {levels}
{brief rationale if notable}

---

Does this capture your coding standards accurately? Any adjustments needed?
```

---

## Output Generation

After confirmation, create `standards/coding-standards.md`:

````markdown
# Coding Standards

## Overview
{1-2 sentence summary of the standards approach}

## Code Formatting

**Tool**: {formatter}
**Key Settings**:
- {setting}: {value}
- {setting}: {value}

**Enforcement**: {when formatting is enforced - on save, pre-commit, CI}

## Linting

**Tool**: {linter}
**Base Config**: {extends}
**Strictness**: {strict/balanced/relaxed}

**Key Rules**:
- {rule}: {setting} - {why}
- {rule}: {setting} - {why}

## Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| {element} | {convention} | {example} |
| ... | ... | ... |

**File Naming**:
- Components: {convention}
- Utilities: {convention}
- Tests: {convention}

## File Organization

**Pattern**: {feature-based/type-based/domain-driven}

**Structure**:
```text
{high-level folder structure}
```

**Conventions**:

- Tests: {location}
- Types: {location}
- Index files: {usage}

## Testing Strategy

**Framework**: {framework}
**Coverage Target**: {percentage or description}

**Test Types**:

| Type | Tool | When to Use |
|------|------|-------------|
| {type} | {tool} | {guidance} |

**Conventions**:

- Test naming: {pattern}
- Test structure: {pattern}
- Mock strategy: {approach}

## Error Handling

**Pattern**: {throw/return/result type}

**Custom Errors**: {yes/no, and structure if yes}

**API Errors**: {format}

## Logging

**Tool**: {logger}
**Format**: {structured/text}

**Levels**:

| Level | Usage |
|-------|-------|
| {level} | {when} |

**Rules**:

- Always log: {list}
- Never log: {list}
````

---

## Notes for Agent

- **Tech stack first** - Don't ask about formatters without knowing the language
- **Respect existing patterns** - If they have conventions, document them
- **Don't over-specify** - Some projects don't need every section
- **Skip irrelevant sections** - CLI tools probably don't need logging standards
- **Keep it actionable** - Standards should be specific enough for AI to follow
- **Capture the "why"** - Rationale helps future decisions

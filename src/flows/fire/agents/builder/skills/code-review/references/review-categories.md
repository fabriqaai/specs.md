# Code Review Categories

This reference defines what the code-review skill checks for in each category.

---

## 1. Code Quality

Issues related to code cleanliness and maintainability.

### Auto-Fixable

| Issue | Detection | Fix |
|-------|-----------|-----|
| Unused imports | Import not referenced in file | Remove import |
| Unused variables | Variable declared but never used | Remove declaration |
| Console statements | `console.log`, `console.debug`, `print()` | Remove statement |
| Commented-out code | Large blocks of commented code | Remove comments |
| Trailing whitespace | Whitespace at end of lines | Trim whitespace |
| Missing semicolons | JS/TS without semicolons (if project uses them) | Add semicolons |
| Inconsistent quotes | Mixed single/double quotes | Standardize |
| Empty blocks | Empty if/else/try/catch with no comment | Add TODO comment |
| Debugger statements | `debugger` keyword | Remove statement |

### Requires Confirmation

| Issue | Detection | Why Confirm |
|-------|-----------|-------------|
| Long functions | Function > 50 lines | Requires judgment on how to split |
| Deep nesting | > 4 levels of nesting | Multiple valid refactoring approaches |
| Duplicate code | Similar code blocks (>10 lines) | May be intentional |
| Magic numbers | Hardcoded numbers without context | Need to understand meaning |
| Complex conditionals | Complex boolean expressions | May need domain knowledge |

---

## 2. Security

Issues that could lead to security vulnerabilities.

### Auto-Fixable

| Issue | Detection | Fix |
|-------|-----------|-----|
| Hardcoded localhost | `localhost` or `127.0.0.1` in production code | Flag but usually intentional |

### Requires Confirmation (ALWAYS)

| Issue | Detection | Risk |
|-------|-----------|------|
| Hardcoded secrets | API keys, passwords, tokens in code | Critical - secrets exposure |
| SQL injection | String concatenation in SQL queries | Critical - data breach |
| XSS vulnerabilities | Unescaped user input in HTML | High - script injection |
| Command injection | User input in shell commands | Critical - RCE |
| Path traversal | User input in file paths | High - unauthorized access |
| Missing input validation | User input used without validation | Medium - various attacks |
| Insecure crypto | Weak algorithms (MD5, SHA1 for passwords) | High - broken encryption |
| CORS misconfiguration | `Access-Control-Allow-Origin: *` | Medium - CSRF |
| Missing auth checks | Endpoints without authentication | High - unauthorized access |
| Sensitive data in logs | PII, passwords logged | Medium - data leak |

---

## 3. Architecture

Issues related to code organization and design.

### Auto-Fixable

| Issue | Detection | Fix |
|-------|-----------|-----|
| Import order | Imports not grouped/sorted | Sort imports |

### Requires Confirmation (ALWAYS)

| Issue | Detection | Why Confirm |
|-------|-----------|-------------|
| Wrong layer | Business logic in controller, DB in UI | Requires understanding architecture |
| Missing error handling | No try/catch for async/IO operations | May be intentional propagation |
| Tight coupling | Direct dependencies on concrete classes | Multiple valid solutions |
| Missing abstraction | Repeated patterns that could be extracted | Judgment on when to abstract |
| Circular dependencies | Module A imports B, B imports A | Requires refactoring design |
| God class/function | Class/function doing too many things | Domain knowledge needed |
| Inconsistent patterns | Different approaches for same problem | Need to pick canonical approach |
| Missing logging | No logging for important operations | Need to understand what matters |
| Synchronous blocking | Blocking calls in async context | May need architecture change |

---

## 4. Testing

Issues related to test quality and coverage.

### Auto-Fixable

| Issue | Detection | Fix |
|-------|-----------|-----|
| Console in tests | `console.log` in test files | Remove statement |

### Requires Confirmation (ALWAYS)

| Issue | Detection | Why Confirm |
|-------|-----------|-------------|
| Missing tests | New function without corresponding test | Need to understand what to test |
| Missing edge cases | Tests only cover happy path | Need domain knowledge |
| Brittle tests | Tests rely on implementation details | Multiple valid approaches |
| Missing assertions | Test runs but doesn't assert | May be setup test |
| Test coverage gaps | Lines not covered by tests | Need to prioritize |
| Flaky test patterns | Random data, timing dependencies | Need to understand intent |
| Missing error tests | No tests for error conditions | Need to identify error cases |
| Mock overuse | Everything mocked, no integration | Judgment on test strategy |

---

## Language-Specific Checks

### JavaScript/TypeScript

| Issue | Category | Auto-Fix |
|-------|----------|----------|
| `var` instead of `let/const` | Quality | Yes |
| `==` instead of `===` | Quality | Yes (with caution) |
| Missing `await` | Quality | Confirm |
| `any` type usage | Quality | Confirm |
| Missing null checks | Security | Confirm |

### Go

| Issue | Category | Auto-Fix |
|-------|----------|----------|
| Ignored error returns | Quality | Confirm |
| Naked returns | Quality | Confirm |
| Empty interface{} | Quality | Confirm |
| Missing context | Architecture | Confirm |

### Python

| Issue | Category | Auto-Fix |
|-------|----------|----------|
| Bare except | Quality | Confirm |
| Mutable default args | Quality | Confirm |
| Missing type hints | Quality | Confirm |
| `import *` | Quality | Yes |

---

## Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| **Critical** | Security vulnerability, data loss risk | MUST address |
| **High** | Significant quality/maintainability issue | SHOULD address |
| **Medium** | Best practice violation | CONSIDER addressing |
| **Low** | Minor style/preference issue | OPTIONAL |

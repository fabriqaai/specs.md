# Auto-Fix Rules

This reference defines the criteria for determining whether an issue can be auto-fixed or requires user confirmation.

---

## Decision Framework

```
CAN AUTO-FIX if ALL of these are true:
├── Change is mechanical (not semantic)
├── Change follows existing pattern in codebase
├── Change has no functional impact
├── Change is universally agreed best practice
├── Reverting is trivial if wrong
└── Tests will still pass (verified after fix)

MUST CONFIRM if ANY of these are true:
├── Change affects behavior/functionality
├── Change requires judgment call
├── Change involves security implications
├── Change affects public API
├── Multiple valid approaches exist
├── Change is significant (>10 lines affected)
└── Change could break dependent code
```

---

## Auto-Fix Criteria by Category

### 1. Removal Operations (SAFE)

These can be auto-fixed because removal of unused code has no functional impact:

| Operation | Criteria | Safe Because |
|-----------|----------|--------------|
| Remove unused import | Import not referenced anywhere | No runtime effect |
| Remove unused variable | Variable never read | No runtime effect |
| Remove console.log | Debug statement | No production effect |
| Remove console.debug | Debug statement | No production effect |
| Remove debugger | Debug statement | No production effect |
| Remove trailing whitespace | Whitespace only | No code effect |
| Remove empty lines (excess) | >2 consecutive blank lines | Formatting only |

### 2. Formatting Operations (SAFE)

These can be auto-fixed because they don't change semantics:

| Operation | Criteria | Safe Because |
|-----------|----------|--------------|
| Sort imports | Reorder import statements | No runtime effect |
| Standardize quotes | Use project's quote style | String value unchanged |
| Add missing semicolons | Project uses semicolons | Parser handles both |
| Fix indentation | Match project indent style | Whitespace only |
| Add trailing newline | File doesn't end with newline | POSIX standard |

### 3. Simple Substitutions (SAFE with verification)

These can be auto-fixed but require test verification:

| Operation | Criteria | Verify |
|-----------|----------|--------|
| `var` → `const` | Variable never reassigned | Run tests |
| `var` → `let` | Variable is reassigned | Run tests |
| `==` → `===` | Comparing same types | Run tests |
| `!=` → `!==` | Comparing same types | Run tests |

---

## Must-Confirm Criteria

### 1. Behavioral Changes

Any change that could affect runtime behavior:

| Change | Why Confirm |
|--------|-------------|
| Add null check | Changes control flow |
| Add try/catch | Changes error handling |
| Add validation | May reject valid input |
| Change function signature | Affects callers |
| Add/remove async | Changes execution model |
| Modify return value | Affects callers |

### 2. Security Changes

All security-related changes require confirmation:

| Change | Why Confirm |
|--------|-------------|
| Add input validation | May have false positives |
| Add authentication | May break intended access |
| Add authorization | May be too restrictive |
| Change crypto | May have compatibility issues |
| Add rate limiting | May affect legitimate users |

### 3. Architectural Changes

Changes affecting code structure:

| Change | Why Confirm |
|--------|-------------|
| Extract function | Multiple valid ways |
| Move code to different file | Affects imports |
| Add abstraction layer | Judgment on necessity |
| Change dependency injection | Affects instantiation |
| Modify error propagation | Affects error handling chain |

### 4. Size Threshold

Changes affecting many lines:

| Threshold | Action |
|-----------|--------|
| 1-5 lines | Can auto-fix if mechanical |
| 6-10 lines | Prefer confirmation |
| >10 lines | Must confirm |

---

## Rollback Protocol

If auto-fix causes test failure:

```
1. Immediately revert ALL auto-fix changes
2. Move the fix to CONFIRM category
3. Report: "Auto-fix for X caused test failure, moved to suggestions"
4. Continue with remaining auto-fixes
5. Re-run tests after each batch
```

---

## Project-Specific Overrides

The project can customize auto-fix behavior in `.specs-fire/standards/coding-standards.md`:

```yaml
# In coding-standards.md frontmatter
auto_fix:
  allow:
    - unused_imports
    - console_statements
    - trailing_whitespace
  deny:
    - quote_style  # Team prefers manual control
    - semicolons   # Mixed codebase

  # Custom patterns to auto-remove
  remove_patterns:
    - "// TODO: remove"
    - "// DEBUG"
```

If `auto_fix` section exists, respect project preferences.
If not specified, use default rules from this document.

---

## Examples

### Auto-Fix Example

**Before:**

```javascript
import { unused } from './module';  // unused import
import { used } from './other';

function process() {
  console.log('debug');  // debug statement
  const result = used();
  return result;
}
```

**After (auto-fixed):**

```javascript
import { used } from './other';

function process() {
  const result = used();
  return result;
}
```

**Report:**

- Removed unused import `unused` from `./module`
- Removed console.log statement

### Confirm Example

**Issue Detected:**

```javascript
function getUser(id) {
  return db.query(`SELECT * FROM users WHERE id = ${id}`);
}
```

**Suggested Fix:**

```javascript
function getUser(id) {
  return db.query('SELECT * FROM users WHERE id = ?', [id]);
}
```

**Why Confirm:**

- Security fix (SQL injection)
- Changes how query is constructed
- May have edge cases with ID format
- Requires understanding of db.query API

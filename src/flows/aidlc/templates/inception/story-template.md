# Story Template

Use this template when creating individual story files during story creation.

---

## Frontmatter

```yaml
---
id: {SSS}-{title-slug}
unit: {UUU}-{unit-name}
intent: {NNN}-{intent-name}
status: draft
priority: must|should|could
created: {YYYY-MM-DDTHH:MM:SSZ}
assigned_bolt: null
implemented: false
---
```

---

## Content

```markdown
# Story: {SSS}-{title-slug}

## User Story

**As a** {user role}
**I want** {goal/action}
**So that** {benefit/reason}

## Acceptance Criteria

- [ ] **Given** {precondition}, **When** {action}, **Then** {expected outcome}
- [ ] **Given** {precondition}, **When** {action}, **Then** {expected outcome}
- [ ] **Given** {precondition}, **When** {action}, **Then** {expected outcome}

## Technical Notes

{Implementation hints, constraints, or considerations}

## Dependencies

### Requires
- {Other stories this depends on, or "None"}

### Enables
- {Stories that depend on this, or "None"}

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| {edge case 1} | {behavior} |
| {edge case 2} | {behavior} |

## Out of Scope

- {What this story does NOT cover}
```

---

## Priority Levels

| Priority | Meaning | Criteria |
|----------|---------|----------|
| `must` | Required for MVP | System unusable without this |
| `should` | Important | Significant value, not blocking |
| `could` | Nice to have | Enhances experience |

---

## Status Values

| Status | Meaning |
|--------|---------|
| `draft` | Story written, needs review |
| `ready` | Reviewed, ready for bolt |
| `in-progress` | Being implemented in a bolt |
| `implemented` | Code complete |
| `tested` | Tests passing |
| `done` | All acceptance criteria met |

---

## Example

```yaml
---
id: 001-user-signup
unit: 001-auth-service
intent: 001-user-authentication
status: ready
priority: must
created: 2024-12-05T10:00:00Z
assigned_bolt: 001-auth-service
implemented: false
---
```

```markdown
# Story: 001-user-signup

## User Story

**As a** new user
**I want** to register with my email and password
**So that** I can access the application

## Acceptance Criteria

- [ ] **Given** I am on the registration page, **When** I enter valid email and password, **Then** my account is created and I receive a confirmation email
- [ ] **Given** I enter an email that already exists, **When** I submit registration, **Then** I see an error message "Email already registered"
- [ ] **Given** I enter a password less than 8 characters, **When** I submit, **Then** I see validation error

## Technical Notes

- Password must be hashed with bcrypt (cost factor 12)
- Email validation should use RFC 5322 compliant regex
- Rate limit registration to 5 attempts per IP per hour

## Dependencies

### Requires
- None (first story)

### Enables
- 002-user-login (User login)
- 003-email-verification (Email verification)

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| SQL injection in email | Safely escaped, validation fails |
| Very long email (255+ chars) | Validation error |
| Unicode in password | Allowed, properly encoded |

## Out of Scope

- Social login (OAuth) - separate story
- Password reset - separate story
```

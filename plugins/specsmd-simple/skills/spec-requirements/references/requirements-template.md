# Requirements Template

Use this template when generating requirements.md for a feature spec.

---

```markdown
# Requirements Document

## Introduction

[2-3 sentences summarizing the feature and its purpose. What problem does it solve? Who benefits from this feature?]

## Glossary

- **[System_Name]**: [Definition of the main system/component being built]
- **[Term_1]**: [Domain-specific term definition]
- **[Term_2]**: [Domain-specific term definition]
- **[Term_3]**: [Domain-specific term definition]

[Include 3-10 domain-specific terms that will be used consistently in acceptance criteria]

## Requirements

### Requirement 1

**User Story:** As a [role], I want [feature/capability], so that [benefit/value]

#### Acceptance Criteria

1. WHEN [trigger event occurs], THE [System_Name] SHALL [expected response/action]
2. WHILE [condition is true], THE [System_Name] SHALL [continuous behavior]
3. IF [error/unwanted condition], THEN THE [System_Name] SHALL [recovery/handling action]
4. WHERE [optional feature is enabled], THE [System_Name] SHALL [conditional behavior]

### Requirement 2

**User Story:** As a [role], I want [feature/capability], so that [benefit/value]

#### Acceptance Criteria

1. WHEN [trigger], THE [System_Name] SHALL [response]
2. [Additional EARS-format criteria...]

### Requirement 3

[Continue pattern for 3-7 total requirements]

```

---

## EARS Format Reference

EARS (Easy Approach to Requirements Syntax) patterns:

| Pattern | Format | Use When |
|---------|--------|----------|
| **Ubiquitous** | THE [system] SHALL [response] | Always true behavior |
| **Event-driven** | WHEN [trigger], THE [system] SHALL [response] | Response to events |
| **State-driven** | WHILE [condition], THE [system] SHALL [response] | Behavior during state |
| **Unwanted** | IF [condition], THEN THE [system] SHALL [response] | Error handling |
| **Optional** | WHERE [option], THE [system] SHALL [response] | Feature flags |
| **Complex** | [WHERE] [WHILE] [WHEN/IF] THE [system] SHALL [response] | Combined conditions |

## INCOSE Quality Rules

Before finalizing requirements, verify each criterion passes these checks:

| Rule | Check | Bad Example | Good Example |
|------|-------|-------------|--------------|
| **Singular** | One capability per criterion (no "and") | "System SHALL log and notify" | "System SHALL log" + "System SHALL notify" |
| **Complete** | All conditions stated | "System SHALL respond quickly" | "System SHALL respond within 200ms" |
| **Verifiable** | Can be tested/measured | "System SHALL be user-friendly" | "System SHALL complete checkout in ≤3 clicks" |
| **Unambiguous** | Only one interpretation | "System SHALL handle large files" | "System SHALL handle files up to 100MB" |
| **Consistent** | No conflicts with other requirements | Req 1: "Always online" + Req 2: "Offline mode" | Reconcile or clarify conditions |

## Guidelines

1. **Use glossary terms consistently** - Every system/component mentioned should be defined in glossary
2. **2-5 acceptance criteria per requirement** - Not too few, not too many
3. **Active voice** - "System SHALL display" not "Message is displayed"
4. **No vague terms** - Avoid "quickly", "adequate", "user-friendly"
5. **Measurable criteria** - Include specific values where possible
6. **One thought per criterion** - Break complex behaviors into multiple criteria

# Requirements Template

Use this template when documenting requirements for an intent.

---

## Frontmatter

```yaml
---
intent: {NNN}-{intent-name}
phase: inception
status: draft|in-progress|complete
created: {YYYY-MM-DDTHH:MM:SSZ}
updated: {YYYY-MM-DDTHH:MM:SSZ}
---
```

Note: All naming is derived from folder names. No prefix field needed.

---

## Content

```markdown
# Requirements: {Intent Name}

## Intent Overview

{High-level description of what this intent aims to achieve}

## Business Goals

| Goal | Success Metric | Priority |
|------|----------------|----------|
| {Goal 1} | {How to measure success} | Must |
| {Goal 2} | {How to measure success} | Should |

---

## Functional Requirements

### FR-1: {Requirement Title}
- **Description**: {What the system must do}
- **Acceptance Criteria**: {Measurable conditions for success}
- **Priority**: Must/Should/Could
- **Related Stories**: {Story IDs when defined}

### FR-2: {Requirement Title}
- **Description**: {What the system must do}
- **Acceptance Criteria**: {Measurable conditions for success}
- **Priority**: Must/Should/Could
- **Related Stories**: {Story IDs when defined}

---

## Non-Functional Requirements

### Performance
| Requirement | Metric | Target |
|-------------|--------|--------|
| Response Time | p95 latency | < 200ms |
| Throughput | Requests/second | > 1000 |

### Scalability
| Requirement | Metric | Target |
|-------------|--------|--------|
| Concurrent Users | Active sessions | 10,000 |
| Data Volume | Records | 10M+ |

### Security
| Requirement | Standard | Notes |
|-------------|----------|-------|
| Authentication | OAuth 2.0 / JWT | {details} |
| Authorization | RBAC | {details} |
| Data Protection | AES-256 | {details} |

### Reliability
| Requirement | Metric | Target |
|-------------|--------|--------|
| Availability | Uptime | 99.9% |
| Recovery | RTO | < 1 hour |

### Compliance
| Requirement | Standard | Notes |
|-------------|----------|-------|
| {Regulation} | {Standard} | {details} |

---

## Constraints

### Technical Constraints

**Project-wide standards**: Required standards will be loaded from memory-bank standards folder by Construction Agent

**Intent-specific constraints** (only list constraints unique to this feature):
- {Constraint specific to this intent, not covered by standards}

### Business Constraints
- {Constraint 1: e.g., budget limitation}
- {Constraint 2: e.g., timeline requirement}

---

## Assumptions

| Assumption | Risk if Invalid | Mitigation |
|------------|-----------------|------------|
| {Assumption 1} | {What happens if wrong} | {How to mitigate} |
| {Assumption 2} | {What happens if wrong} | {How to mitigate} |

---

## Open Questions

| Question | Owner | Due Date | Resolution |
|----------|-------|----------|------------|
| {Question 1} | {Who} | {When} | {Pending/Resolved} |
```

---

## Priority Definitions

| Priority | Meaning |
|----------|---------|
| **Must** | Required for MVP, system unusable without |
| **Should** | Important, significant value but not blocking |
| **Could** | Nice to have, enhances experience |
| **Won't** | Out of scope for this intent |

---

## Requirement Quality Checklist

Before marking requirements complete, verify:

- [ ] All requirements are testable (measurable, not vague)
- [ ] Acceptance criteria are binary (pass/fail)
- [ ] NFRs have specific metrics and targets
- [ ] Dependencies are identified
- [ ] Constraints are documented
- [ ] Assumptions are stated and risks assessed

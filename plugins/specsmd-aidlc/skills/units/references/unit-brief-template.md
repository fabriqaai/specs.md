# Unit Brief Template

Use this template when creating unit briefs during decomposition. This is the **critical input for Construction**.

---

## Frontmatter

```yaml
---
unit: {UUU}-{unit-name}
intent: {NNN}-{intent-name}
phase: inception
status: draft|ready
created: {YYYY-MM-DDTHH:MM:SSZ}
updated: {YYYY-MM-DDTHH:MM:SSZ}
---
```

**Note**: The `unit` field uses the full folder name including the 3-digit prefix (e.g., `001-auth-service`). This matches the folder structure and enables direct path construction in scripts. Story naming uses the story title (e.g., `001-user-signup.md`).

---

## Content

```markdown
# Unit Brief: {Unit Name}

## Purpose

{Clear, concise statement of what this unit does and why it exists}

## Scope

### In Scope
- {What this unit IS responsible for}
- {What this unit IS responsible for}

### Out of Scope
- {What this unit is NOT responsible for}
- {What other units handle}

---

## Assigned Requirements

**These FRs from the intent are assigned to this unit. Stories will be created from these.**

| FR | Requirement | Priority |
|----|-------------|----------|
| FR-{n} | {description from intent requirements.md} | Must/Should/Could |

---

## Domain Concepts

### Key Entities
| Entity | Description | Attributes |
|--------|-------------|------------|
| {Entity 1} | {What it represents} | {Key properties} |
| {Entity 2} | {What it represents} | {Key properties} |

### Key Operations
| Operation | Description | Inputs | Outputs |
|-----------|-------------|--------|---------|
| {Operation 1} | {What it does} | {Input data} | {Output data} |
| {Operation 2} | {What it does} | {Input data} | {Output data} |

---

## Story Summary

| Metric | Count |
|--------|-------|
| Total Stories | {n} |
| Must Have | {n} |
| Should Have | {n} |
| Could Have | {n} |

### Stories

| Story ID | Title | Priority | Status |
|----------|-------|----------|--------|
| {story-1} | {Title} | Must | Planned |
| {story-2} | {Title} | Should | Planned |

---

## Dependencies

### Depends On
| Unit | Reason |
|------|--------|
| {unit-name} | {Why this dependency exists} |

### Depended By
| Unit | Reason |
|------|--------|
| {unit-name} | {Why they depend on this} |

### External Dependencies
| System | Purpose | Risk |
|--------|---------|------|
| {External system} | {Why needed} | {Risk level} |

---

## Technical Context

### Suggested Technology
{Recommendations based on tech stack standards}

### Integration Points
| Integration | Type | Protocol |
|-------------|------|----------|
| {System/Unit} | API/Event/DB | REST/GraphQL/Kafka |

### Data Storage
| Data | Type | Volume | Retention |
|------|------|--------|-----------|
| {Data type} | SQL/NoSQL/Cache | {Volume} | {Retention} |

---

## Constraints

- {Technical constraint specific to this unit}
- {Business constraint specific to this unit}

---

## Success Criteria

### Functional
- [ ] {Criterion 1: What must work}
- [ ] {Criterion 2: What must work}

### Non-Functional
- [ ] {Performance target}
- [ ] {Security requirement}

### Quality
- [ ] Code coverage > 80%
- [ ] All acceptance criteria met
- [ ] Code reviewed and approved

---

## Bolt Suggestions

Based on stories and complexity:

| Bolt | Type | Stories | Objective |
|------|------|---------|-----------|
| bolt-{unit}-1 | DDD | S1, S2 | Core entities |
| bolt-{unit}-2 | DDD | S3, S4 | API layer |

---

## Notes

{Any additional context, risks, or considerations for Construction}
```

---

## Quality Checklist

Before marking unit brief as ready:

- [ ] Purpose is clear and specific
- [ ] Scope boundaries are defined
- [ ] Key entities identified
- [ ] Stories assigned to this unit
- [ ] Dependencies mapped
- [ ] Success criteria are measurable
- [ ] Bolt suggestions provided

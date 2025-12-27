---
unit: privacy-documentation
intent: 007-installer-analytics
phase: inception
status: complete
created: 2025-12-28T12:00:00Z
updated: 2025-12-28T12:30:00Z
---

# Unit Brief: Privacy Documentation

## Purpose

Create and maintain privacy documentation that discloses data collection practices and provides opt-out instructions for users.

## Scope

### In Scope
- PRIVACY.md file at repository root
- Analytics section in README.md
- Data collection disclosure
- Opt-out instructions

### Out of Scope
- Legal review (out of scope for this project)
- Cookie policy (no cookies used)
- Terms of service

---

## Assigned Requirements

**These FRs from the intent are assigned to this unit. Stories will be created from these.**

| FR | Requirement | Priority |
|----|-------------|----------|
| FR-7.1 | Repository SHALL include PRIVACY.md at root | Must |
| FR-7.2 | Privacy documentation SHALL disclose what data is collected | Must |
| FR-7.3 | Privacy documentation SHALL explain how to opt-out | Must |
| FR-7.4 | Privacy documentation SHALL state legal basis | Must |
| FR-7.5 | Privacy documentation SHALL confirm no PII collected | Must |
| FR-7.6 | README SHALL reference privacy documentation | Must |

---

## Domain Concepts

### Key Entities
| Entity | Description | Attributes |
|--------|-------------|------------|
| PRIVACY.md | Privacy policy document | Data collected, opt-out methods, legal basis |
| README section | Analytics disclosure | Brief summary, opt-out command, link to PRIVACY.md |

### Key Operations
| Operation | Description | Inputs | Outputs |
|-----------|-------------|--------|---------|
| Create PRIVACY.md | Write privacy policy | Data collection list | PRIVACY.md file |
| Update README | Add analytics section | Privacy summary | README section |

---

## Story Summary

| Metric | Count |
|--------|-------|
| Total Stories | 2 |
| Must Have | 2 |
| Should Have | 0 |
| Could Have | 0 |

### Stories

| Story ID | Title | Priority | Status |
|----------|-------|----------|--------|
| 001 | Create PRIVACY.md with data disclosure | Must | Complete |
| 002 | Add analytics section to README | Must | Planned |

---

## Dependencies

### Depends On
| Unit | Reason |
|------|--------|
| None | Documentation only |

### Depended By
| Unit | Reason |
|------|--------|
| None | Standalone documentation |

### External Dependencies
| System | Purpose | Risk |
|--------|---------|------|
| None | N/A | N/A |

---

## Technical Context

### Suggested Technology
- Markdown files
- No code required

### Integration Points
| Integration | Type | Protocol |
|-------------|------|----------|
| None | N/A | N/A |

### Data Storage
| Data | Type | Volume | Retention |
|------|------|--------|-----------|
| None | N/A | N/A | N/A |

---

## Constraints

- Must be accurate and match actual data collection
- Must be easy to understand for non-technical users
- README section should be at the bottom (before license)

---

## Success Criteria

### Functional
- [x] PRIVACY.md exists at repository root
- [x] PRIVACY.md lists all collected data points
- [x] PRIVACY.md explains opt-out methods
- [x] PRIVACY.md states legal basis (legitimate interest)
- [ ] README.md references PRIVACY.md
- [ ] README.md shows quick opt-out command

### Non-Functional
- [ ] Documentation is clear and concise
- [ ] No legal jargon

### Quality
- [ ] Reviewed for accuracy against implementation

---

## Bolt Suggestions

Based on stories and complexity:

| Bolt | Type | Stories | Objective |
|------|------|---------|-----------|
| bolt-privacy-documentation-1 | simple-construction-bolt | All | Complete documentation |

---

## Notes

- PRIVACY.md was created during Inception phase
- README update pending - will be done with analytics-tracker integration
- This unit is mostly complete, just needs README update

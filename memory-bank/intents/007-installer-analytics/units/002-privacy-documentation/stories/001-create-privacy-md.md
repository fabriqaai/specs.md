---
id: 007-privacy-story-1
unit: privacy-documentation
intent: 007-installer-analytics
status: done
priority: must
created: 2025-12-28T12:00:00Z
assigned_bolt: bolt-privacy-documentation-1
implemented: true
---

# Story: Create PRIVACY.md with Data Disclosure

## User Story

**As a** user who wants to understand data collection
**I want** to read a clear privacy policy
**So that** I can make informed decisions about using specsmd

## Acceptance Criteria

- [x] **Given** user visits the repository, **When** they look for privacy info, **Then** PRIVACY.md exists at root
- [x] **Given** user reads PRIVACY.md, **When** they check what's collected, **Then** all data points are listed
- [x] **Given** user reads PRIVACY.md, **When** they want to opt-out, **Then** clear instructions are provided
- [x] **Given** user reads PRIVACY.md, **When** they check legal basis, **Then** legitimate interest is stated
- [x] **Given** user reads PRIVACY.md, **When** they check for PII, **Then** it confirms no PII is collected

## Technical Notes

- PRIVACY.md was created during Inception phase
- Located at repository root: `/PRIVACY.md`
- Contains:
  - What data is collected
  - What is NOT collected
  - Opt-out methods
  - Legal basis statement

## Dependencies

### Requires

- None

### Enables

- 002-add-readme-section

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| N/A | Documentation only |

## Out of Scope

- Legal review
- Cookie policy (no cookies)
- Terms of service

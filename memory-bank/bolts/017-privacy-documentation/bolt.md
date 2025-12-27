---
id: 017-privacy-documentation
unit: privacy-documentation
intent: 007-installer-analytics
type: simple-construction-bolt
status: complete
stories:
  - 001-understand-data-collection
  - 002-disable-telemetry
  - 003-no-pii-assurance
created: 2025-12-28T12:00:00Z
started: 2025-12-28T12:00:00Z
completed: 2025-12-28T12:05:00Z
current_stage: null
stages_completed:
  - name: implement
    completed: 2025-12-28T12:05:00Z
    artifact: PRIVACY.md

requires_bolts: []
enables_bolts: []
requires_units: []
blocks: false

complexity:
  avg_complexity: 1
  avg_uncertainty: 1
  max_dependencies: 0
  testing_scope: 0
---

# Bolt: 017-privacy-documentation

## Overview

Create privacy documentation for specsmd analytics. This bolt was completed during Inception as PRIVACY.md was created at the repo root.

## Objective

Document data collection practices and provide opt-out instructions for users.

## Stories Included

1. **Understand data collection** - Users can see what data is collected
2. **Disable telemetry** - Users know how to opt-out
3. **No PII assurance** - Users understand no personal info is stored

## Bolt Type

**Type**: Simple Construction Bolt (Documentation)

## Status: Complete

PRIVACY.md was created during Inception phase at:
- `/PRIVACY.md` - Full privacy policy

## Deliverables

- [x] PRIVACY.md created at repo root
- [x] README.md updated with analytics section

## Success Criteria

- [x] PRIVACY.md exists at repository root
- [x] PRIVACY.md lists all collected data points
- [x] PRIVACY.md explains opt-out methods
- [x] PRIVACY.md states legal basis (legitimate interest)
- [x] README.md references PRIVACY.md

## Notes

- README updated with Analytics & Privacy section linking to PRIVACY.md

---
id: 012-slim-ops
title: Completed work has somewhere to go — a slim release step in the shipping lens
intent: 001-unified-bolt-flow
complexity: low
status: pending
depends_on: [006-execution-skills, 007-navigator-status]
created: 2026-08-09
---

# Completed work has somewhere to go — a slim release step

v1 of the unified flow does not ship full operations capabilities (build/deploy/monitor are a possible follow-up). It does ship a slim release step, so the shipping lens is a place work moves through rather than a shelf it sits on.

## Behavior

- A release checklist can be produced for any set of completed bolts: what changed (from walkthroughs), verification evidence present, standards findings outstanding, and any release-relevant decisions since the last checklist.
- A verify step records, per released change, that a human or agent confirmed observable behavior in the target environment; the confirmation is part of the record, not a conversation.
- The navigator's shipping lens shows completed work not yet released and offers the checklist as a suggestion — like everything else, never a mandate.
- Nothing in the flow gates on release: completion and release are independent; a project that never uses the release step sees no findings about it.

## Out of scope

Build, deploy, environment progression, and monitoring (the follow-up's extension point is the release record: fuller operations would consume and extend it). Integration with any CI/CD system.

## Definition of Done

- [ ] (gating) A release checklist over two completed bolts includes each bolt's changes, verification evidence, and outstanding findings.
- [ ] (gating) A recorded verification is answerable later from the artifact tree *(who/what confirmed, when, against which change)*.
- [ ] (gating) The shipping lens distinguishes completed-unreleased from released work.
- [ ] (advisory) A project that never releases sees no release-related findings.

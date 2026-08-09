---
id: 005-planning-skills
title: Shaping work — capture intent, decompose, optionally pre-group
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [001-flow-schema]
created: 2026-08-09
---

# Shaping work — capture intent, decompose, optionally pre-group

The shaping side of the flow turns rough direction into nlspec artifacts: intent briefs, work items, and — optionally — draft bolts. Every shaping skill is invocable at any time, in any order; each ends by stating what now exists, never by mandating what happens next.

## Behavior

- **Intent capture** turns a dialogue into an intent brief: problem, outcome, scope, non-goals. Briefs follow the nlspec standard's intent register — pure intent, no mechanism.
- **Decomposition** turns an intent into work items: vertical slices, each with observable acceptance criteria per the nlspec standard, an assessed complexity, and dependencies. Circular dependencies are refused at creation with the cycle named. The suggested ceremony (from complexity × the project's autonomy bias) is recorded on the work item as a recommendation the user can override at bolt time.
- **Pre-grouping** (the optional planning ritual) writes draft bolts: proposals naming a grouping of work items and a suggested recipe. A draft is data; starting a bolt may adopt a draft, modify it, or ignore all drafts. Unadopted drafts age harmlessly *(the integrity validator may flag stale drafts, advisory only)*.
- No shaping skill requires another to have run first: decomposition against a one-line intent works (and says what's thin); capture after work items exist works (and links them).
- Ambiguity discovered while shaping is resolved per the nlspec standard's failure table: interchangeable readings are chosen and named; non-interchangeable ones are asked.

## Definition of Done

- [ ] (gating) A dialogue produces an intent brief conforming to the flow contract and the nlspec standard's intent register.
- [ ] (gating) Decomposition produces work items whose acceptance criteria are behavioral *(an internal-attribute criterion is flagged at authoring time, advisory)*.
- [ ] (gating) A dependency cycle among work items is refused with the cycle named.
- [ ] (gating) Starting a bolt with drafts present offers adopt / modify / ignore; ignoring leaves drafts unchanged.
- [ ] (advisory) Each shaping skill's closing message states the artifacts that now exist and offers — without requiring — natural next moves.

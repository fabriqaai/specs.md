---
id: 011-memory-lifecycle
title: Memory has a lifecycle — episodic records distill then expire, semantic records stay true
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [001-flow-schema, 003-state-scripts, 004-integrity-validator]
created: 2026-08-09
---

# Memory has a lifecycle — episodic records distill then expire, semantic records stay true

The artifact tree is the project's memory, and its two classes age differently. **Semantic** artifacts — specs, standards, the constitution, decision records — state what is true and which options were chosen; they never expire and must be kept true. **Episodic** artifacts — bolt plans, test and review reports, walkthroughs, log entries, eval reports — record what happened on a particular run; they are valuable while fresh and prunable once their lessons are captured, because a capable model can re-derive *how* from what is true and why. What cannot be re-derived — the choice and its rationale — is exactly what semantic memory holds.

## Behavior

- Every artifact type's memory class (semantic or episodic) is declared in the flow contract, alongside a retention horizon for episodic types. The horizon has a default and is configurable per project. There are exactly two classes.
- **Pruning is distillation-gated**: an episodic record past its horizon may be pruned only when its semantic residue is captured — decisions appear as decision records, discoveries that changed behavior appear as spec or standards updates. Pruning an undistilled record is refused, and the refusal names what residue is missing and where it belongs. An explicit override exists and is recorded.
- Pruning removes episodic artifacts from the working tree only; in a version-controlled project, history retains the full record. A bolt's compact state record persists as a permanent index entry — what ran, when, what it completed — while its trajectory artifacts are pruned.
- A pruned bolt remains valid in every status cascade: its completed work items and intent statuses are unaffected *(the cascade happened at completion; pruning changes nothing downstream)*.
- **Semantic freshness is enforced by findings, not hope**: a recurring maintenance pass detects semantic artifacts that contradict the current system or each other, and reports each as an integrity finding with severity and remediation. Semantic artifacts carry a verification status; claims tied to a moment in time are anchored ("at the time of writing…").
- The maintenance pass proposes, the user consents: no pruning and no semantic correction happens unprompted, and everything done is recorded in the maintenance log.

## Out of scope

Cross-project memory (anything outside the artifact root). Automatic scheduling of the maintenance pass (attaches to the project's own automation; the flow provides the invocable pass). Retention of the version-control history itself (the project's concern, not the flow's).

## Definition of Done

- [ ] (gating) The flow contract answers, for every artifact type, its memory class; episodic types carry a retention horizon with a default.
- [ ] (gating) Pruning an episodic record containing an unextracted decision is refused, and the refusal names the decision and its destination.
- [ ] (gating) After a permitted prune, the bolt's index entry remains, downstream statuses are unchanged, and the pruned artifacts are absent from the working tree.
- [ ] (gating) A semantic artifact deliberately made to contradict the current system is reported as a finding with a remediation *(not silently tolerated, not silently fixed)*.
- [ ] (advisory) A project that never prunes anything experiences no warnings beyond advisory findings — retention is recommended, never forced.

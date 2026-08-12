---
work_item: 001-flow-schema
intent: 001-unified-bolt-flow
complexity: high
protocol: triangulation
sufficiency: cleared
recorded_at: 2026-08-12T22:47:05Z
---

# Sufficiency report: 001-flow-schema

Protocol: triangulation (high complexity).

## Outcome

cleared

## Notes

High-complexity triangulation for 001-flow-schema. This contribution is the implement-from-spec probe. Closed answers live in the flow contract; the work item does not duplicate field lists.

Probe: this-implementation

Judge: dod-comparison

## Findings

### F1 — named-freedom (resolved)

Identifier uniqueness for intents and work items is local to one working copy

Two implementers could treat intent and work-item ids as globally unique across worktrees. The spec now names the freedom: those ids are unique inside one working copy; merge conflicts on those paths are resolved by the user. Bolt ids are the collision-safe ones.

Resolution: Bolt ids are bolt-{worktree}-{nnn} with worktree = {basename}-{sha1(absPath)[:6]}. Intent and work-item ids stay {nnn}-{slug} per working copy.

### F2 — named-freedom (resolved)

Memory class is derived, not stored

Two implementers could persist memory_class on every artifact.

Resolution: Memory class is derived from status for change records and is not stored.

### F3 — named-freedom (resolved)

System document types declare registration fields only

The contract supports project-registered system documents without shipping types.

Resolution: system_document_types.registration_fields is name, purpose, claimed_scope. Specific system types attach in the memory-lifecycle work item.

## Pass bar

No open divergence-causing finding remains (no open `divergence` or `contradiction`).
Advisory findings may remain open. Full probe conformance is not the bar.

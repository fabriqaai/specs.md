---
id: 011-memory-lifecycle
title: Memory model — current truth in system/, history as change records
intent: 001-unified-bolt-flow
complexity: high
status: pending
depends_on: [001-flow-schema, 003-state-scripts, 004-integrity-validator]
created: 2026-08-09
---

# Memory model — current truth in system/, history as change records

The artifact tree is the project's memory, in two classes with different lifecycles. **Semantic memory always reflects reality**; **episodic memory is history** — valuable, kept, but never the default read path.

Intents, work items, and bolts are **change records**: they specify a delta. While active they are the working spec of that delta; once complete they become episodic — history that is *correctly* stale. Current truth lives in the **`system/` layer**: a small set of persistent documents stating what is true now (architecture, integrations, domain facts). Completing a change is *projected* onto that layer — when the auth migration completes, the auth truth document says the new reality, and no chain of superseded files needs maintaining, because truth has exactly one address and history points up to it.

## Behavior

### Classes and the contract
- The flow contract declares each artifact type's memory class. Change records (intents, work items, bolts and their stage artifacts) are semantic while active and episodic once their status is terminal. `system/` documents, standards, and the decisions index are always semantic. Exactly two classes exist.
- A project registers its own semantic document types in `system/`: each declares a name, purpose, and **scope** — the topics or areas of the codebase it claims. Registration is data; adding a type requires nothing but the declaration.

### Projection (advisory)
- When a bolt completes, the flow matches the bolt's touched scope against registered `system/` documents' claimed scopes and surfaces each match for review: confirm still true, or update. This is a recommendation with a named target — never a completion blocker.
- A scope-matched document left unreviewed becomes an integrity finding (advisory severity) naming the bolt, the document, and what to verify.
- Each `system/` document carries a visible verification status: when it was last confirmed true and by what. Staleness is a lookup, not an accident.

### The read path
- Semantic memory is read first: the flow's bootstrap and navigator direct agents to `system/`, standards, and the decisions index before anything else. Episodic artifacts are read only when a semantic document refers to them for detail, or when the user asks for history.
- Every episodic artifact carries a standing header naming its nature and its upward pointer: "Historical record ({date}). Current truth: {semantic document}." Pointers go up to semantic, never sideways to newer episodic — one hop, nothing to re-chain when reality changes again.
- Episodic artifacts past their retention horizon move to an archive area out of the default search path. Nothing requires deletion; in a version-controlled project, history retains everything regardless.

### Decisions
- Decision records are immutable episodic events — that a decision was made never becomes false. Which decisions are **in force** is semantic: the decisions index lists only in-force decisions, each with a hint naming when a future reader should consult it. Superseding a decision adds a new record, updates the index, and stamps the old record's upward pointer. Agents consult the index; they do not crawl the folder.

### Forgetting (gated, unlike projection)
- Moving an episodic record to the archive — and any deeper pruning — is refused while the record holds uncaptured truth: a decision absent from the index, or a discovery that changed behavior but is reflected in no semantic document. The refusal names what is missing and where it belongs. An explicit override exists and is recorded.
- Archival changes nothing downstream: completed statuses, cascades, and the bolt's compact index entry are unaffected.

### Gardening (the lazy loop)
- A recurring maintenance pass detects: semantic documents contradicting the current system, semantic documents contradicting each other, in-force index entries pointing at superseded records, episodic artifacts past horizon still in the hot path, and missing upward pointers. Each finding carries severity and a remediation. Nothing is changed without consent; everything done is logged.

## Out of scope

Cross-project memory (outside the artifact root). Scheduling of the gardening pass (the flow provides the invocable pass; automation is the project's). Retrieval tooling beyond the read-path conventions (a queryable index would attach as a consumer of the flow contract).

## Definition of Done

- [ ] (gating) The contract answers, for every artifact type, its memory class — including the active→terminal class transition for change records.
- [ ] (gating) A registered `system/` document whose scope matches a completing bolt is surfaced for review at completion; declining to review completes the bolt anyway and leaves an advisory finding.
- [ ] (gating) Every episodic artifact created by the flow carries the historical-record header with a valid upward pointer.
- [ ] (gating) The decisions index lists only in-force decisions; superseding via the flow updates the index and the old record's pointer in one operation.
- [ ] (gating) Archiving an episodic record holding an unindexed decision is refused with the decision and its destination named; the override, when used, is visible in the record.
- [ ] (gating) A `system/` document deliberately contradicting the codebase is reported by the gardening pass with a remediation *(not silently tolerated, not silently fixed)*.
- [ ] (advisory) An agent following the bootstrap's read-path guidance reaches current truth without opening any episodic artifact.

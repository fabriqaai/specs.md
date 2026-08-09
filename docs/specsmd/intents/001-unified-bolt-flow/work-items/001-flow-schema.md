---
id: 001-flow-schema
title: One contract defines the flow's artifacts, state, and names
intent: 001-unified-bolt-flow
complexity: high
status: pending
depends_on: []
created: 2026-08-09
---

# One contract defines the flow's artifacts, state, and names

Everything the flow knows about itself — where artifacts live, what state each artifact carries, what values state may take, how things are named — is defined once, in one machine-readable contract, and every consumer derives its knowledge from that contract. Nothing hardcodes a second copy.

## Behavior

- One contract document answers, for any artifact type (intent brief, work item, bolt record, standard, decision record): its location pattern, its identifier pattern, the state fields it carries, and the allowed values of each field. Each fact appears exactly once.
- There is one status vocabulary across all artifact types. An artifact's status is always one of its declared values; no consumer defines its own variant. *(The legacy flows' three conflicting status vocabularies are the failure this prevents.)*
- State lives in each artifact's own frontmatter. There is no central state file. The contract states this explicitly, together with the rule that only the flow's own tooling writes state.
- Identifiers are collision-safe under parallel work: two bolts created concurrently in separate working copies of the same project receive distinct identifiers.
- Any tool that needs flow knowledge (installer, dashboard, editor integrations, the flow's own skills) can obtain everything it needs by reading the contract. Adding an artifact type or status value is a contract change, not a code change in each consumer.

## Out of scope

Migration of legacy artifact roots (a converter would attach as a separate reader of the legacy formats); the recipe file format (defined in the recipe catalog work item, referenced by this contract).

## Definition of Done

- [ ] (gating) For every artifact type, location, identifier pattern, state fields, and allowed values are answerable from the contract alone.
- [ ] (gating) No status value or artifact path pattern appears in more than one authoritative place.
- [ ] (gating) Creating two bolts concurrently in two working copies of one project yields non-colliding identifiers.
- [ ] (advisory) A consumer written against the contract needs no change when a new status value is added to the contract.

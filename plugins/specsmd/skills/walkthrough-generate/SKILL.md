---
name: walkthrough-generate
description: Use when a bolt is ready to complete and needs a human-facing walkthrough. Writes what changed, why, deviations, and how to verify — with no source code.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: builder
disable-model-invocation: true
---

# Walkthrough

Every completed bolt yields a walkthrough, even when the recipe has no walkthrough stage.

Write `docs/specsmd/bolts/{boltId}/walkthrough.md` using `references/walkthrough.md` in the `bolt-execute` skill.

Required sections: what changed, why, deviations from plan, how to verify. If there are no deviations, the deviations section exists and says none.

Contains no source listings, patches, or language-tagged fences. Allowed: user-facing names, behavior, and verification invocations.

Then tell the user the walkthrough path. Offer — without requiring — completing the bolt via `scripts/complete-bolt.cjs` in the `flow-runtime` skill.

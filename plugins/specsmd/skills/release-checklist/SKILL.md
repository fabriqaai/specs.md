---
name: release-checklist
description: Use when completed bolts are ready to ship or the user asks for a release checklist. Compiles changes, verification evidence, outstanding findings, and recent decisions. Never required.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: shipping
disable-model-invocation: true
---

# Release checklist

Optional shipping step. Completion and release are independent. Do not invent findings for a project that never releases. Do not treat this skill as required after a bolt completes.

## Process

1. Choose completed bolts the user named, or every completed bolt not yet on a checklist.
2. Write `docs/specsmd/releases/{nnn}-{slug}/release.md` with frontmatter `id`, `title`, `status: complete`, `bolts: []`, `created`.
3. Per named bolt include: what changed (from the walkthrough), verification evidence present, and outstanding findings; plus tree-level integrity notes and recent decisions.

## Close

State the release id and which bolts it covers. Offer at most three declinable next names. None is required.

Now exists:
- `docs/specsmd/releases/{id}/release.md`

Declinable next (none required):
- `release-verify` — record confirmation of a named change
- `specsmd-status` — re-orient
- `bolt-start` — start another grouping

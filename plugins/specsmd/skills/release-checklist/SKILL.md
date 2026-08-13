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

1. Resolve `SCRIPTS_DIR` as the `scripts/` directory of the `flow-runtime` skill.
2. If the user named completed bolts, pass them. Otherwise omit `--bolts` and the script uses every completed bolt that is not yet on a checklist.
3. Run:

```text
node {SCRIPTS_DIR}/init-release.cjs {projectRoot} --bolts {id,id}
node {SCRIPTS_DIR}/init-release.cjs {projectRoot} --title "{title}"
```

4. Present the written checklist. It includes, per named bolt: what changed (from the walkthrough), verification evidence present, and outstanding findings; plus integrity/standards findings and release-relevant decisions since the last checklist.

Do not edit frontmatter by hand. Do not invoke another skill.

## Close

State the release id and which bolts it covers. Offer at most three declinable next names. None is required.

Now exists:
- `docs/specsmd/releases/{id}/release.md`

Declinable next (none required):
- `release-verify` — record confirmation of a named change
- `specsmd-status` — re-orient
- `bolt-start` — start another grouping

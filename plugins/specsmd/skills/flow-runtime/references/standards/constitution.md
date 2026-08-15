---
id: constitution
title: Constitution
status: active
kind: constitution
override: never
enforcement_tier: review
invariant: "Rules in this constitution hold for every file in the project and cannot be waived by a module standard."
remediation: "To satisfy {standard} in {file}, {change}. A module standard cannot waive it."
created: "{{created}}"
---

# Constitution

Universal policies. They apply to every file. A module standard never overrides this document.

A rule belongs here only if it will still be true after the current bolt and the next five. Agent operating procedure belongs in AGENTS, not here.

## Invariant

{{invariant}}

## Enforcement

Tier: `review`

Raise the tier with a recorded decision when violations recur.

## Remediation

When this standard is violated, name the standard, the file, and the change that satisfies it:

{{remediation}}

## Rules

- Secrets, credentials, and tokens do not appear in source or committed artifacts.
- The main line stays deployable; landing a change requires review.
- Dependencies come from trusted sources; known vulnerabilities are addressed.
- Public interfaces stay documented; a breaking change ships with migration notes.

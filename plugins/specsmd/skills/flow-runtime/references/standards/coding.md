---
id: coding
title: Coding
status: active
kind: overridable
override: allowed
enforcement_tier: review
invariant: "{{invariant}}"
remediation: "To satisfy {standard} in {file}, {change}."
created: "{{created}}"
---

# Coding

How source in this scope must read. The invariant is consistency with the declared style, not a particular formatter command.

## Invariant

{{invariant}}

## Enforcement

Tier: `review`

Raise the tier with a recorded decision when violations recur.

## Remediation

{{remediation}}

## Declared style

| Choice | Value |
|---|---|
| Linter | {{linter}} |
| Formatter | {{formatter}} |

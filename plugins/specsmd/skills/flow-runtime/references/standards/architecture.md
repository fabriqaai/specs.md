---
id: architecture
title: Architecture
status: active
kind: overridable
override: allowed
enforcement_tier: principle
invariant: "{{invariant}}"
remediation: "In {file}, {change} so the change stays inside the declared architectural boundaries."
created: "{{created}}"
---

# Architecture

Boundaries that new work in this scope must preserve.

## Invariant

{{invariant}}

## Enforcement

Tier: `principle`

Raise the tier with a recorded decision when violations recur.

## Remediation

{{remediation}}

## Declared shape

| Choice | Value |
|---|---|
| Structure | {{structure}} |

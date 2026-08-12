---
id: tech-stack
title: Tech stack
status: active
kind: overridable
override: allowed
enforcement_tier: principle
invariant: "{{invariant}}"
remediation: "In {file}, {change} so new work uses the declared stack for this scope."
created: "{{created}}"
---

# Tech stack

Technology choices for this scope. Stated as an invariant — which stack must hold — not as a build recipe.

## Invariant

{{invariant}}

## Enforcement

Tier: `principle`

Raise the tier with a recorded decision when violations recur.

## Remediation

{{remediation}}

## Declared stack

| Choice | Value |
|---|---|
| Language | {{language}} |
| Runtime | {{runtime}} |
| Package manager | {{package_manager}} |
| Framework | {{framework}} |

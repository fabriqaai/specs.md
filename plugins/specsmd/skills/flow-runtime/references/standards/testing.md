---
id: testing
title: Testing
status: active
kind: overridable
override: allowed
enforcement_tier: review
invariant: "{{invariant}}"
remediation: "In {file}, {change} so changed behavior is covered by automated tests."
created: "{{created}}"
---

# Testing

What must be true of verification in this scope.

## Invariant

{{invariant}}

## Enforcement

Tier: `review`

Raise the tier with a recorded decision when violations recur.

## Remediation

{{remediation}}

## Declared verification

| Choice | Value |
|---|---|
| Runner | {{test_runner}} |

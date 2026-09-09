---
id: engineering
title: Engineering
status: active
kind: overridable
override: allowed
enforcement_tier: review
invariant: "{{invariant}}"
remediation: "To satisfy {standard} in {file}, {change}."
created: "{{created}}"
---

# Engineering

How this project is built. Lasting invariants about stack, shape, and verification — not this bolt's design.

A rule belongs here only if it will still be true after the current bolt and the next five. Bolt schema, table columns, agent operating procedure, and implementation file names do not belong.

## Invariant

{{invariant}}

## Enforcement

Tier: `review`

Raise the tier with a recorded decision when violations recur.

## Remediation

{{remediation}}

## Rules

- **Stack.** {{stack}}
- **Shape.** {{shape}}
- **Verification.** {{verification}}

## Verification seed

Keep these unless this project records stricter rules.

- A gating Definition of Done line for new or changed behavior gets a failing check first — seen failing for the right reason before the product change. Existing passing evidence can prove unchanged behavior; removal alone requires no new absence test.
- Every behavior change carries a covering check. Select applicable acceptance, refusal and error paths; boundaries (empty, zero, one, many, at-limit); absent or null input; and replay where the contract names idempotency. One check may cover several files; record evidence by changed behavior and boundary, omitting irrelevant case classes.
- Run the relevant checks and required project suites. Reuse passing results for the same state; repeat or broaden only for changes, failures or unresolved concerns.
- Name the exact checks that prove a work item before claiming it complete.

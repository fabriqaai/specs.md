---
id: 008-standards-system
title: Standards — the guardrail layer, from constitution to enforced check
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [001-flow-schema]
created: 2026-08-09
---

# Standards — the guardrail layer, from constitution to enforced check

Standards are where the technical opinions live that specs deliberately leave out: the project's choices among valid options. They are guardrails with an escalation ladder — stated as principle, hardened into enforcement only when violations recur.

## Behavior

- A project's standards include a **constitution** — rules that hold everywhere and can never be overridden by any module — plus overridable standards (technology choices, coding, testing, architecture).
- In a monorepo, standards resolve by nearest scope: a module's standard wins over the root's for files in that module; the constitution is exempt and always wins. For any file, the resolved standard set is answerable deterministically.
- Standards are written as invariants where possible — properties that must hold ("inputs are parsed at the boundary") — rather than prescriptions of method. Each records its **enforcement tier**: stated principle → checked by review → checked mechanically. A standard's tier can be raised when violations recur; the raise is a recorded decision.
- Violations reported at any tier are phrased as remediation instructions naming the standard, the file, and the change that satisfies it.
- Project initialization asks one question — the autonomy bias — and derives the rest: workspace shape (single project or monorepo, greenfield or existing code) is detected; standards are generated as proposals; in an existing codebase, inferred standards are confirmed with the user before adoption.

## Out of scope

A marketplace/registry of shareable standard sets (would attach as an import source for the standards folder). Mechanical enforcement infrastructure itself (each standard's check attaches to the project's own linting/testing; the flow records tier and phrasing).

## Definition of Done

- [ ] (gating) A module standard overrides the root standard for that module's files; the constitution is never overridden anywhere.
- [ ] (gating) For any file in a monorepo test tree, the resolved standard set is deterministic and explainable (which scope won and why).
- [ ] (gating) Initialization in an empty project and in an existing codebase each complete with exactly one required question.
- [ ] (gating) Inferred standards in an existing codebase are presented for confirmation before being recorded.
- [ ] (advisory) Each shipped standard template states its invariant, its current enforcement tier, and its remediation phrasing.

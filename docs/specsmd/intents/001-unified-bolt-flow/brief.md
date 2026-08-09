---
id: 001-unified-bolt-flow
title: Build the Unified Bolt Flow (specsmd v2)
status: active
created: 2026-08-09
---

# Intent: Build the Unified Bolt Flow

Unify AI-DLC and FIRE into one skills-native flow, shipped as the **`specsmd`** plugin — the AI-DLC v2 implementation.

## Outcome

A new user runs `/plugin install specsmd@specsmd` and gets: intent capture → work-item decomposition → dynamic **bolts** running data-defined **recipes** (default / ddd / spike / simple) under a **ceremony dial** (complexity × autonomy bias), with all state in artifact frontmatter under `docs/specsmd/`, and nothing forcing a sequence — skills recommend, scripts gate on state.

## Scope

- In: flow schema + frontmatter contracts, recipe catalog, state scripts, integrity validation, planning/execution/navigator skills, standards system, `specsmd` plugin packaging, `/v2` documentation.
- Out (open questions): Operations skills in v1, migration converters from legacy roots, npm packaging strategy.

## Source decisions

All design decisions in `.specs-ideation/sessions/aidlc-fire-unification-20260809/concept-briefs/unified-bolt-flow.md` and `.claude/CLAUDE.md` §"Unified flow principles".

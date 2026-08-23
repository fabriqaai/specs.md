---
name: plan-intent
description: Use when capturing or shaping an outcome brief under docs/specsmd/. Stay here while the outcome is thin or still being decided.
license: MIT
metadata:
  version: "1.0.0"
  flow: specsmd
  phase: planner
disable-model-invocation: true
---

# Plan an intent

Write an **intent-register nlspec** — the outcome layer. Follow `references/nlspec.md` in the `flow-runtime` skill, `references/writing.md` in the `flow-runtime` skill, and `references/brief-writing.md` in this skill. Invocable at any time. Init is not required.

The brief is the source of truth for *why this change exists* and *what done looks like for the whole outcome*. `tasks.md` slices carry How (defaults, recovery, algorithms). Do not put How on the brief.

Do not implement. Do not write `tasks.md` in this skill. Do not write the brief until the user confirms the draft.

## 1. Explore

Read `docs/specsmd/system/`, `docs/specsmd/standards/`, `docs/specsmd/decisions/index.md`, and existing intent briefs. Notice overlap. Do not invent a second intent for an outcome that already has one.

## 2. Classify

Say the classification out loud.

- **One outcome** — continue.
- **Several independent outcomes** — name them. Plan only the first. Each outcome gets its own brief later.
- **A spike** ("can we…", throwaway) — do not write a brief. Answer the question. Label anything built as throwaway.

When in doubt, treat it as one outcome and keep the bound tight.

## 3. Dialogue

Ask **one question per turn**. Prefer A / B / C with your recommendation first. Hunt: purpose, today's failure, observable success, bound, exclusions, freedoms. If the outcome has a caller, also hunt from `references/caller-contracts.md` in the `flow-runtime` skill: return, surfaces, set rule, shape, credential.

Do not interview for slices, files, stack, recipes, or skill names. If the user offers mechanism, translate it to observable behavior or ask what a caller would see.

Before every sentence you are about to write, apply the dividing question: **does this decision affect correctness or interoperability of the outcome?** Yes → specify the observation. No → omit it or put it under Named freedoms.

If two readings are interchangeable to a caller, pick one and name it. If they are not, ask. Models guess under ambiguity; do not leave them a gap to guess through.

If the user gives one line, skip extra questions they already answered. Still confirm the draft. Do not invent facts to fill thin sections.

## 4. Approaches (only when the outcome itself has more than one reading)

Offer two or three **behavioral** approaches with trade-offs. Recommend one. These are different observable outcomes or bounds — not different stacks.

## 5. Draft in chat, then stop

Present the brief **by section** (Problem → Outcome → Scope → Non-goals → Named freedoms → Rationale → Definition of Done). After the last section, give a short restatement of the outcome and the gating DoD.

**Stop.** Wait for an explicit yes. Presenting the draft and writing the file in the same turn skips the gate.

## 6. Write

Create `docs/specsmd/intents/{nnn}-{slug}/brief.md` using `references/brief.md` in this skill. Fill it using `references/brief-writing.md` in this skill. Next id is one more than the highest `{nnn}` already under `intents/`.

Frontmatter:

```yaml
id: {nnn}-{slug}
title: {title}
status: pending
created: {ISO-8601}
```

Required headings, in this order: **Problem**, **Outcome**, **Scope**, **Non-goals**, **Named freedoms**, **Rationale**, **Definition of Done**. Additional headings are allowed.

A heading with nothing true to say gets `*(thin — not yet specified)*` — not invented content, not a blank heading.

No implementation file names, no language-tagged fences, no code. Untagged language-neutral meaning is allowed when it kills an ambiguity; it is not code to copy.

If tasks already exist on another intent, ask which belong here. Relink only **pending** sections: move that `## {id}` section into this intent's `tasks.md` and set `intent:`. Refuse items that are not pending or that are named on a non-draft bolt.

## 7. Self-review (fix inline)

Do this yourself. Do not dispatch a reviewer.

1. **Placeholder scan** — `TBD`, `TODO`, "appropriately", "as needed", empty headings. Fix or mark `*(thin)*`.
2. **Closed loop** — every Outcome/Scope claim has a DoD line; every DoD line is grounded in Outcome or Scope.
3. **Two-implementer** — run return / surfaces / set rule / shape / credential. Any hunt two agents could pass while a caller sees different products is a stop. Tighten, or name the freedom. Two stories in the tree: repair; do not write.
4. **Non-goals** — each has name, what, why out, extension point.
5. **Voice** — present tense, terms defined once, no synonyms, no history ("we decided").
6. **Mechanism** — no files, modules, skills, recipes, languages in the body.

## Close

List the path. Name any thin sections. Offer at most three declinable next names. None is required. Do not invoke them.

Now exists:
- `docs/specsmd/intents/{id}/brief.md`

Declinable next (none required):
- `plan-intent` — keep shaping while a heading is thin or the outcome is still being decided
- `task-decompose` — once the outcome is captured, write this intent's `tasks.md`
- `bolt-design` — after this intent has `tasks.md` slices, start a bolt

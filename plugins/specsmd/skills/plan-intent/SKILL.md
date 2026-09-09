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

Do not implement or write `tasks.md`. Save the brief at its target path before review, following **Artifact review** in `references/transitions.md` in the `flow-runtime` skill. A saved draft is not an accepted outcome.

## 1. Explore

Search the decisions index and intent summaries for overlap; read matching system scopes, the constitution, nearest standards and relevant briefs. Inspect the owning code/tests for current behavior. Notice overlap. Do not invent a second intent for an outcome that already has one.

## 2. Classify

Say the classification out loud.

- **One outcome** — continue.
- **Several independent outcomes** — name them and keep separate briefs. Handle the outcomes the user requested; ask about priority only when a real dependency or scope conflict requires it.
- **A spike** — explicit feasibility research or a throwaway experiment. Answer that question and label experiments. Phrasing such as "can we add" can be an implementation request; infer intent from the whole task.

When in doubt, treat it as one outcome and keep the bound tight.

## 3. Dialogue

Resolve from evidence before asking, following `references/caller-contracts.md` in the `flow-runtime` skill. Check purpose, current failure, observable success, scope and freedoms internally. Reuse prior answers and accepted project facts; ask only about unresolved material choices. For changed caller contracts check return, surfaces, set rule, shape and credential; unchanged contracts may be inherited.

Do not interview for slices, files, stack, recipes, or skill names. If the user offers mechanism, translate it to observable behavior or ask what a caller would see.

Before every sentence you are about to write, apply the dividing question: **does this decision affect correctness or interoperability of the outcome?** Yes → specify the observation. No → omit it or put it under Named freedoms.

If two readings are interchangeable to a caller, choose within scope. If they differ, first look for an accepted answer; ask only when the material choice remains unresolved.

If the user gives one line, skip extra questions they already answered. Apply the draft review below. Do not invent facts to fill thin sections.

## 4. Approaches (only when the outcome itself has more than one reading)

Offer two or three **behavioral** approaches with trade-offs. Recommend one. These are different observable outcomes or bounds — not different stacks.

## 5. Write the draft

Resume an existing brief at its current path when shaping or reviewing it. Allocate
a new intent ID only for a new outcome.

Create `docs/specsmd/intents/{nnn}-{slug}/brief.md` using `references/brief.md` in this skill. Fill it using `references/brief-writing.md` in this skill. Next id is one more than the highest `{nnn}` already under `intents/`.

Frontmatter:

```yaml
id: {nnn}-{slug}
title: {title}
status: draft
created: {ISO-8601}
```

Required headings, in this order: **Problem**, **Outcome**, **Scope**, **Non-goals**, **Named freedoms**, **Rationale**, **Definition of Done**. Additional headings are allowed.

A heading with nothing true to say gets `*(thin — not yet specified)*` — not invented content, not a blank heading.

No implementation file names, no language-tagged fences, no code. Untagged language-neutral meaning is allowed when it kills an ambiguity; it is not code to copy.

## 6. Self-review (fix inline)

Do this yourself. Do not dispatch a reviewer.

1. **Placeholder scan** — `TBD`, `TODO`, "appropriately", "as needed", empty headings. Fix or mark `*(thin)*`.
2. **Closed loop** — every Outcome/Scope claim has a DoD line; every DoD line is grounded in Outcome or Scope.
3. **Two-implementer** — run return / surfaces / set rule / shape / credential. Any hunt two agents could pass while a caller sees different products is a stop. Tighten, or name the freedom. Two stories in the tree: repair while the brief remains draft; do not accept contradictory requirements.
4. **Non-goals** — each has name, what, why out, extension point.
5. **Voice** — present tense, terms defined once, no synonyms, no history ("we decided").
6. **Mechanism** — no files, modules, skills, recipes, languages in the body.

## 7. Review and accept

Link the saved brief with a concise summary and any unresolved material choices.
Follow **Artifact review** in `references/transitions.md` in the `flow-runtime` skill. Keep `status: draft` until the outcome is accepted. Requested edits change
this same file; do not regenerate the body when approval arrives.

On acceptance, change a new brief to `status: pending`. If the user already
explicitly authorized direct capture of settled requirements, record acceptance
in the same turn without another prompt. This does not authorize new scope or
weaken acceptance criteria. Thin or contradictory requirements remain draft.
For an existing accepted brief, retain its lifecycle status when recording
already-authorized edits; resolve a new scope decision before replacing accepted
requirements. Do not reset active or completed work as a side effect of editing.

After the brief is accepted, apply any authorized pending-task relinks. If tasks already exist on another intent, ask which belong here. Relink only **pending** sections: move that `## {id}` section into this intent's `tasks.md` and set `intent:`. Refuse items that are not pending or that are named on a non-draft bolt.

## Close

List the path. Name any thin sections. Continue any next phase already authorized in the requested workflow after its gates pass. At the end of that scope, offer at most three optional next names without invoking them.

Now exists:

- `docs/specsmd/intents/{id}/brief.md`

Declinable next (none required):

- `plan-intent` — keep shaping while a heading is thin or the outcome is still being decided
- `task-decompose` — once the outcome is captured, write this intent's `tasks.md`
- `bolt-design` — after this intent has `tasks.md` slices, start a bolt

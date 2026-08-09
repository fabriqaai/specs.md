---
id: 002-recipe-catalog
title: Recipes are data the flow reads, not behavior the flow hardcodes
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [001-flow-schema]
created: 2026-08-09
---

# Recipes are data the flow reads, not behavior the flow hardcodes

A recipe is a stage catalog: the ordered stages a bolt moves through, what each stage produces, and which stages may carry approval gates. Recipes live as data files in the project's recipe folder. The flow's execution machinery is recipe-agnostic — it reads whatever recipe a bolt declares and runs those stages.

## Behavior

- A recipe declares: its ordered stages; per stage, the artifacts the stage produces; per stage, whether it is gateable; and any recipe-level constraints stated declaratively (a stage in which no source code may be written; a mandatory time box whose expiry ends the bolt with findings).
- Four recipes ship with the flow: `default` (plan → execute → test → review), `ddd` (domain model → design → decisions → implement → test), `spike` (explore → findings, time-boxed), `simple` (plan → implement → walkthrough).
- A user adds a project-local recipe by adding one file to the recipe folder. No other change is needed; the new recipe is immediately selectable when starting a bolt.
- The recipe chosen for a bolt is recorded in the bolt's state at creation and does not change thereafter *(a wrong choice is resolved by completing or abandoning the bolt, not mutating it)*.
- When a bolt starts without an explicit recipe choice, the flow recommends one from the work items' recorded complexity; the user's choice always wins.

## Out of scope

Recipe composition/inheritance (a recipe importing another's stages) — would attach as an additional declaration in the recipe format. Per-stage tool restrictions — would attach as a recipe-level constraint.

## Definition of Done

- [ ] (gating) Each of the four shipped recipes, read from its data file, yields its declared stage order and per-stage artifacts.
- [ ] (gating) A project-local recipe file added to the recipe folder is selectable at bolt creation with no other change.
- [ ] (gating) A bolt's recorded recipe never changes after creation.
- [ ] (gating) The spike recipe's time box, once expired, ends the bolt with a findings artifact rather than continuing *(partial findings are a valid outcome, not a failure)*.
- [ ] (advisory) Recommending a recipe from complexity matches the documented mapping.

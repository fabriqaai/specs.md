---
id: 002-recipe-catalog
title: Recipes are data the flow reads, not behavior the flow hardcodes
intent: 001-unified-bolt-flow
complexity: medium
status: pending
depends_on: [001-flow-schema]
created: 2026-08-09
sufficiency: cleared
sufficiency_date: 2026-08-13
sufficiency_report: docs/specsmd/intents/001-unified-bolt-flow/sufficiency/002-recipe-catalog.md
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

## Decided defaults

Per-stage produces, gateable, and constraints live in the shipped recipe files — this section does not duplicate those tables.

- Recipe files are YAML at `docs/specsmd/recipes/{id}.yaml` (project) with shipped copies in the flow-runtime recipe catalog. Required fields: `id`, `stages[]` with `id`, `produces`, `gateable`; optional `completion_requires`, `constraints`.
- Four recipes ship: `default` (plan → execute → test → review), `ddd` (domain-model → design → decisions → implement → test), `spike` (explore → findings, time-boxed), `simple` (plan → implement → walkthrough).
- Completion evidence is `completion_requires`. Omitted `completion_requires` uses the contract default (`test-report.md`, `walkthrough.md`).
- Omitted recipe: recommend from complexity — low→simple, medium→default, high→ddd. User choice always wins. Empty input applies the recommendation.
- A project file with the same id shadows the shipped recipe at bolt creation. The bolt records `recipe` (id) and an immutable `recipe_snapshot` of the parsed recipe. Later file edits do not change an in-flight bolt.
- Spike time box: `duration: PT8H`, `on_expiry: complete_with_findings`. Clock starts when the bolt becomes active. The next tooling write after expiry writes `findings.md` if missing and completes through the normal complete path (not an override). Partial findings are valid.
- Known constraint kinds: `time_box`, `no_source_code`. Unknown constraint kinds are refused at recipe-load (terminal).

## Definition of Done

- [ ] (gating) Each of the four shipped recipes, read from its data file, yields its declared stage order and per-stage artifacts.
- [ ] (gating) A project-local recipe file added to the recipe folder is selectable at bolt creation with no other change.
- [ ] (gating) A bolt's recorded recipe never changes after creation.
- [ ] (gating) The spike recipe's time box, once expired, ends the bolt with a findings artifact rather than continuing *(partial findings are a valid outcome, not a failure)*.
- [ ] (advisory) Recommending a recipe from complexity matches the documented mapping.

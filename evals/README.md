# evals — holdout judges for the Unified Bolt Flow

This tree is the evaluation holdout. It is visible and reviewable. **Implementing agents do not write here.** A contribution that changes flow implementation (`plugins/specsmd/`) and this tree together is rejected before merge.

Evaluation reads this tree. Implementation never writes it. Sufficiency *outcomes* are recorded on the work item (frontmatter `sufficiency` / `sufficiency_report`) and as a report next to the intent, not in this folder.

## Layout

| Path | Purpose |
|---|---|
| `sufficiency/` | Tiered spec-sufficiency runner + agent protocols |
| `conformance/` | Definition of Done checker with honest coverage |
| `triggers/` | Canonical prompt → expected skill fixtures and runner |
| `holdout/` | Isolation check + future end-to-end scenarios |
| `lib/` | Shared parsing used only by these runners |

## Run

From the repository root (scripts need `js-yaml` from `src/node_modules`):

```text
node evals/sufficiency/run.cjs --work-item 001-flow-schema
node evals/sufficiency/run.cjs --work-item 001-flow-schema --record --findings findings.yaml
node evals/conformance/run.cjs
node evals/triggers/run.cjs
node evals/holdout/run.cjs
```

`--json` is accepted on every runner.

## Sufficiency

Rigor follows the work item's recorded `complexity`:

- **high** → triangulation (`sufficiency/protocols/triangulation.md`)
- **medium** / **low** → adversarial review (`sufficiency/protocols/adversarial-review.md`)

The runner is the only writer of `sufficiency: cleared | not-cleared` and `sufficiency_report`. A spec with an open divergence or contradiction cannot be recorded as cleared.

Reports land at `docs/specsmd/intents/{intent}/sufficiency/{id}.md`.

## Conformance

Walks every Definition of Done checkbox in the intent. Each criterion is `verified`, `failed`, or `needs-human`. A criterion that cannot be evaluated at all is `spec-defect`, not skipped. Most criteria are `needs-human` until the flow exists — that is honest coverage, not a silent pass.

## Trigger evals

Fixtures map canonical prompts to `using-specsmd` and `specsmd-status`. The runner scores descriptions under `plugins/specsmd/skills/*/SKILL.md`. If those files are missing, every prompt is `skipped` — not failed.

## Holdout

`holdout/run.cjs` (and the test that calls it) fails when the same git commit or the working tree versus merge-base changes both an evals-side path (`evals/` or `.github/workflows/evals-holdout.yml`) and `plugins/specsmd/`. Changing only one side passes. Renames that leave `evals/` and land in `plugins/specsmd/` count as both sides. On a push, the previous SHA is the base (a zero SHA has no parent). Scenarios, when added, live in `holdout/scenarios/` and are judged on satisfaction, not on whether a test asserted true.

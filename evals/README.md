# evals — holdout judges for the Unified Bolt Flow

This tree is the evaluation holdout. It is visible and reviewable. **Implementing agents do not write here.** A contribution that changes flow implementation (`plugins/specsmd/`) and this tree (or `src/__tests__/evals/`) together is rejected before merge.

Evaluation reads this tree. Implementation never writes it. Sufficiency *outcomes* are recorded on the work item (frontmatter `sufficiency` / `sufficiency_report`) and as a report next to the intent, not in this folder.

## Layout

| Path | Purpose |
|---|---|
| `sufficiency/` | Tiered spec-sufficiency recorder + agent protocols |
| `conformance/` | Definition of Done checker with honest coverage |
| `triggers/` | Signature-phrase holdout for model-invocable descriptions |
| `holdout/` | Isolation check + satisfaction scenarios |
| `lib/` | Shared parsing and an optional loader for flow state scripts (absent in the shipped plugin) |

## Run

From the repository root (scripts need `js-yaml` from `src/node_modules`):

```text
node evals/sufficiency/run.cjs --work-item 001-flow-schema
node evals/sufficiency/run.cjs --work-item 001-flow-schema --record --findings findings.yaml
node evals/conformance/run.cjs
node evals/triggers/run.cjs
node evals/holdout/run.cjs
node evals/holdout/scenarios/run.cjs
```

`--json` is accepted on every runner.

## Sufficiency

Rigor follows the work item's recorded `complexity`:

- **high** → triangulation (`sufficiency/protocols/triangulation.md`)
- **medium** / **low** → adversarial review (`sufficiency/protocols/adversarial-review.md`)

The runner is the only writer of `sufficiency: cleared | not-cleared` and `sufficiency_report`. It does **not** spawn probe implementers or judges. It records evidence you already produced.

A high-complexity spec **cannot be cleared** without two isolated probes (each with observable-behavior notes) and a judge note. A medium/low spec cannot be cleared without a reviewer attestation. An open `divergence` or `contradiction` also blocks cleared.

Reports land at `docs/specsmd/intents/{intent}/sufficiency/{id}.md`.

## Conformance

Walks every Definition of Done checkbox in the intent. Each criterion is `verified`, `failed`, `needs-human`, or `spec-defect`. Criteria without a machine check or a holdout scenario stay `needs-human`. The process exits non-zero only for a failed **gating** criterion or a spec defect.

## Trigger evals

Fixtures name signature phrases that must remain in the shipped `using-specsmd` and `specsmd-status` descriptions. A prompt passes when those phrases still exist, it does not quote the other skill's signatures, and unique vocabulary from the expected skill wins. This is **not** a model router. If those skill files are missing, every prompt is `skipped`.

## Holdout

`holdout/run.cjs` fails when the same contribution changes an evals-side path (`evals/`, `src/__tests__/evals/`, or `.github/workflows/evals-holdout.yml`) and `plugins/specsmd/`. Changing only one side passes. Renames that leave `evals/` and land in `plugins/specsmd/` count as both sides.

`holdout/scenarios/` judges **satisfaction** of observed behavior by running flow state scripts in a throwaway tree when those scripts exist. The shipped specsmd plugin has no state scripts, so every scenario is skipped and conformance records those criteria as `needs-human`. Adding a scenario is an evals-area change.

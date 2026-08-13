# Holdout scenarios

End-to-end acceptance scenarios for the unified flow live here, outside the implementing agent's reach, so criteria cannot be rewritten to match what was built.

Judge **satisfaction** — whether observed behavior satisfies the scenario — not whether a boolean test asserted true.

Run:

```text
node evals/holdout/scenarios/run.cjs
```

Each YAML file names the work items it judges. Adding a scenario is an evals-area change and must not land in the same contribution as `plugins/specsmd/` implementation.

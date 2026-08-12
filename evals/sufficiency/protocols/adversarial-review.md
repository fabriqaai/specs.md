# Adversarial review protocol (medium and low complexity)

Use this protocol when the work item's recorded complexity is **medium** or **low**. Do not implement. A skeptic, given the spec alone, hunts for readings that would make two implementers diverge.

## Isolation

The reviewer may read only:

- the work item spec
- the intent brief that owns it
- `docs/specsmd/standards/`

The reviewer may not read a reference implementation or this `evals/` tree's holdout scenarios. Implementing agents must not write `evals/`.

## Hunt for

- **Divergence readings** — two implementers could satisfy the same sentence and produce caller-visible different behavior
- **Contradictions** — the spec disagrees with itself
- **Missing defaults** — a configurable value, range, optional input, or error category without documented default / bounds / omitted behavior / recovery
- **Untestable criteria** — a Definition of Done item that is not a binary, black-box, independently verifiable assertion (internal attributes, "handle appropriately", no observable outcome)

## Finding classes

| class | meaning | blocks cleared? |
|---|---|---|
| `divergence` | two competent implementers would not be interchangeable to a caller | yes, while `status: open` |
| `contradiction` | the spec disagrees with itself | yes, while `status: open` |
| `advisory` | style or completeness suggestion | no |
| `named-freedom` | the gap is intentional and now named | no |

Missing defaults and untestable criteria are `divergence` when they would change observable behavior; otherwise `advisory`.

## Pass bar

The spec is **cleared** when no open `divergence` or `contradiction` remains. Advisory findings may stay open. The spec is **not-cleared** while any blocking finding is open.

## Record

```text
node evals/sufficiency/run.cjs --work-item <id> --record --findings findings.yaml
```

Omit `--outcome` to derive `cleared` / `not-cleared` from findings. `--outcome cleared` is refused while a blocking finding is open.

```yaml
protocol: adversarial-review
findings:
  - id: F1
    class: divergence   # divergence | contradiction | advisory | named-freedom
    status: open        # open | resolved
    summary: one line
    detail: the incompatible readings, or the missing default
    resolution: spec edit or named freedom (when resolved)
```

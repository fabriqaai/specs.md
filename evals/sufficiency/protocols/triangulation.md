# Triangulation protocol (high complexity)

Use this protocol when the work item's recorded complexity is **high**. The check's job is to make "this spec is sufficient" a tested claim. Full conformance of a probe implementation is not the bar; interchangeability is.

## Isolation

The **probe implementer** may read only:

- the work item spec
- the intent brief that owns it
- `docs/specsmd/standards/`

The probe implementer may not read conversation history about the spec, a reference implementation, or this `evals/` tree's holdout scenarios.

The **judge** may read the spec, the standards, the probe's observable behavior notes, and the Definition of Done. The judge proposes spec corrections; the judge does not "fix" the probe to match a preferred reading.

Implementing agents must not write `evals/`.

## Steps

1. **Probe.** An independent implementer, isolated as above, produces an implementation and a short note of *observable* behavior (what a caller can see). Internal structure is irrelevant.
2. **Judge.** A separate agent compares that observable behavior to every Definition of Done criterion and reports:
   - gaps (behavior the spec requires that the probe could not determine)
   - ambiguities (more than one interchangeable-to-a-caller reading was not possible; the probe had to guess)
   - contradictions (the spec disagrees with itself)
3. **Second probe (required for high complexity).** Repeat step 1 with a different implementer and the same isolation. Where the two probes' observable behavior diverges, record a **divergence** finding at that point. Two probes that match do not prove completeness; a divergence does prove ambiguity.
4. **Resolve or name.** Every divergence-causing finding and every contradiction is either repaired in the spec or converted into named intentional freedom. Advisory findings (style, completeness suggestions) may remain open.
5. **Record.** Write findings and record the outcome with the sufficiency runner. Do not hand-edit work-item frontmatter.

## Finding classes

| class | meaning | blocks cleared? |
|---|---|---|
| `divergence` | two competent implementers would not be interchangeable to a caller | yes, while `status: open` |
| `contradiction` | the spec disagrees with itself | yes, while `status: open` |
| `advisory` | style or completeness suggestion | no |
| `named-freedom` | the gap is intentional and now named | no |

## Pass bar

The spec is **cleared** when no open `divergence` or `contradiction` remains. Outstanding advisory findings are allowed. A probe that fails some Definition of Done items is evidence for the judge, not an automatic fail of the spec.

The spec is **not-cleared** while any blocking finding is open.

## Record

```text
node evals/sufficiency/run.cjs --work-item <id> --record --findings findings.yaml
```

Omit `--outcome` to derive `cleared` / `not-cleared` from findings. `--outcome cleared` is refused while a blocking finding is open.

Findings file shape:

```yaml
protocol: triangulation
findings:
  - id: F1
    class: divergence   # divergence | contradiction | advisory | named-freedom
    status: open        # open | resolved
    summary: one line
    detail: what diverged and where in the spec
    resolution: spec edit or named freedom (when resolved)
```

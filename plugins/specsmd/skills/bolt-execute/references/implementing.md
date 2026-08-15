# How to implement a bolt

Product code only after design hunts are closed. No ceremony. Do not wait for confirmation. Dispatch on each remaining **non-design** stage's id and `produces`, in snapshot order, in this invocation.

## 1. Load context

Same read path as design: `system/`, constitution + nearest standards, decisions index, brief, named tasks, this bolt's frontmatter. Apply the **longest matching** standards scope. Constitution always applies.

**Existing code:** read before write. Match naming and patterns. Preserve existing tests.

## 2. Show progress

```text
### Bolt progress
- [x] {completed}
- [ ] {current_stage}  ←
- [ ] {later}
```

## 3. Dispatch

| Match | Do this |
|---|---|
| `execute` / `implement` / `explore`, or empty `produces` | **Test first** (below) |
| `test` | **Prove** (below). Record evidence in `walkthrough.md`. |
| `review` or produces `review-report.md` | Severity-gated review. Load-bearing blocks completion. Record advisory findings and continue — do not ask. |
| `walkthrough` or produces `walkthrough.md` | Finish the walkthrough. |
| Design-class (id or produced file listed under `ceremony` in the contract) | Design is not done. Tell the user and follow `bolt-design`. |

## 4. Test first, cover always

**Coverage floor.** Every behavior this stage adds or changes gets a covering check in the same stage. No production file lands without one — unless walkthrough **Evidence** names the existing check that covers it, or a recorded decision exempts it (vendored or generated code). Follow the **engineering** standard's verification rules. If that standard is missing or its verification rule is an unfilled placeholder, **stop** and say exactly that — which file, which field — and offer `specsmd-init`. Do not proceed testless.

**Gating criteria are test-first.** For each gating criterion on the named tasks, one cycle:

1. Write a failing check that observes that criterion.
2. Run it. See it fail for the right reason. If it passes, the check is wrong.
3. Change the smallest amount of product behavior that makes the check pass.
4. Run again. Pass. Do not add behavior the criterion does not require.

Record the failing-first observation for each gating line in walkthrough **Evidence**. Never skip the failing check for a gating criterion. For other behavior, order is free; coverage is not.

**Case classes.** A behavior is covered when its checks observe:

- the acceptance path
- every refusal and error path
- boundaries — empty, zero, one, many, at-limit
- absent or null input
- replay or concurrent calls where the contract names idempotency

A class that does not apply is dismissed in one Evidence line — never silently skipped.

Then run the existing suite. A red suite you did not cause is a stop. A red suite you caused, you fix.

If implement would require choosing return, surfaces, set rule, shape, or credential and design did not close that hunt, **stop**. Tell the user the hunt is open and follow `bolt-design`.

## 5. Prove

1. Run the suite the engineering standard names.
2. Walk every **gating** Definition of Done line. Record the failing-first observation and observed vs expected in walkthrough **Evidence**.
3. Walk the changed production files. Each is named in Evidence by its covering check, by the existing check that covers it, or by a recorded exemption. A file with none of these: do not complete.
4. Do not complete while a gating line is unmet or the suite you own is red.

Evidence lives in `walkthrough.md`. There is no separate test-report file.

## 6. Walkthrough

Required headings: What changed, Why, Deviations from plan, Evidence, How to verify.

- **Deviations** always exists. `none` if nothing diverged.
- **Evidence** is what was run and what each gating line did. Plain invocations, not source.
- No language-tagged fences, no patches, no source dumps.

## Failures

Speak as remediation: what to change, where, which standard or spec line. A missing `completion_requires` file, a walkthrough without Deviations or Evidence, a fence, an unchecked gating line, or a changed behavior with no covering check, named cover, or recorded exemption: do not complete.

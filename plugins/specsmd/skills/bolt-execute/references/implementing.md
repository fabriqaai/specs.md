# How to implement a bolt

Product code only after design hunts are closed. Dispatch on the **current stage's id and `produces`**.

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
| `review` or produces `review-report.md` | Severity-gated review. Load-bearing blocks. |
| `walkthrough` or produces `walkthrough.md` | Finish the walkthrough. |
| `plan` / `domain-model` / `design` / `decisions` / `findings` | Design is not done. Tell the user and follow `bolt-design`. |

## 4. Test first

For each gating criterion on the named tasks, one cycle:

1. Write a failing check that observes that criterion. Follow the resolved **testing** standard.
2. Run it. See it fail for the right reason. If it passes, the check is wrong.
3. Change the smallest amount of product behavior that makes the check pass.
4. Run again. Pass. Do not add behavior the criterion does not require.

Then run the existing suite. A red suite you did not cause is a stop. A red suite you caused, you fix.

Never skip the failing check. Never start with product code and add tests after.

If implement would require choosing return, surfaces, set rule, shape, or credential and design did not close that hunt, **stop**. Tell the user the hunt is open and follow `bolt-design`.

## 5. Prove

1. Run the suite the testing standard names.
2. Walk every **gating** Definition of Done line. Record observed vs expected in walkthrough **Evidence**.
3. Do not complete while a gating line is unmet or the suite you own is red.

Evidence lives in `walkthrough.md`. There is no separate test-report file.

## 6. Walkthrough

Required headings: What changed, Why, Deviations from plan, Evidence, How to verify.

- **Deviations** always exists. `none` if nothing diverged.
- **Evidence** is what was run and what each gating line did. Plain invocations, not source.
- No language-tagged fences, no patches, no source dumps.

## Failures

Speak as remediation: what to change, where, which standard or spec line. A missing `completion_requires` file, a walkthrough without Deviations or Evidence, a fence, or an unchecked gating line: do not complete.

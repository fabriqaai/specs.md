# How to implement a bolt

Product code only after design hunts are closed. No ceremony. Do not wait for confirmation. Dispatch on each remaining **non-design** stage's id and `produces`, in snapshot order, in this invocation.

## 1. Load context

Same scoped read path as design: matching `system/` documents, constitution + nearest standards, relevant decisions, brief, named tasks, this bolt's frontmatter. Apply the **longest matching** standards scope. Constitution always applies.

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
| `review` whose recipe entry carries `loop` | **Review loop** (below) |
| `review` or produces `review-report.md` | Severity-gated review. Load-bearing blocks completion. Record advisory findings and continue — do not ask. |
| `walkthrough` or produces `walkthrough.md` | Finish the walkthrough. |
| Design-class (id or produced file listed under `ceremony` in the contract) | Design is not done. Tell the user and follow `bolt-design`. |

## 4. Test first, cover always

**Coverage floor.** Every behavior this stage adds or changes gets a covering check in the same stage, named existing coverage in walkthrough **Evidence**, or a recorded decision exempting it (vendored or generated code). Map evidence to changed behavior and owning boundaries. One check may cover several files; a file edit alone creates no additional evidence row. Follow the **engineering** standard's verification rules. If that standard is missing or its verification rule is an unfilled placeholder, **stop** and say exactly that — which file, which field — and offer `specsmd-init`. Do not proceed testless.

**Gating criteria for new or changed behavior are test-first.** Existing passing checks can prove unchanged behavior; removal alone needs no new absence test. For each new or changed behavior criterion on the named tasks, one cycle:

1. Write a failing check that observes that criterion.
2. Run it. See it fail for the right reason. If it already passes, inspect whether the desired behavior already exists; do not create an artificial failure.
3. Change the smallest amount of product behavior that makes the check pass.
4. Run again. Pass. Do not add behavior the criterion does not require.

Record the failing-first observation for changed behavior and the existing evidence for unchanged criteria in walkthrough **Evidence**. For other behavior, order is free; coverage is not.

**Case classes.** Select checks for the changed contract and relevant risks:

- the acceptance path
- applicable refusal and error paths
- boundaries — empty, zero, one, many, at-limit
- absent or null input
- replay or concurrent calls where the contract names idempotency

Omit irrelevant case classes from Evidence. Explain an unverified applicable case when it limits the completion claim; a missing gating check still blocks completion.

Run the relevant existing checks. Fix failures caused by this change. Report unrelated baseline failures and continue independent authorized work; do not claim an affected required gate passed. Broaden verification for changed boundaries or unresolved risks, not simply because another stage starts.

If implementation reveals a new unresolved material caller contract, **stop dependent work** and use `references/caller-contracts.md` in `flow-runtime`. Inherit settled return, surfaces, set rule, shape and credential decisions. Tell the user the hunt is open and follow `bolt-design`.

## 5. Prove

1. Run the relevant checks and any required suite the engineering standard names. Reuse passing results for the same state; repeat only after changes, failures or unresolved concerns justify it.
2. Walk every **gating** Definition of Done line. Record the failing-first observation and observed vs expected in walkthrough **Evidence**.
3. Review the diff for changed behavior and boundaries. Each is covered by a named check, existing evidence, or a recorded exemption. A changed behavior with none of these blocks completion.
4. Do not complete while a gating line is unmet or the suite you own is red.

Evidence lives in `walkthrough.md`. There is no separate test-report file.

## 6. Review loop

Applies when the review stage's recipe entry carries `loop`. Review is a lead generator; the loop closes on executable gates, **never on reviewer silence** — a round with no new findings does not end it, and a round with findings does not extend it past the budget. Each round:

1. **Regression gate.** After a round changes code, re-run the relevant checks recorded in Evidence; a regression is this round's first finding. Reuse passing results when the reviewed state is unchanged and no unresolved concern requires another run.
2. **Brief.** Write `review-brief.md` in the bolt folder from `references/brief.md` in the `bolt-review` skill: change surface, read-first order, known-open list from the ledger, verification commands with expected results.
3. **Review in a fresh context.** Each of the round's reviewers (`loop.reviewers`, default 1) follows the `bolt-review` skill in a context that has not seen this implementation work — a subagent when the harness has them, otherwise a new session pointed at the brief. The implementing context never grades its own work.
4. **Adjudicate into the ledger.** Append findings to `review-findings.md` (template: `references/review-findings.md` in the `bolt-review` skill) under `## Round {n}`. Dispositions move **forward only**: `OPEN → FIXED | REFUTED | ACCEPTED`. Never rewrite or delete an earlier round's entries. `REFUTED` cites evidence, not preference. A finding is load-bearing only if it affects correctness or the stated requirements — do not chase advisory findings into over-engineering.
5. **Fix load-bearing findings** in the implementing context. Every fix lands with a named regression check — the coverage floor of §4 applies to fixes.
6. Update `review_rounds_completed` and `last_round_verdict` on the bolt.

**Gates.** The loop is done when all three hold:

- the suite the engineering standard names is green
- at least one **external anchor** is green — an oracle this bolt did not write: conformance against a pinned schema, booting the production composition and probing it, or a named manual check recorded for the user
- every load-bearing finding in the ledger is `FIXED` or `REFUTED`

**Budget.** `loop.max_rounds` (default 2) is a hard ceiling; when the loop stalls, prefer re-deriving the fix from the spec over another repair round. Expiry with a load-bearing finding `OPEN` is a stop: do not complete; name the findings that remain. Expiry with only advisory findings open: continue to walkthrough with them recorded — **never scrub** or soften ledger entries to reach completion.

## 7. Capture unplanned work

Work reaches a bolt that no artifact asked for: a course correction mid-flight, a requirement nobody wrote down, a small change made because it was obviously needed. Left uncaptured, the artifacts describe a bolt the code no longer matches, and the next bolt plans from fiction.

Record each one in the walkthrough's `## Unplanned changes` **when it happens**. Reconstructing a long session at the end loses the small ones, and the small ones are most of them. A change that alters no observable behavior — a rename, a comment, formatting — needs no row: this section keeps the artifacts and the behavior in step, and those changes move neither.

Then choose the owning artifact from accepted scope and project conventions. Work **extends** a task this bolt named when a caller exercising that task's behavior would meet the change; it falls **outside** when it serves an outcome no named task states. Routine placement is an implementation decision; an unresolved material choice about scope, caller behavior, authority or acceptance needs the user.

**Clear destination inside this bolt — write it, then say what you wrote.** Do not stop for approval:

- a decision this bolt recorded that the new direction overtakes → add a dated correction to that decision naming what changed and why
- behavior that extends a task this bolt named → add a Definition of Done line to that `tasks.md` section, marked as added during this bolt
- a one-off with no future reader → the walkthrough row is the whole record

**Unresolved material choice — ask once, then act on the answer.** Follow `references/caller-contracts.md` in the `flow-runtime` skill. Reuse prior answers and authorization; two plausible file locations alone do not need a question. Ask when evidence leaves a choice about:

- extending scope beyond the authorized outcome
- incompatible caller behavior or authority
- changing an accepted outcome or **gating** Definition of Done line

Route authorized outcome edits through `plan-intent` and task acceptance edits through `task-decompose` in the same turn when the requested workflow includes them. Artifact routing preserves authorization and the selected gates; it does not create another permission requirement.

Never weaken a gating criterion to match what was built. A gating line that no longer describes the wanted behavior is the user's decision, taken through `plan-intent` or `task-decompose`. Rewriting it here turns a defect into a requirement, and every bolt completes green.

A new unresolved caller-visible contract — return, surfaces, set rule, shape, credential — returns dependent work to `bolt-design`, as §4 requires. A documentation omission already settled by accepted evidence can be captured directly; it creates no new hunt or decision.

Each row carries a disposition: **captured** — an artifact now covers it, named in the row; **accepted as-is** — the user declined to capture it, and the row is the only record; **open** — no destination yet, which is a stop at complete. A disposition moves forward in place, `open → captured | accepted as-is`, and that cell is the only part of a row that changes. Everything else in the section is append-only.

Once the bolt is complete, append a dated row instead of editing an existing one or reopening the bolt. A post-completion row carries the same dispositions, and the change it records carries a covering check like any other. Substantial follow-on work is a new slice, not an amendment.

## 8. Walkthrough

Write it per `references/writing.md` in the `flow-runtime` skill. The walkthrough is a **record**: append corrections, do not edit what an earlier stage recorded.

Required headings: What changed, Why, Deviations from plan, Unplanned changes, Evidence, How to verify.

- **Deviations** always exists. `none` if nothing diverged. A deviation is work an artifact asked for that went another way; an **unplanned change** is work no artifact asked for at all.
- **Unplanned changes** always exists. `none` if every change traces to a task, design, or decision.
- **Evidence** is what was run and what each gating line did. Plain invocations, not source.
- No language-tagged fences, no patches, no source dumps.

## Failures

Speak as remediation: what to change, where, which standard or spec line. A missing `completion_requires` file, a walkthrough without Deviations, Unplanned changes, or Evidence, a fence, an unchecked gating line, a changed behavior with no covering check, named cover, or recorded exemption, an unplanned change still `open`, or a load-bearing finding still `OPEN` in `review-findings.md`: do not complete.

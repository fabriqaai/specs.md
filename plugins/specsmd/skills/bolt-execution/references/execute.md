# How to execute a bolt

One loop. The recipe is the catalog — do not invent stages. Dispatch on the **current stage's id and `produces`**, not on a hardcoded sequence.

The implementer has zero project context and will guess. Close every gap with an observation, a standard, or a named freedom.

## 1. Load context (every resume, before any write)

Read in this order. Do not skip because the request "sounds small."

1. **Semantic truth** — `docs/specsmd/system/` documents whose claimed scope matches this bolt. These are current. Do not open episodic history unless a semantic doc points there.
2. **Standards** — `docs/specsmd/standards/constitution.md` (root only, never overridden). Then the nearest `tech-stack`, `coding`, `testing`, `architecture`, `nlspec` for the paths you will touch (`standards/scopes/{module}/` beats root).
3. **Decisions index** — `docs/specsmd/decisions/index.md`. Open a decision only when `consult_when` matches this bolt.
4. **Specs** — the intent brief and every work item named on this bolt. The brief's outcome and Definition of Done are law. Work-item gating criteria are the completion bar.
5. **This bolt** — `bolt.md` frontmatter (`current_stage`, `checkpoint_state`, `recipe_snapshot`). Resume from those fields, never from which files exist.

When editing a path, apply the **longest matching** standards scope. Constitution always applies.

**Existing code:** read the current shape before writing. Match naming and patterns already in the tree. Preserve existing tests. Do not restructure unrelated files.

## 2. Show progress

At the start of every Run turn, print the recipe stages:

```text
### Bolt progress
- [x] {completed stage}
- [ ] {current_stage}  ←
- [ ] {later stage}
```

Then do one stage. Do not jump ahead.

## 3. Dispatch the current stage

Match **id** first, then **produces** basename. First match wins.

| Match | Do this | Source may change? |
|---|---|---|
| `plan` or produces `plan.md` | Write the approach as observable change + how we will know. No product code. | No |
| `domain-model` or produces `domain-model.md` | Name the bounded context, ubiquitous language (one term, one meaning), and invariants a caller can observe. Table the terms. No product code. | No |
| `design` or produces `design.md` | Observable contracts: shapes, defaults, errors, recovery. No product code if `no_source_code` applies. | No |
| `decisions` or produces `decisions.md` | One file per decision under `docs/specsmd/decisions/` plus a line on the index with `consult_when`. Rationale names the rejected alternative. | No |
| `execute` / `implement` / `explore`, or empty `produces` | See **Implement (test first)** below. | Yes, after the gate is `granted` or `not-required` |
| `test` | See **Prove** below. Record evidence in `walkthrough.md`. | Tests only |
| `review` or produces `review-report.md` | Severity-gated review. Load-bearing blocks. Advisory may be acknowledged, deferred, or contested. | Fixes for load-bearing only |
| `walkthrough` or produces `walkthrough.md` (and not already covered) | Finish the walkthrough. | No |
| `findings` or produces `findings.md` | What was tried, what is now believed, what is still unknown. Partial findings are valid. | No |

Use the bundled template when the basename matches. Honor recipe constraints (`no_source_code` on listed stages; expired `time_box` completes into findings).

## 4. Implement (test first)

Only on implementation stages, and only when `checkpoint_state` is `granted` or `not-required`.

For each gating criterion on the named work items, one cycle:

1. Write a failing check that observes that criterion. Follow the resolved **testing** standard (names, layout, runner).
2. Run it. See it fail for the right reason. If it passes, the check is wrong — fix the check, not the product.
3. Change the smallest amount of product behavior that makes the check pass.
4. Run the check again. Pass. Do not add behavior the criterion does not require.

Then run the project's existing suite. A red suite you did not cause is a stop: say so. A red suite you caused, you fix.

Never skip the failing check because the change "is obviously right." Never start with product code and add tests after.

Brownfield: the failing check may be an extension of an existing test. Prefer that over a new file when the standard says so.

## 5. Prove

After implementation (or when the current stage is `test`):

1. Run the suite the testing standard names.
2. Walk every **gating** Definition of Done line on the named work items. Record observed vs expected in the walkthrough **Evidence** section.
3. Do not complete the bolt while a gating line is unmet or the suite you own is red.

Evidence lives in `walkthrough.md`. There is no separate test-report file.

## 6. Walkthrough

Every completed bolt has one walkthrough. Required headings: What changed, Why, Deviations from plan, Evidence, How to verify.

- **Deviations** always exists. `none` if nothing diverged.
- **Evidence** is what was run and what each gating line did. Commands as plain invocations, not source listings.
- **How to verify** is what a later human or agent repeats.
- No language-tagged fences, no patches, no source dumps.

## Failures

Guardrail failures speak as remediation: what to change, where, which standard or spec line says so. Do not dump a stack and stop.

A missing `completion_requires` file, a walkthrough without Deviations, a fence in the walkthrough, or an unchecked gating line: do not complete. Name what is missing.

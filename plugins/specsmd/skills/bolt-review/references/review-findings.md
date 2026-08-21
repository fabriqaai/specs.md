# Review findings

Dispositions move forward only: `OPEN → FIXED | REFUTED | ACCEPTED`. Never rewrite or delete an earlier round's entries. `FIXED` names the regression check that pins the fix. `REFUTED` cites evidence, not preference. `ACCEPTED` records an advisory finding the bolt will not act on, with the reason.

## Round {n} — {date}

| ID | Severity | Where | Defect | Disposition |
|---|---|---|---|---|
| R{n}.1 | load-bearing | {file}:{line} | {one-line defect} | OPEN |
| R{n}.2 | advisory | {file}:{line} | {one-line defect} | OPEN |

- **R{n}.1** — {failure scenario}. Evidence: {what was run or read}. Fix direction: {one sentence}.
- Reviewer verified: {commands and results}. Not verified: {list}.

### Round {n} adjudication

- R{n}.1 → FIXED — pinned by {check}.
- R{n}.2 → ACCEPTED — {reason}.

## Verdict

{after the latest round: load-bearing remaining (count), gates status (suite, external anchor), rounds used of max}

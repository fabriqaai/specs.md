# Review brief

## What you are reviewing

{bolt id, intent, named tasks, round number}

## Ground rules

- Strictly read-only: do not edit files, run formatters, or mutate git.
- Verify before reporting: cite {file}:{line} and run the nearest check.
- Read `review-findings.md` first. Do not re-report the known-open list below.
- Load-bearing means it affects correctness or the stated requirements. Everything else is advisory.

## Read first

{ordered list: intent brief, tasks.md sections, design artifacts, review-findings.md, changed code}

## Change surface

{files and areas this bolt touched, with one line each on what changed}

## Known-open

{already-dispositioned or open items — do not re-report; challenge a disposition only with evidence}

## Verification commands

{commands with expected results, e.g. suite invocations with expected counts}

## Report format

One entry per finding: Severity / Where / Defect / Failure scenario / Evidence / Fix direction.
Close with what you verified, what you did not verify, and any recorded disposition you believe is wrong.

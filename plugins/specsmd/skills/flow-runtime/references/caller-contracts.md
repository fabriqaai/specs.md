# Caller-visible contracts

Two implementers using the artifact and its named contract references must produce interchangeable behavior for a caller. Internal structure may differ. Check relevant contracts at intent, task and bolt design; inherit settled answers rather than repeating an interview at each layer.

| Check | Resolve |
|---|---|
| **Return** | When the result becomes observable; acceptance versus completion |
| **Surfaces** | Which callers are in scope and which remain unchanged |
| **Set rule** | How to enumerate a complete set without guessing |
| **Shape** | Fields, defaults, omitted input, errors, duplicate/stale-write behavior and recovery |
| **Credential** | The caller's authority and how it is presented |

## Resolve from evidence before asking

1. Reuse the user's current instruction, prior answers and authorization for this task.
2. Read the relevant accepted decisions, intent and tasks, following the project's authority and scope rules.
3. Inspect owning code, types, schemas and behavior tests for mechanics and conventions. Code that conflicts with a retained requirement is not permission to change that requirement.
4. Resolve settled facts immediately, including in the same turn they are identified. Record a precise source reference once. Unchanged contracts need no new decision; irrelevant checks need no invented answer.
5. Choose routine reversible implementation details within the authorized scope. State an assumption only when it matters for review. Do not ask the user to pick filenames, internal structure or an interchangeable implementation.
6. Ask only when evidence leaves a material choice about outcome, scope, caller behavior, authority, an irreversible action or an acceptance condition. Continue independent work while a required answer is pending; dependent work waits.

Use a concise question with real alternatives and a recommendation where useful. Batch a few independent questions when it reduces interruptions; keep dependent choices sequential. Do not invent a third option. A named freedom is legitimate only when alternatives are acceptable under the retained contract, never a waiver of missing authority.

## Intent conflict and capture

- **Already settled:** inherit the decision and reference its source. Do not ask again because another stage or artifact needs it.
- **Authorized elaboration:** record a user-chosen or evidence-backed detail in the owning task/design. Update the brief only when the authorized change belongs at the outcome layer. An explicit instruction naming the choice and destination already authorizes that capture.
- **New scope or contradiction:** show the conflicting requirements and the concrete change needed. Ask for the unresolved decision before changing scope or acceptance criteria. Never weaken a gating criterion to match what was built.

A new caller contract still needs design before implementation. A documentation omission settled by accepted evidence does not require another permission turn. A substantive open choice must remain open until answered; silence is not approval.

## How to record

The artifact being written has `## Two-implementer` (use `###` inside a task section). Record the resolved observations or precise inherited-contract references, plus any legitimate implementation freedoms. Two incompatible readings in the active contract require repair before dependent implementation.

```markdown
## Two-implementer

- Return: {observation or exact accepted-contract reference}
- Surfaces: {changed callers; unchanged callers where relevant}
- Set rule: {procedure, or not applicable with reason}
- Shape: {contract reference or local table}
- Credential: {retained authority reference or chosen contract}

Open: {unresolved material choices; write none. only after assessment}
```

`Open: none.` is required on completed design artifacts before dependent implementation. It means the applicable checks are resolved, not that the checklist was printed. A placeholder is unresolved. Completed artifacts may link to a settled contract rather than duplicate it. Do not reopen an accepted design solely because a later stage starts.

## Review gates

Clarification and artifact approval are different. Use **Artifact review** in `transitions.md` to review saved files with links and a concise summary. Resolve questions using the policy above; preserve the selected ceremony from `flow-contract.yaml` and the requested phase boundary. A design-only request does not authorize product code. Available prior authorization survives re-entry and compaction; missing authorization is not invented.

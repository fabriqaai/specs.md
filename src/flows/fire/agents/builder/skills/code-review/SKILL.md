# Skill: Code Review

Review code written during a run, auto-fix no-brainer issues, and suggest improvements requiring confirmation.

---

## Trigger

- Invoked by run-execute after tests pass (Step 6b)
- Receives: files_created, files_modified, run_id, intent context

---

## Degrees of Freedom

**LOW for auto-fixes** — Only mechanical, non-semantic changes.
**MEDIUM for suggestions** — Present options, let user decide.

---

## Workflow

```xml
<skill name="code-review">

  <mandate>
    REVIEW all files created/modified in current run.
    AUTO-FIX only mechanical, non-semantic issues.
    ALWAYS CONFIRM security, architecture, and behavioral changes.
    RESPECT project coding standards from .specs-fire/standards/.
    NEVER break working code — if tests passed, be conservative.
    RE-RUN tests after auto-fixes — revert if tests fail.
  </mandate>

  <step n="1" title="Gather Context">
    <action>Receive files_created and files_modified from parent workflow</action>
    <action>Load project standards:</action>
    <substep>.specs-fire/standards/coding-standards.md</substep>
    <substep>.specs-fire/standards/testing-standards.md</substep>

    <action>Detect project tooling:</action>
    <substep>Check for .eslintrc, eslint.config.js (JavaScript/TypeScript)</substep>
    <substep>Check for .prettierrc (formatting)</substep>
    <substep>Check for golangci.yml (Go)</substep>
    <substep>Check for pyproject.toml, ruff.toml (Python)</substep>

    <action>Read each file to be reviewed</action>

    <output>
      Reviewing {file_count} files...
    </output>
  </step>

  <step n="2" title="Run Project Linters (if available)">
    <check if="eslint config exists">
      <action>Run: npm run lint --fix 2>&1 || npx eslint --fix {files}</action>
      <action>Parse output for remaining issues</action>
    </check>

    <check if="golangci config exists">
      <action>Run: golangci-lint run --fix {files}</action>
      <action>Parse output for remaining issues</action>
    </check>

    <check if="ruff/pyproject config exists">
      <action>Run: ruff check --fix {files}</action>
      <action>Parse output for remaining issues</action>
    </check>

    <check if="no linter configured">
      <action>Use built-in review rules from references/review-categories.md</action>
    </check>
  </step>

  <step n="3" title="Analyze Code">
    <action>For each file, check against review categories:</action>
    <substep>Code Quality — unused imports, console statements, formatting</substep>
    <substep>Security — hardcoded secrets, injection vulnerabilities, missing validation</substep>
    <substep>Architecture — code placement, coupling, error handling</substep>
    <substep>Testing — coverage gaps, edge cases, brittle patterns</substep>

    <action>Classify each finding using references/auto-fix-rules.md:</action>
    <substep>AUTO-FIX: Mechanical, non-semantic, reversible, tests won't break</substep>
    <substep>CONFIRM: Behavioral change, security implication, judgment required</substep>

    <action>Group findings by category and severity</action>
  </step>

  <step n="4" title="Apply Auto-Fixes">
    <check if="auto-fix issues found">
      <action>Apply all AUTO-FIX changes</action>
      <action>Track each change made (file, line, before, after)</action>

      <critical>Re-run tests to verify no breakage</critical>
      <action>Run project test command</action>

      <check if="tests fail after auto-fix">
        <output>
          Auto-fix caused test failure. Reverting...
        </output>
        <action>Revert all auto-fix changes</action>
        <action>Move failed fixes to CONFIRM category</action>
      </check>

      <check if="tests pass">
        <output>
          Auto-fixed {count} issues. Tests still passing.
        </output>
      </check>
    </check>
  </step>

  <step n="5" title="Generate Review Report">
    <action>Create review report using template: templates/review-report.md.hbs</action>
    <action>Write to: .specs-fire/runs/{run-id}/review-report.md</action>
    <action>Include: auto-fixed issues, pending suggestions, skipped items</action>
  </step>

  <step n="6" title="Present Suggestions">
    <check if="no suggestions requiring confirmation">
      <output>
        ## Code Review Complete

        Auto-fixed {auto_count} issues. No additional suggestions.

        Review report: .specs-fire/runs/{run-id}/review-report.md
      </output>
      <return>success</return>
    </check>

    <check if="suggestions exist">
      <output>
        ## Code Review Complete

        **Auto-fixed ({auto_count} issues)**:
        {for each auto_fixed}
        - {description} ({file}:{line})
        {/for}

        **Suggestions requiring approval ({suggest_count} issues)**:

        {for each suggestion with index}
        {index}. **[{category}]** {title}
           - File: {file}:{line}
           - Suggestion: {description}
           - Risk: {risk_level}
        {/for}

        ---
        Apply suggestions?
        [a] Apply all suggestions
        {for each suggestion with index}
        [{index}] Apply #{index} only ({category})
        {/for}
        [s] Skip all suggestions
        [r] Review each individually
      </output>

      <checkpoint>Wait for user response</checkpoint>
    </check>
  </step>

  <step n="7" title="Process User Choice">
    <check if="response == a">
      <action>Apply all suggestions</action>
      <action>Re-run tests</action>
      <action>Update review-report.md with applied status</action>
    </check>

    <check if="response == s">
      <action>Skip all suggestions</action>
      <action>Update review-report.md with skipped status</action>
    </check>

    <check if="response == r">
      <iterate over="suggestions" as="suggestion">
        <output>
          **[{suggestion.category}]** {suggestion.title}

          File: {suggestion.file}:{suggestion.line}

          Current code:
          ```
          {suggestion.current_code}
          ```

          Suggested change:
          ```
          {suggestion.suggested_code}
          ```

          Rationale: {suggestion.rationale}

          Apply this change? [y/n]
        </output>
        <checkpoint>Wait for response</checkpoint>
        <check if="response == y">
          <action>Apply this suggestion</action>
        </check>
      </iterate>
      <action>Re-run tests if any changes applied</action>
    </check>

    <check if="response is number">
      <action>Apply only the numbered suggestion</action>
      <action>Re-run tests</action>
      <action>Update review-report.md</action>
    </check>
  </step>

  <step n="8" title="Return to Parent">
    <action>Return summary to run-execute workflow:</action>
    <return>
      {
        "success": true,
        "auto_fixed_count": {count},
        "suggestions_applied": {count},
        "suggestions_skipped": {count},
        "tests_passing": true,
        "report_path": ".specs-fire/runs/{run-id}/review-report.md"
      }
    </return>
  </step>

</skill>
```

---

## Input Context

The skill receives from run-execute:

```yaml
files_created:
  - path: src/auth/login.ts
    purpose: Login endpoint handler
  - path: src/auth/login.test.ts
    purpose: Unit tests for login

files_modified:
  - path: src/routes/index.ts
    changes: Added login route

run_id: run-001
intent_id: user-auth
```

---

## Output Artifact

Creates `.specs-fire/runs/{run-id}/review-report.md` with:
- Summary table (auto-fixed, suggested, skipped by category)
- Detailed list of auto-fixed issues with diffs
- Applied suggestions with approval timestamps
- Skipped suggestions with reasons

---

## References

| Reference | Purpose |
|-----------|---------|
| `references/review-categories.md` | Categories and what to check |
| `references/auto-fix-rules.md` | Rules for auto-fix vs confirm |

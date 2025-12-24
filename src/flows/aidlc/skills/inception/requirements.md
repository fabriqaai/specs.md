# Skill: Gather Requirements

---

## Progress Display

Show at start of this skill:

```text
### Inception Progress
- [x] Intent created
- [ ] Requirements gathered  ← current
- [ ] Artifacts reviewed (Context + Units + Stories + Bolts)
- [ ] Ready for Construction
```

---

## Checkpoints in This Skill

| Checkpoint | Purpose | Wait For |
|------------|---------|----------|
| Checkpoint 1 | Clarifying questions | User answers |
| Checkpoint 2 | Requirements review | User approval |

---

## Goal

Elicit, analyze, and document functional and non-functional requirements through structured inquiry.

---

## Input

- **Required**: Intent name or path
- **Required**: `.specsmd/aidlc/memory-bank.yaml` - artifact schema
- **Optional**: Existing `requirements.md` to update

**Note**: Agents load project standards automatically (see `.specsmd/aidlc/context-config.yaml`). Do not duplicate them in requirements.

---

## Process

### Step 1: Clarifying Questions

**Checkpoint 1**: Present questions before generating anything:

```text
Before I generate requirements, I need to understand:
1. Who are the primary users?
2. What key outcomes matter?
3. Any constraints (regulatory, technical, timeline)?
4. How will we measure success?
5. What concerns you most?
```

**Wait for user response.**

---

### Step 2: Generate Requirements

After user answers, generate functional and non-functional requirements.

**Functional Requirements** - ask about:

- Main user flows → Core functionality
- Error cases → Exception handling
- Data storage → Data requirements
- Integrations → External dependencies

**Non-Functional Requirements** - ask about:

- Performance: Response time, throughput
- Scalability: Concurrent users, growth
- Security: Authentication, data sensitivity
- Reliability: Uptime, failure tolerance
- Compliance: Regulatory, audit

**IMPORTANT**: Do NOT duplicate project standards. Only document intent-specific constraints.

### Step 3: Document Requirements

1. **Read Path**: Check `schema.requirements` from `.specsmd/aidlc/memory-bank.yaml`
   *(Default: `memory-bank/intents/{intent-name}/requirements.md`)*

2. **Use Template**: `.specsmd/aidlc/templates/inception/requirements-template.md`

3. **Structure**:

   ```markdown
   ## Functional Requirements
   ### FR-1: {Title}
   - **Description**: {What the system must do}
   - **Acceptance Criteria**: {Measurable conditions}
   - **Priority**: {Must/Should/Could}

   ## Non-Functional Requirements
   ### NFR-1: Performance
   - **Metric**: Response time < 200ms for 95th percentile
   ```

4. **Validate Testability**:
   - ❌ "Fast response" → ✅ "Response < 200ms p95"
   - ❌ "Secure" → ✅ "OAuth 2.0 with MFA"
   - ❌ "Scalable" → ✅ "Support 10K concurrent users"

---

### Step 4: Requirements Review

**Checkpoint 2**: Present FULL requirements for approval.

**CRITICAL: Do NOT summarize. Show complete details for each requirement.**

**Show progress indicator before requirements:**

```text
### Inception Progress
- [x] Intent created
- [ ] Requirements gathered ← current (Checkpoint 2: approval)
- [ ] Artifacts reviewed (Context + Units + Stories + Bolts)
- [ ] Ready for Construction
```

Present exactly as documented:

```text
### Requirements Review

## Functional Requirements

### FR-1: {Title}
- **Description**: {full description}
- **Acceptance Criteria**: {all criteria}
- **Priority**: {Must/Should/Could}

### FR-2: {Title}
- **Description**: {full description}
- **Acceptance Criteria**: {all criteria}
- **Priority**: {Must/Should/Could}

{continue for all FR and NFR...}

---

Do these requirements capture your intent?
1 - Yes, continue to generate artifacts
2 - Need changes (specify what's missing/wrong)
```

**Wait for user response.**

---

## Output

```markdown
## Requirements Summary: {intent-name}

### Functional Requirements

- [ ] **FR-1**: {description} - Priority: Must - Status: Draft
- [ ] **FR-2**: {description} - Priority: Should - Status: Draft

### Non-Functional Requirements

- **Performance**: Response time < 200ms p95
- **Security**: OAuth 2.0 + MFA

### Technical Constraints

Required standards will be loaded from memory-bank standards folder by Construction Agent.

Intent-specific constraints:
- {any feature-specific constraint not in standards}

### Artifact Updated
- `{intent-path}/requirements.md`

### Actions

1 - **context**: Define system context and boundaries
2 - **menu**: Return to inception menu

### Suggested Next Step
→ **context** - Define system boundaries for `{intent-name}`

**Type a number or press Enter for suggested action.**
```

---

## After Approval

Once requirements are approved at Checkpoint 2:

1. Save to `{intent}/requirements.md`
2. Update inception-log.md with artifact status
3. Proceed to generate remaining artifacts (Context + Units + Stories + Bolts)

---

## Transition

After requirements approved → Generate batched artifacts:

- System Context
- Units
- Stories
- Bolt Plan

These will be reviewed together at Checkpoint 3 (Artifacts Review).

---

## Test Contract

```yaml
input: User answers to 5 clarifying questions
output: requirements.md with FR-1..n, NFR-1..n
checkpoints: 2
  - Checkpoint 1: Clarifying questions answered
  - Checkpoint 2: Requirements approved
```

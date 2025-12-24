# Skill: Create Intent

---

## Progress Display

Show at start of this skill:

```text
### Inception Progress
- [ ] Intent created  ← this skill
- [ ] Requirements gathered (Checkpoint 1, Checkpoint 2)
- [ ] Artifacts reviewed (Checkpoint 3)
- [ ] Ready for Construction (Checkpoint 4)
```

---

## Checkpoints in This Skill

**NO Checkpoint** - This skill is a prerequisite to the checkpoint workflow.

Intent creation is a simple initialization step. The workflow checkpoints begin in the `requirements` skill.

---

## Goal

Guide the user to define a high-level feature (Intent) and initialize its structure in the Memory Bank.

---

## Input

- **Required**: User's feature idea or request
- **Required**: `.specsmd/aidlc/memory-bank.yaml` - artifact schema
- **Optional**: `memory-bank/project.yaml` - project type for context-aware suggestions

---

## Process

### 0. Load Project Context

**Before asking questions**, read project configuration:

1. Read `memory-bank/project.yaml` to get `project_type`
2. List `memory-bank/intents/` directory to see existing intents

---

#### Case A: FIRST Intent (no intents exist)

**Be creative** and suggest 3-4 relevant intent examples based on project type.

Consider the project type and generate suggestions that:

- Are common starting points for that type of application
- Provide foundational functionality to build upon
- Are appropriately scoped for an intent (not too large, not too small)

**Show to user:**

```markdown
## Create Your First Intent

**Project Type**: {project_type}

Here are some ideas for your first feature:
- "{creative suggestion 1 relevant to project type}"
- "{creative suggestion 2 relevant to project type}"
- "{creative suggestion 3 relevant to project type}"

Or tell me what you'd like to build.
```

If `project.yaml` doesn't exist, ask what they want to build without suggestions.

---

#### Case B: Subsequent Intents (intents already exist)

Analyze existing intents to understand project context and suggest related features:

1. **Read existing intent names** from `memory-bank/intents/` folder names
2. **Read requirements.md** from each existing intent to understand scope
3. **Infer project domain** (e.g., e-commerce, SaaS, developer tool, social platform)
4. **Suggest complementary features** that would naturally extend the existing functionality

**Example Analysis:**

If existing intents are:

- `001-user-authentication`
- `002-product-catalog`

Then suggest:

- "Shopping cart and checkout" (natural next step for e-commerce)
- "Order management and history" (complements product catalog)
- "User reviews and ratings" (enhances product catalog)
- "Wishlist functionality" (user engagement feature)

**Show to user:**

```markdown
## Create New Intent

Based on your existing intents:
- `001-user-authentication` - {brief description from requirements}
- `002-product-catalog` - {brief description from requirements}

Your project appears to be a **{inferred domain, e.g., "e-commerce platform"}**.

Here are some features that might complement your existing work:
- "{suggestion 1}"
- "{suggestion 2}"
- "{suggestion 3}"

Or tell me what you'd like to build next.
```

### 1. Elicit Intent Details

Ask clarifying questions to understand the intent:

- **"What is the name for this intent?"** → Get kebab-case identifier (e.g., `user-authentication`)
- **"What problem does this solve?"** → Understand business value
- **"Who benefits from this?"** → Identify stakeholders
- **"What's in scope vs out of scope?"** → Set boundaries early

**IMPORTANT**: Intent names MUST have a 3-digit numeric prefix to indicate implementation order:

- Format: `{NNN}-{intent-name}` (e.g., `001-user-authentication`, `002-payment-processing`)
- Check existing intents to determine next available number
- First intent is `001-*`, second is `002-*`, etc.

Note: All naming (units, stories) is derived from folder names. No prefix fields needed in frontmatter.

### 2. Classify Intent Type

Determine the intent category:

- **New Feature**: Brand new capability (e.g., "Add payment processing")
- **Enhancement**: Improve existing feature (e.g., "Add MFA to auth")
- **Bug Fix**: Correct defective behavior (e.g., "Fix checkout race condition")
- **Refactor**: Technical improvement (e.g., "Migrate to new API version")
- **Infrastructure**: Platform/DevOps change (e.g., "Add caching layer")

### 3. Initialize Artifacts

Once confirmed, perform these file operations:

1. **Read Schema**: Check `.specsmd/aidlc/memory-bank.yaml` for `intents` path
   *(Default: `memory-bank/intents/{intent-name}/`)*

2. **Create Directory**:

   ```text
   {schema.intents}/{intent-name}/
   ```

3. **Create `requirements.md`**:
   - Use template: `.specsmd/aidlc/templates/inception/requirements-template.md`
   - Populate Goal and Scope with user input
   - Set status to `draft`

4. **Create `inception-log.md`**:
   - Use template: `.specsmd/aidlc/templates/inception/inception-log-template.md`
   - Initialize with intent metadata and empty sections
   - Track progress, decisions, and scope changes

### 5. Confirm Creation

Show confirmation with **exactly ONE action list** - no workflow overview, no extra lists:

```markdown
## Intent Created: `{intent-name}`

**Goal**: {user's stated goal}
**Type**: {intent type}
**Location**: `{intent-path}/`

Files created:
- `requirements.md` (draft)
- `inception-log.md` (progress tracker)

1 - **requirements**: [Recommended] Gather detailed requirements
2 - **context**: Define system context and boundaries
3 - **menu**: Return to inception menu

**Type a number to continue.**
```

---

## Transition

After intent created:

- → **requirements** - begin checkpoint workflow at Checkpoint 1

---

## Test Contract

```yaml
input: User's feature idea
output: Intent directory with requirements.md and inception-log.md
checkpoints: 0 (prerequisite to workflow)
```

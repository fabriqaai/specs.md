# Unit Brief: Specification Contract Testing

## Overview

Schema validation and contract enforcement for specsmd flow files. This unit ensures that all YAML configs and markdown templates conform to their defined schemas.

---

## Scope

### In Scope

- YAML config validation (memory-bank.yaml, context-config.yaml, catalog.yaml)
- Markdown template validation (skills, agents)
- Declarative YAML-based schema definitions
- Fast, lightweight validation (<300ms)

### Out of Scope

- Content quality validation (handled by Agent Behavior Evaluation unit)
- Runtime behavior testing (handled by CLI/Installer Testing unit)
- LLM output evaluation (handled by Agent Behavior Evaluation unit)
- Spec file validation (specs are documentation, not runtime)

---

## Technical Context

### Entry Points

- `npm run test:schema` - Run all schema validation tests
- `npm run lint:md` - Run markdown linting

### Dependencies

- **vitest** - Test runner
- **unified/remark-parse** - Markdown AST parsing
- **js-yaml** - YAML parsing
- **glob** - File discovery

### Outputs

- Test reports with pass/fail status
- Validation errors with file paths

---

## Components

### 1. YAML Config Validator

**Purpose**: Validate YAML configuration files

**Location**: `src/lib/yaml-validator.ts`

**Schema Format** (YAML-based):

```yaml
# __tests__/schemas/memory-bank.schema.yaml
name: memory-bank
description: Memory bank configuration

required_keys:
  - structure
  - schema

nested_required:
  schema:
    - intents
    - units
    - bolts
    - standards
```

**Validated Files**:

| File | Schema | Purpose |
|------|--------|---------|
| `memory-bank.yaml` | `memory-bank.schema.yaml` | Memory bank structure |
| `context-config.yaml` | `context-config.schema.yaml` | Agent context loading |
| `catalog.yaml` | `catalog.schema.yaml` | Standards catalog |

### 2. Markdown Template Validator

**Purpose**: Validate markdown templates have required sections

**Location**: `src/lib/markdown-validator.ts`

**Schema Format** (YAML-based):

```yaml
# __tests__/schemas/skill.schema.yaml
name: skill
description: Agent skill file template

required_sections:
  - heading: "## Goal"
  - heading: "## Input"
  - heading: "## Process"
  - heading: "## Output"

rules:
  min_content_length: 300
  must_start_with_h1: true
```

**Validated Files**:

| Pattern | Schema | Purpose |
|---------|--------|---------|
| `skills/**/*.md` | `skill.schema.yaml` | Skill files |
| `agents/*.md` | `agent.schema.yaml` | Agent definitions |

### 3. Markdownlint

**Purpose**: Enforce markdown formatting consistency

**Location**: `.markdownlint.yaml`

**Key Rules**:

```yaml
MD001: true  # Heading levels increment by one
MD003:
  style: atx  # ATX-style headings (#)
MD013: false # Line length (disabled)
MD025: true  # Single top-level heading
MD041: true  # First line should be H1
```

---

## Implementation Notes

### Validation Libraries

Two custom validators were created to keep dependencies minimal:

1. **yaml-validator.ts** (~90 lines)
   - Validates required keys and nested keys
   - Uses js-yaml for parsing
   - Simple, declarative YAML schemas

2. **markdown-validator.ts** (~120 lines)
   - Uses remark to parse markdown AST
   - Validates required headings/sections
   - Supports nested section requirements

### Why Custom vs Third-Party

| Library | Issue |
|---------|-------|
| `ajv` (JSON Schema) | Verbose schemas, overkill for simple validation |
| `yaml-schema-validator` | Treats dynamic keys as errors |
| `remark-lint` | Requires custom plugins for section validation |

Custom validators are:
- Simple (~200 lines total)
- Declarative (YAML schemas)
- Fast (<300ms for all tests)
- No external dependencies beyond js-yaml and remark

---

## Acceptance Criteria

### AC-1: YAML Config Validation

- GIVEN a YAML config file in `flows/aidlc/`
- WHEN schema validation runs
- THEN required keys are checked
- AND nested required keys are validated
- AND missing keys produce specific errors

### AC-2: Markdown Template Validation

- GIVEN a skill or agent file
- WHEN markdown validation runs
- THEN required sections are checked
- AND missing sections produce errors
- AND content rules (min length, H1 start) are enforced

### AC-3: Test Performance

- GIVEN all schema tests
- WHEN `npm run test:schema` runs
- THEN all tests complete in < 300ms
- AND test output is clear and actionable

### AC-4: Schema Maintainability

- GIVEN a new config file type
- WHEN adding validation
- THEN create a YAML schema file (~10 lines)
- AND add one test case (~15 lines)
- AND no library code changes needed

# Unit Brief: Standards Templates

## Overview

Standards Templates define the output format for generated standard files. After the Master Agent gathers decisions using facilitation guides, it uses these templates to create well-structured markdown files in the memory bank.

---

## Scope

### In Scope
- Output file structure for each standard
- Section headers and organization
- Placeholder syntax for decision values
- Formatting conventions

### Out of Scope
- What decisions exist (handled by standards-catalog)
- How to gather decisions (handled by facilitation-guides)

---

## Technical Context

### File Location
`.specsmd/aidlc/templates/standards/{standard-id}-template.md`

### Output Location
`memory-bank/standards/{standard-id}.md`

---

## Implementation Details

### Template Structure

Templates use placeholder syntax for dynamic content:

```markdown
# {Standard Title}

## Overview
{overview_text}

## {Decision Display Name}
{decision_choice}

{decision_rationale}

---

## {Next Section}
...
```

### Tech Stack Template

```markdown
# Tech Stack

## Overview
{overview - 1-2 sentences summarizing the stack}

---

## Languages
{languages_choice}

{languages_rationale}

---

## Framework
{framework_choice}

{framework_rationale}

---

## Database
{database_choice | "TBD - will determine based on data needs"}

{database_rationale}

---

## ORM / Database Client
{orm_choice | "N/A"}

{orm_rationale}

---

## Authentication
{auth_choice | "TBD"}

{auth_rationale}

---

## Infrastructure & Deployment
{infrastructure_choice}

{infrastructure_rationale}

---

## Package Manager
{package_manager_choice}

---

## Decision Relationships
{relationships - how choices connect, e.g., "Prisma chosen for Next.js integration"}
```

### Coding Standards Template

```markdown
# Coding Standards

## Overview
Code style and quality standards for this project.

---

## Code Formatting
{formatting_choice}

{formatting_rationale}

---

## Linting
{linting_choice}

{linting_rationale}

---

## Naming Conventions

### Files
{file_naming}

### Variables & Functions
{variable_naming}

### Classes & Types
{class_naming}

---

## File & Folder Organization
{organization_pattern}

```
{folder_structure_example}
```

---

## Testing Strategy
{testing_approach}

### Test Types
{test_types}

### Coverage Requirements
{coverage_requirements}

---

## Error Handling
{error_handling_pattern}

---

## Logging
{logging_approach}

---

## Version Control

### Commit Messages
{commit_format}

### Branch Strategy
{branch_strategy}
```

### System Architecture Template

```markdown
# System Architecture

## Overview
{overview - high-level description of the system}

---

## Architecture Style
{architecture_style}

{style_rationale}

---

## Component Diagram

```
{ascii_diagram}
```

---

## API Design
{api_design_choice}

{api_rationale}

---

## State Management
{state_management_choice}

{state_rationale}

---

## Caching Strategy
{caching_approach | "No caching required"}

---

## Security Patterns

### Authentication
{auth_pattern}

### Authorization
{authz_pattern}

### Data Protection
{data_protection}

---

## Deployment Architecture
{deployment_description}
```

### Placeholder Syntax

| Syntax | Meaning |
|--------|---------|
| `{decision_id}` | Value of the decision |
| `{decision_id_choice}` | Just the choice name |
| `{decision_id_rationale}` | Just the rationale |
| `{value | "default"}` | Use default if value is empty |
| `{section_if:condition}...{/section_if}` | Conditional section |

### Generated Output Example

After facilitation, a tech-stack.md might look like:

```markdown
# Tech Stack

## Overview
Modern TypeScript stack optimized for full-stack web development with
serverless deployment.

---

## Languages
TypeScript

Node.js runtime with TypeScript for type safety, excellent tooling support,
and seamless React integration. The team has strong TypeScript experience.

---

## Framework
Next.js 14 (App Router)

Full-stack React framework providing SSR, SSG, API routes, and excellent
Vercel integration. App Router chosen for React Server Components support.

---

## Database
PostgreSQL (via Supabase)

Managed PostgreSQL providing real-time subscriptions, row-level security,
and integrated authentication. Supabase chosen for quick setup and
generous free tier.

---

## ORM / Database Client
Prisma

Type-safe database access with excellent Next.js integration, automatic
migrations, and Prisma Studio for data browsing.

---

## Authentication
Supabase Auth

Integrated with database choice. Provides email/password, social providers
(Google, GitHub), and magic links out of the box.

---

## Infrastructure & Deployment
Vercel

Optimized for Next.js with automatic deployments, edge functions, and
preview deployments for PRs. Team already familiar with platform.

---

## Package Manager
pnpm

Fast, disk-efficient package manager with excellent monorepo support
via workspaces.

---

## Decision Relationships
- Supabase (database + auth) chosen as integrated platform
- Prisma connects Next.js to Supabase PostgreSQL with type safety
- Vercel deployment pairs naturally with Next.js
- pnpm chosen for potential future monorepo expansion
```

---

## Template Generation Process

```
1. Load template from templates/standards/{id}-template.md
2. For each placeholder in template:
   - Look up value in gathered decisions
   - Apply default if value is empty
   - Format value according to type
3. Process conditional sections
4. Write to memory-bank/standards/{id}.md
```

---

## Acceptance Criteria

### AC-1: Template Loading
- GIVEN tech-stack facilitation complete
- WHEN template is loaded
- THEN all placeholders are identified
- AND template structure is valid markdown

### AC-2: Placeholder Resolution
- GIVEN decisions { languages: "TypeScript", languages_rationale: "Type safety..." }
- WHEN template is processed
- THEN {languages} is replaced with "TypeScript"
- AND {languages_rationale} is replaced with explanation

### AC-3: Default Handling
- GIVEN database decision is TBD
- WHEN template is processed
- THEN {database | "TBD"} renders as "TBD"
- AND output is still valid

### AC-4: File Generation
- GIVEN all decisions gathered and template processed
- WHEN output is written
- THEN file exists at memory-bank/standards/tech-stack.md
- AND content matches processed template
- AND markdown is valid and well-formatted

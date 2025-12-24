# Unit Brief: Operations Agent

## Overview

The Operations Agent is the DevOps engineer that manages deployment, verification, and monitoring of completed construction work.

---

## Scope

### In Scope
- Build deployment artifacts (build skill)
- Deploy to environments (deploy skill)
- Verify deployment success (verify skill)
- Setup monitoring and observability (monitor skill)

### Out of Scope
- Requirements gathering (Inception Agent)
- Code implementation (Construction Agent)
- Project routing (Master Agent)

---

## Technical Context

### Entry Points
- `/specsmd-operations-agent` - Activate Operations Agent

### Dependencies
- Memory Bank schema (`memory-bank.yaml`)
- Completed bolt artifacts
- Project standards (`memory-bank/standards/`)
- Operations templates (`templates/operations/`)

### Outputs
- Deployment artifacts
- Deployment verification reports
- Monitoring configuration
- Operations context (`memory-bank/operations/`)

---

## Implementation Notes

### Persona Characteristics
- Role: DevOps Engineer
- Communication Style: Systematic and verification-focused
- Principle: Verify construction completion before deploying

### Critical Actions
1. VERIFY construction is complete before deployment
2. FOLLOW deployment progression: dev → staging → prod
3. VERIFY each deployment before proceeding to next environment
4. SETUP monitoring before marking deployment complete

### Output Formatting Requirements
All agent outputs MUST follow the output formatting standards:
- 🚫 **NEVER** use ASCII tables for options
- ✅ **ALWAYS** use numbered list format: `N - **Option**: Description`
- ✅ **ALWAYS** use status indicators: ✅ (done) ⏳ (current) [ ] (pending) 🚫 (blocked)
- ✅ **ALWAYS** end with suggested next step pattern

See `specs/standards/output-formatting.md` for complete specification.

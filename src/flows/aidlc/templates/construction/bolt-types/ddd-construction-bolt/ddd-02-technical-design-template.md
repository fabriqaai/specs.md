---
unit: {UUU}-{unit-name}
bolt: {BBB}-{unit-name}
stage: design
status: complete
updated: {YYYY-MM-DDTHH:MM:SSZ}
---

# Technical Design - {Unit Name}

## Architecture Pattern

{Selected pattern and rationale - e.g., Hexagonal, Clean Architecture}

## Layer Structure

```text
┌─────────────────────────────┐
│      Presentation           │  API/UI
├─────────────────────────────┤
│      Application            │  Use Cases
├─────────────────────────────┤
│        Domain               │  Business Logic
├─────────────────────────────┤
│     Infrastructure          │  Database/External
└─────────────────────────────┘
```

## API Design

| Endpoint | Method | Request | Response |
|----------|--------|---------|----------|
| {endpoint} | {GET/POST/etc} | {request schema} | {response schema} |

## Data Persistence

| Table | Columns | Relationships |
|-------|---------|---------------|
| {table} | {columns} | {relationships} |

## Security Design

| Concern | Approach |
|---------|----------|
| Authentication | {approach} |
| Authorization | {approach} |
| Data Encryption | {approach} |

## NFR Implementation

| Requirement | Design Approach |
|-------------|-----------------|
| Performance | {approach} |
| Scalability | {approach} |
| Reliability | {approach} |

## Error Handling

| Error Type | Code | Response |
|------------|------|----------|
| {type} | {code} | {response} |

## External Dependencies

| Service | Purpose | Integration |
|---------|---------|-------------|
| {service} | {purpose} | {REST/Event/etc} |

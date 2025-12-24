# Unit Brief: CLI & Installer Testing

## Overview

Traditional deterministic testing for CLI commands and installer operations. This unit covers unit tests, integration tests, and snapshot tests for all non-LLM components.

---

## Scope

### In Scope
- Unit tests for installer components
- Integration tests for slash commands via BATS
- Snapshot tests for generated file content
- Property-based tests for Memory Bank CRUD operations
- Mock filesystem for isolated testing

### Out of Scope
- Agent behavior testing (handled by Agent Behavior Evaluation unit)
- Schema validation (handled by Specification Contract Testing unit)
- LLM output evaluation (handled by Agent Behavior Evaluation unit)

---

## Technical Context

### Entry Points
- `npm run test:unit` - Run unit tests
- `npm run test:integration` - Run integration tests (BATS)
- `npm run test:snapshots` - Run snapshot tests

### Dependencies
- Jest or Vitest (test runner)
- BATS (Bash Automated Testing System)
- mock-fs (filesystem mocking)
- fast-check (property-based testing)

### Outputs
- Test reports with coverage metrics
- Snapshot files for comparison
- Integration test logs

---

## Components

### 1. Installer Unit Tests

**Purpose**: Test installer component logic in isolation

**Location**: `__tests__/unit/installers/`

**Test Files**:
```
__tests__/unit/installers/
├── installer-factory.test.ts
├── claude-code-installer.test.ts
├── cursor-installer.test.ts
├── copilot-installer.test.ts
└── base-installer.test.ts
```

**Test Cases for Each Installer**:
- ✅ Creates correct directory structure
- ✅ Copies templates to correct locations
- ✅ Handles existing directories gracefully
- ✅ Reports errors for missing templates
- ✅ Validates tool detection

**Example Test**:
```typescript
describe('ClaudeCodeInstaller', () => {
  let mockFs: MockFileSystem;
  let installer: ClaudeCodeInstaller;

  beforeEach(() => {
    mockFs = createMockFs();
    installer = new ClaudeCodeInstaller(mockFs);
  });

  it('creates .claude/commands directory', async () => {
    await installer.install('/project');

    expect(mockFs.existsSync('/project/.claude/commands')).toBe(true);
  });

  it('copies agent command files', async () => {
    await installer.install('/project');

    expect(mockFs.existsSync('/project/.claude/commands/specsmd-master-agent.md')).toBe(true);
    expect(mockFs.existsSync('/project/.claude/commands/specsmd-inception-agent.md')).toBe(true);
  });
});
```

### 2. CLI Integration Tests (BATS)

**Purpose**: Test slash command execution end-to-end

**Location**: `__tests__/integration/cli/`

**Test Files**:
```
__tests__/integration/cli/
├── install.bats
├── inception-commands.bats
├── construction-commands.bats
└── operations-commands.bats
```

**Example BATS Test**:
```bash
#!/usr/bin/env bats

setup() {
  TEST_DIR=$(mktemp -d)
  cd "$TEST_DIR"
}

teardown() {
  rm -rf "$TEST_DIR"
}

@test "install creates .specsmd directory" {
  run npx specsmd install

  [ "$status" -eq 0 ]
  [ -d ".specsmd" ]
}

@test "install creates memory-bank.yaml" {
  run npx specsmd install

  [ "$status" -eq 0 ]
  [ -f ".specsmd/memory-bank.yaml" ]
}

@test "install creates skills directory" {
  run npx specsmd install

  [ "$status" -eq 0 ]
  [ -d ".specsmd/skills" ]
}

@test "install with --tool=claude creates claude commands" {
  run npx specsmd install --tool=claude

  [ "$status" -eq 0 ]
  [ -d ".claude/commands" ]
}

@test "install fails gracefully on permission error" {
  chmod 000 "$TEST_DIR"
  run npx specsmd install

  [ "$status" -ne 0 ]
  [[ "$output" =~ "Permission denied" ]]
  chmod 755 "$TEST_DIR"
}
```

### 3. Snapshot Tests

**Purpose**: Verify generated file content matches expectations

**Location**: `__tests__/unit/template-generation/`

**Test Files**:
```
__tests__/unit/template-generation/
├── bolt-template.test.ts
├── intent-template.test.ts
├── unit-template.test.ts
└── __snapshots__/
    ├── bolt-template.test.ts.snap
    ├── intent-template.test.ts.snap
    └── unit-template.test.ts.snap
```

**Example Snapshot Test**:
```typescript
describe('BoltTemplate', () => {
  it('generates DDD bolt with correct structure', () => {
    const generator = new BoltTemplateGenerator();
    const bolt = generator.generate({
      type: 'ddd',
      name: 'user-authentication',
      unit: 'auth-system',
      stories: ['US-001', 'US-002']
    });

    expect(bolt).toMatchSnapshot();
  });

  it('generates TDD bolt with test-first stages', () => {
    const generator = new BoltTemplateGenerator();
    const bolt = generator.generate({
      type: 'tdd',
      name: 'payment-processing',
      unit: 'payments',
      stories: ['US-010']
    });

    expect(bolt).toMatchSnapshot();
  });
});
```

### 4. Memory Bank CRUD Tests

**Purpose**: Test file system operations for Memory Bank

**Location**: `__tests__/integration/memory-bank/`

**Test Files**:
```
__tests__/integration/memory-bank/
├── crud-operations.test.ts
├── file-system-state.test.ts
└── concurrent-access.test.ts
```

**Test Cases**:
- ✅ Create intent creates correct directory structure
- ✅ Read intent returns parsed content
- ✅ Update intent preserves existing sections
- ✅ Delete intent removes directory and contents
- ✅ List intents returns all intent directories
- ✅ Concurrent writes don't corrupt state

**Property-Based Test Example**:
```typescript
import fc from 'fast-check';

describe('MemoryBank CRUD', () => {
  it('roundtrips any valid intent', () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }),
          description: fc.string({ maxLength: 500 }),
          requirements: fc.array(fc.string())
        }),
        (intent) => {
          const memoryBank = new MemoryBank(testDir);
          memoryBank.createIntent(intent);
          const retrieved = memoryBank.getIntent(intent.name);

          expect(retrieved.name).toBe(intent.name);
          expect(retrieved.description).toBe(intent.description);
        }
      )
    );
  });
});
```

---

## Implementation Notes

### Test Configuration

**Jest Configuration** (`jest.config.js`):
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

**BATS Setup**:
```bash
# Install BATS
npm install --save-dev bats bats-support bats-assert

# Run BATS tests
npx bats __tests__/integration/cli/
```

### Mock Filesystem Strategy

Use `mock-fs` for unit tests to avoid real filesystem operations:

```typescript
import mockFs from 'mock-fs';

beforeEach(() => {
  mockFs({
    '/project': {
      '.specsmd': {
        'memory-bank.yaml': 'version: 1.0.0\npaths:\n  intents: intents/'
      }
    }
  });
});

afterEach(() => {
  mockFs.restore();
});
```

### Coverage Requirements

| Component | Target Coverage |
|-----------|----------------|
| Installers | 90% |
| CLI Commands | 85% |
| Memory Bank | 90% |
| Templates | 80% |

---

## Acceptance Criteria

### AC-1: Installer Unit Tests
- GIVEN installer unit tests
- WHEN tests run
- THEN all installers have test coverage > 90%
- AND tests use mocked filesystem
- AND tests complete in < 30 seconds

### AC-2: CLI Integration Tests
- GIVEN BATS integration tests
- WHEN tests run in clean environment
- THEN all commands produce expected filesystem state
- AND errors are handled gracefully
- AND tests are idempotent (can run multiple times)

### AC-3: Snapshot Tests
- GIVEN template snapshot tests
- WHEN templates change
- THEN snapshots detect the change
- AND reviewer can verify change is intentional
- AND snapshots are updated with `--updateSnapshot`

### AC-4: Memory Bank Tests
- GIVEN Memory Bank CRUD tests
- WHEN property-based tests run
- THEN any valid input roundtrips correctly
- AND concurrent operations don't corrupt state
- AND file permissions are respected

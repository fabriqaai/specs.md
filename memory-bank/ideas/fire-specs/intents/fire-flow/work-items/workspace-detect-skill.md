---
id: workspace-detect-skill
title: Workspace Detection Skill
complexity: high
status: pending
depends_on: [planner-agent]
tags: [skill, shared, phase-4]
---

# Workspace Detection Skill

## Description

Create the workspace-detect skill that automatically analyzes project structure to determine if it's greenfield/brownfield and monolith/monorepo. This is a shared skill used by multiple agents during initialization and context loading.

## Acceptance Criteria

- [ ] Create `SKILL.md` with detection workflow
- [ ] Implement Quick Scan (2-5 min, pattern-based)
- [ ] Implement Deep Scan (10-30 min, code parsing)
- [ ] Detect project type: greenfield | brownfield
- [ ] Detect structure: monolith | monorepo | multi-part
- [ ] Generate key files inventory
- [ ] Detect tech stack per project part
- [ ] Map integrations between parts (for monorepo)
- [ ] Create scripts for deterministic detection

## SKILL.md Content

```xml
---
name: workspace-detect
description: Analyze project structure to detect type, tech stack, and key files
version: 1.0.0
---

<skill name="workspace-detect">

  <objective>
    Analyze project structure to determine workspace type (greenfield/brownfield),
    structure (monolith/monorepo), tech stack, and key files inventory.
  </objective>

  <quick_start>
    1. Invoke during project initialization or context loading
    2. Choose scan depth: quick (2-5 min) or deep (10-30 min)
    3. Receive structured workspace analysis
  </quick_start>

  <essential_principles>
    <principle priority="critical">NEVER assume - always verify by reading files</principle>
    <principle priority="critical">Pattern-based detection for speed, parsing for accuracy</principle>
    <principle priority="high">Report confidence levels for each detection</principle>
  </essential_principles>

  <intake>
    <ask header="Scan Depth">
      How thorough should the analysis be?
      <options>
        <option value="quick">Quick Scan - pattern-based, 2-5 minutes</option>
        <option value="deep">Deep Scan - code parsing, 10-30 minutes</option>
      </options>
    </ask>
  </intake>

  <workflow>
    <step n="1" title="Detect Workspace Root">
      <action script="detect-workspace-root.ts">
        Find project root by looking for:
        - .git directory
        - package.json / go.mod / Cargo.toml / requirements.txt
        - .specsmd directory
      </action>
    </step>

    <step n="2" title="Classify Project Type">
      <action script="classify-project-type.ts">
        Determine greenfield vs brownfield:
        - Greenfield: No src/, no main entry points, minimal files
        - Brownfield: Existing code structure, entry points present
      </action>
      <output>
        Type: {greenfield | brownfield}
        Confidence: {high | medium | low}
      </output>
    </step>

    <step n="3" title="Detect Structure">
      <action script="detect-structure.ts">
        Check for monorepo indicators:
        - pnpm-workspace.yaml
        - lerna.json
        - nx.json
        - turbo.json
        - package.json workspaces field
      </action>
      <output>
        Structure: {monolith | monorepo | multi-part}
        Packages: [list if monorepo]
      </output>
    </step>

    <step n="4" title="Detect Tech Stack">
      <action script="detect-tech-stack.ts">
        For each project part, identify:
        - Language (from file extensions, config files)
        - Framework (from dependencies)
        - Database (from dependencies, config)
        - Build tools (from config files)
      </action>
    </step>

    <step n="5" title="Build Key Files Inventory" if="scan_depth == deep">
      <action script="build-key-files-inventory.ts">
        Identify important files:
        - Entry points (main.ts, index.js, etc.)
        - Configuration files
        - Core business logic
        - API routes/endpoints
        - Shared types/interfaces
      </action>
    </step>

    <step n="6" title="Map Integrations" if="structure == monorepo">
      <action script="map-integrations.ts">
        Identify connections between packages:
        - npm/dependency links
        - API calls between services
        - Shared library usage
      </action>
    </step>

    <step n="7" title="Generate Report">
      <action script="generate-workspace-report.ts">
        Compile findings into structured workspace section for state.yaml
      </action>
      <output format="yaml">
        workspace:
          type: {greenfield | brownfield}
          structure: {monolith | monorepo | multi-part}
          scan_depth: {quick | deep}
          scanned_at: {timestamp}
          default_mode: {autopilot | confirm | validate}
          parts: [...]
          integrations: [...]
          key_files: [...]
      </output>
    </step>
  </workflow>

  <detection_patterns>
    <pattern name="monorepo_indicators">
      <indicator file="pnpm-workspace.yaml" confidence="high"/>
      <indicator file="lerna.json" confidence="high"/>
      <indicator file="nx.json" confidence="high"/>
      <indicator file="turbo.json" confidence="high"/>
      <indicator field="workspaces" in="package.json" confidence="high"/>
      <indicator dir="packages/*" confidence="medium"/>
      <indicator dir="apps/*" confidence="medium"/>
    </pattern>

    <pattern name="tech_stack">
      <tech name="TypeScript" indicators="tsconfig.json, *.ts files"/>
      <tech name="React" indicators="react in dependencies, *.tsx files"/>
      <tech name="Next.js" indicators="next in dependencies, next.config.*"/>
      <tech name="Express" indicators="express in dependencies"/>
      <tech name="PostgreSQL" indicators="pg/prisma in dependencies, DATABASE_URL"/>
      <tech name="MongoDB" indicators="mongoose/mongodb in dependencies"/>
    </pattern>

    <pattern name="greenfield_indicators">
      <indicator>No src/ or app/ directory</indicator>
      <indicator>Only config files present</indicator>
      <indicator>Less than 10 source files</indicator>
      <indicator>No test files</indicator>
    </pattern>
  </detection_patterns>

  <scripts>
    <script name="detect-workspace-root" path="./scripts/detect-workspace-root.ts"/>
    <script name="classify-project-type" path="./scripts/classify-project-type.ts"/>
    <script name="detect-structure" path="./scripts/detect-structure.ts"/>
    <script name="detect-tech-stack" path="./scripts/detect-tech-stack.ts"/>
    <script name="build-key-files-inventory" path="./scripts/build-key-files-inventory.ts"/>
    <script name="map-integrations" path="./scripts/map-integrations.ts"/>
    <script name="generate-workspace-report" path="./scripts/generate-workspace-report.ts"/>
  </scripts>

  <success_criteria>
    <criterion>Workspace type correctly identified</criterion>
    <criterion>Structure correctly classified</criterion>
    <criterion>Tech stack detected for all parts</criterion>
    <criterion>Key files inventoried (if deep scan)</criterion>
    <criterion>State.yaml workspace section populated</criterion>
  </success_criteria>

</skill>
```

## Script Examples

### detect-structure.ts

```typescript
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface StructureResult {
  structure: 'monolith' | 'monorepo' | 'multi-part';
  confidence: 'high' | 'medium' | 'low';
  indicator?: string;
  packages?: string[];
}

export function detectStructure(rootPath: string): StructureResult {
  // Check high-confidence monorepo indicators
  const monorepoFiles = [
    'pnpm-workspace.yaml',
    'lerna.json',
    'nx.json',
    'turbo.json',
  ];

  for (const file of monorepoFiles) {
    if (existsSync(join(rootPath, file))) {
      return {
        structure: 'monorepo',
        confidence: 'high',
        indicator: file,
        packages: discoverPackages(rootPath),
      };
    }
  }

  // Check package.json workspaces
  const pkgPath = join(rootPath, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    if (pkg.workspaces) {
      return {
        structure: 'monorepo',
        confidence: 'high',
        indicator: 'package.json workspaces',
        packages: discoverPackages(rootPath),
      };
    }
  }

  // Check for multi-part indicators (multiple entry points)
  const multiPartDirs = ['apps', 'services', 'packages'];
  for (const dir of multiPartDirs) {
    if (existsSync(join(rootPath, dir))) {
      return {
        structure: 'multi-part',
        confidence: 'medium',
        indicator: `${dir}/ directory`,
        packages: discoverPackages(rootPath),
      };
    }
  }

  return {
    structure: 'monolith',
    confidence: 'high',
  };
}

function discoverPackages(rootPath: string): string[] {
  // Implementation to find all packages/apps
  // ...
  return [];
}
```

## File Location

```
fire/skills/workspace-detect/
├── SKILL.md
└── scripts/
    ├── detect-workspace-root.ts
    ├── classify-project-type.ts
    ├── detect-structure.ts
    ├── detect-tech-stack.ts
    ├── build-key-files-inventory.ts
    ├── map-integrations.ts
    └── generate-workspace-report.ts
```

## Dependencies

- None - this is a foundational shared skill
- Used by: planner-agent (init), builder-agent (context)

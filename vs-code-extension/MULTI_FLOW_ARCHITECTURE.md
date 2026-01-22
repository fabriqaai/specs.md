# Multi-Flow VS Code Extension Architecture

> **Purpose**: This document captures the complete architecture plan for adding FIRE flow support to the VS Code extension with multi-flow switching capability.

**Created**: 2026-01-21
**Status**: Phase 3 Complete - FIRE Flow UI Components Implemented
**Last Updated**: 2026-01-22

---

## Table of Contents

1. [Overview](#1-overview)
2. [Current State Analysis](#2-current-state-analysis)
3. [Architecture Pattern](#3-architecture-pattern)
4. [Directory Structure](#4-directory-structure)
5. [Core Interfaces](#5-core-interfaces)
6. [Flow Detection](#6-flow-detection)
7. [FIRE Flow Implementation](#7-fire-flow-implementation)
8. [Flow Switcher UI](#8-flow-switcher-ui)
9. [Implementation Phases](#9-implementation-phases)
10. [File Creation Checklist](#10-file-creation-checklist)

---

## 1. Overview

### Goals

1. **Detect** which flow(s) are installed: AIDLC, FIRE, or Simple
2. **Activate** the appropriate visualization for the detected flow
3. **Support** multiple flows with a switch UI at the bottom
4. **Create** independent packages for each flow's visualization

### Flow Identification

| Flow | Root Folder | Display Name | Status |
|------|-------------|--------------|--------|
| AIDLC | `memory-bank/` | AI-DLC | Existing |
| FIRE | `.specs-fire/` | FIRE | **To Implement** |
| Simple | `specs/` | Simple | Future |

---

## 2. Current State Analysis

### Existing Extension Structure

```
vs-code-extension/src/
├── extension.ts              # Main entry point
├── sidebar/                  # Extension host code
│   └── specsmdWebviewProvider.ts
├── webview/                  # Webview UI (Lit components)
│   ├── components/
│   │   ├── bolts/            # Bolt visualization
│   │   ├── shared/           # Shared components
│   │   └── tabs/             # Tab navigation
│   └── styles/
├── parser/                   # Artifact parsing
│   ├── artifactParser.ts
│   ├── boltTypeParser.ts
│   ├── frontmatterParser.ts
│   ├── memoryBankSchema.ts
│   ├── projectDetection.ts   # Current detection (AIDLC only)
│   └── types.ts
├── state/                    # State management
│   ├── stateStore.ts
│   ├── selectors.ts
│   └── types.ts
├── watcher/                  # File watching
└── analytics/                # Telemetry
```

### Key Files to Understand

- `src/parser/projectDetection.ts` - Current AIDLC-only detection
- `src/sidebar/specsmdWebviewProvider.ts` - Main webview provider
- `src/state/stateStore.ts` - Observable state pattern
- `src/webview/components/` - Lit component architecture

---

## 3. Architecture Pattern

### Flow Adapter Pattern

Each flow is a self-contained adapter implementing common interfaces:

```
┌─────────────────────────────────────────────────────────────────┐
│                        VS Code Extension                        │
├─────────────────────────────────────────────────────────────────┤
│                      FlowRegistry (core)                        │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐       │
│   │ AidlcAdapter │   │ FireAdapter  │   │ SimpleAdapter│       │
│   │  (existing)  │   │    (NEW)     │   │   (future)   │       │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘       │
│          │                  │                   │               │
│   ┌──────▼───────┐   ┌──────▼───────┐   ┌──────▼───────┐       │
│   │   Detector   │   │   Detector   │   │   Detector   │       │
│   │   Parser     │   │   Parser     │   │   Parser     │       │
│   │   State      │   │   State      │   │   State      │       │
│   │   UI         │   │   UI         │   │   UI         │       │
│   └──────────────┘   └──────────────┘   └──────────────┘       │
├─────────────────────────────────────────────────────────────────┤
│                    Webview Shell (shared)                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    [Flow UI Components]                  │   │
│  │           (dynamically loaded based on active flow)      │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │  🔥 FIRE · user-auth                   [Switch Flow ▾]  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Pattern?

- **Isolation**: Each flow has its own parser, state, and UI
- **Extensibility**: Adding new flows is straightforward
- **Testability**: Each flow can be tested independently
- **Maintainability**: Changes to one flow don't affect others
- **Single Extension**: User installs one extension, gets all flows

---

## 4. Directory Structure

### Target Structure

```
vs-code-extension/src/
├── core/                               # Shared infrastructure
│   ├── types.ts                        # FlowAdapter, FlowDetector interfaces
│   ├── flowRegistry.ts                 # Flow registration & activation
│   ├── flowDetector.ts                 # Multi-flow detection
│   ├── BaseStateStore.ts               # Observable pattern base class
│   └── webview/
│       ├── WebviewShell.ts             # Base webview provider
│       ├── messaging.ts                # Shared message types
│       └── styles/                     # CSS variables, themes
│
├── flows/                              # Flow-specific implementations
│   ├── aidlc/                          # AI-DLC flow (REFACTOR existing)
│   │   ├── index.ts                    # AidlcFlowAdapter export
│   │   ├── detector.ts                 # AIDLC detection (memory-bank/)
│   │   ├── parser/
│   │   │   ├── index.ts
│   │   │   ├── intentParser.ts
│   │   │   ├── unitParser.ts
│   │   │   ├── storyParser.ts
│   │   │   ├── boltParser.ts
│   │   │   ├── boltTypeParser.ts
│   │   │   ├── standardParser.ts
│   │   │   └── types.ts                # AIDLC-specific types
│   │   ├── state/
│   │   │   ├── store.ts                # AidlcStateStore
│   │   │   ├── selectors.ts
│   │   │   └── types.ts
│   │   └── ui/
│   │       ├── provider.ts             # AidlcUIProvider
│   │       ├── components/             # AIDLC Lit components
│   │       │   ├── bolts/
│   │       │   ├── specs/
│   │       │   └── overview/
│   │       └── tabs/
│   │
│   ├── fire/                           # FIRE flow (NEW)
│   │   ├── index.ts                    # FireFlowAdapter export
│   │   ├── detector.ts                 # FIRE detection (.specs-fire/)
│   │   ├── parser/
│   │   │   ├── index.ts
│   │   │   ├── stateYamlParser.ts      # Parse state.yaml (critical)
│   │   │   ├── intentParser.ts
│   │   │   ├── workItemParser.ts
│   │   │   ├── runParser.ts
│   │   │   ├── standardParser.ts
│   │   │   └── types.ts                # FIRE-specific types
│   │   ├── state/
│   │   │   ├── store.ts                # FireStateStore
│   │   │   ├── selectors.ts
│   │   │   └── types.ts
│   │   └── ui/
│   │       ├── provider.ts             # FireUIProvider
│   │       ├── components/
│   │       │   ├── runs/               # Run visualization
│   │       │   │   ├── fire-runs-view.ts
│   │       │   │   ├── fire-current-run.ts
│   │       │   │   ├── fire-run-card.ts
│   │       │   │   ├── fire-phase-pipeline.ts
│   │       │   │   ├── fire-work-item-list.ts
│   │       │   │   ├── fire-pending-items.ts
│   │       │   │   └── fire-completed-runs.ts
│   │       │   ├── intents/            # Intent visualization
│   │       │   │   ├── fire-intents-view.ts
│   │       │   │   ├── fire-intent-tree.ts
│   │       │   │   └── fire-work-item-row.ts
│   │       │   ├── overview/           # Overview visualization
│   │       │   │   ├── fire-overview-view.ts
│   │       │   │   ├── fire-project-info.ts
│   │       │   │   └── fire-standards-list.ts
│   │       │   └── shared/             # FIRE-specific shared
│   │       │       ├── fire-mode-badge.ts
│   │       │       ├── fire-autonomy-indicator.ts
│   │       │       └── fire-scope-badge.ts
│   │       └── tabs/
│   │           └── fire-view-tabs.ts
│   │
│   └── simple/                         # Simple flow (FUTURE)
│       └── (same structure)
│
├── ui/                                 # Shared UI components
│   ├── flowSwitcher/
│   │   ├── FlowSwitcher.ts             # Flow switch Lit component
│   │   └── styles.css
│   └── shared/                         # Components shared by all flows
│       ├── progress-ring.ts
│       ├── progress-bar.ts
│       ├── status-badge.ts
│       ├── empty-state.ts
│       ├── collapsible-section.ts
│       └── timestamp.ts
│
├── extension.ts                        # Main entry (updated)
└── webview/
    ├── main.ts                         # Webview bootstrap
    └── app.ts                          # Root app component
```

---

## 5. Core Interfaces

### File: `src/core/types.ts`

```typescript
// === FLOW IDENTIFICATION ===
export type FlowId = 'aidlc' | 'fire' | 'simple';

export interface FlowInfo {
  id: FlowId;
  displayName: string;
  icon: string;                         // Emoji or codicon
  rootFolder: string;
  version?: string;
}

// === FLOW DETECTION ===
export interface FlowDetector {
  readonly flowId: FlowId;
  readonly displayName: string;
  readonly rootFolder: string;

  detect(workspacePath: string): Promise<FlowDetectionResult>;
}

export interface FlowDetectionResult {
  detected: boolean;
  flowPath: string | null;
  version?: string;
}

// === FLOW ADAPTER (Main Integration Point) ===
export interface FlowAdapter<TState = unknown, TArtifacts = unknown> {
  readonly flowId: FlowId;
  readonly detector: FlowDetector;
  readonly parser: FlowParser<TArtifacts>;
  readonly stateManager: FlowStateManager<TState>;
  readonly uiProvider: FlowUIProvider;

  initialize(context: vscode.ExtensionContext): Promise<void>;
  activate(flowPath: string): Promise<void>;
  deactivate(): void;
  dispose(): void;
}

// === PARSER CONTRACT ===
export interface FlowParser<T> {
  scanArtifacts(rootPath: string): Promise<T>;
  watchPatterns(): string[];              // Glob patterns to watch
  parseArtifact(filePath: string): Promise<ArtifactParseResult>;
}

export interface ArtifactParseResult {
  type: string;
  data: unknown;
  path: string;
}

// === STATE CONTRACT ===
export interface FlowStateManager<T> {
  getState(): T;
  loadFromArtifacts(artifacts: unknown): void;
  subscribe(listener: (state: T) => void): () => void;
  getComputedData(): FlowComputedData;
  persistUIState(key: string, value: unknown): void;
  getUIState<V>(key: string, defaultValue: V): V;
}

export interface FlowComputedData {
  // Common computed properties all flows must provide
  currentContext: string | null;          // Current intent/project name
  progressPercent: number;
  itemCounts: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  };
}

// === UI PROVIDER CONTRACT ===
export interface FlowUIProvider {
  readonly tabs: TabDefinition[];

  getScaffoldHtml(webview: vscode.Webview): string;
  getWebviewData(state: unknown): WebviewData;
  handleMessage(message: WebviewMessage): Promise<void>;
}

export interface TabDefinition {
  id: string;
  label: string;
  icon?: string;
}

export interface WebviewData {
  activeTab: string;
  flowId: FlowId;
  flowDisplayName: string;
  currentContext: string | null;
  tabData: Record<string, unknown>;
}

export interface WebviewMessage {
  type: string;
  [key: string]: unknown;
}
```

### File: `src/core/flowRegistry.ts`

```typescript
import type { FlowAdapter, FlowId, FlowInfo, FlowDetectionResult } from './types';

export class FlowRegistry {
  private adapters: Map<FlowId, FlowAdapter> = new Map();
  private activeAdapter: FlowAdapter | null = null;
  private detectedFlows: FlowInfo[] = [];

  register(adapter: FlowAdapter): void {
    this.adapters.set(adapter.flowId, adapter);
  }

  async detectFlows(workspacePath: string): Promise<FlowInfo[]> {
    const detected: FlowInfo[] = [];

    for (const [flowId, adapter] of this.adapters) {
      const result = await adapter.detector.detect(workspacePath);
      if (result.detected) {
        detected.push({
          id: flowId,
          displayName: adapter.detector.displayName,
          icon: this.getFlowIcon(flowId),
          rootFolder: adapter.detector.rootFolder,
          version: result.version,
        });
      }
    }

    this.detectedFlows = detected;
    return detected;
  }

  async activateFlow(flowId: FlowId, flowPath: string): Promise<void> {
    // Deactivate current
    if (this.activeAdapter) {
      this.activeAdapter.deactivate();
    }

    // Activate new
    const adapter = this.adapters.get(flowId);
    if (!adapter) {
      throw new Error(`Flow adapter not found: ${flowId}`);
    }

    await adapter.activate(flowPath);
    this.activeAdapter = adapter;
  }

  getActiveAdapter(): FlowAdapter | null {
    return this.activeAdapter;
  }

  getDetectedFlows(): FlowInfo[] {
    return this.detectedFlows;
  }

  private getFlowIcon(flowId: FlowId): string {
    switch (flowId) {
      case 'fire': return '🔥';
      case 'aidlc': return '📘';
      case 'simple': return '📄';
      default: return '📁';
    }
  }

  dispose(): void {
    for (const adapter of this.adapters.values()) {
      adapter.dispose();
    }
    this.adapters.clear();
  }
}
```

---

## 6. Flow Detection

### Multi-Flow Detection Logic

```typescript
// src/core/flowDetector.ts

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import type { FlowInfo } from './types';

const FLOW_CONFIGS = [
  { id: 'fire',   rootFolder: '.specs-fire',  displayName: 'FIRE',   icon: '🔥' },
  { id: 'aidlc',  rootFolder: 'memory-bank',  displayName: 'AI-DLC', icon: '📘' },
  { id: 'simple', rootFolder: 'specs',        displayName: 'Simple', icon: '📄' },
] as const;

export async function detectAllFlows(workspacePath: string): Promise<FlowInfo[]> {
  const detected: FlowInfo[] = [];

  for (const config of FLOW_CONFIGS) {
    const flowPath = path.join(workspacePath, config.rootFolder);

    if (fs.existsSync(flowPath) && fs.statSync(flowPath).isDirectory()) {
      const flowInfo: FlowInfo = {
        id: config.id as FlowId,
        displayName: config.displayName,
        icon: config.icon,
        rootFolder: config.rootFolder,
      };

      // For FIRE, extract version from state.yaml
      if (config.id === 'fire') {
        const version = await getFireVersion(flowPath);
        if (version) {
          flowInfo.version = version;
        }
      }

      detected.push(flowInfo);
    }
  }

  return detected;
}

async function getFireVersion(flowPath: string): Promise<string | undefined> {
  const stateFile = path.join(flowPath, 'state.yaml');
  if (fs.existsSync(stateFile)) {
    const content = fs.readFileSync(stateFile, 'utf-8');
    const match = content.match(/^version:\s*["']?([^"'\n]+)["']?/m);
    return match?.[1];
  }
  return undefined;
}

export function getDefaultFlow(detected: FlowInfo[]): FlowInfo | null {
  // Priority: FIRE > AIDLC > Simple
  const priority: FlowId[] = ['fire', 'aidlc', 'simple'];

  for (const flowId of priority) {
    const flow = detected.find(f => f.id === flowId);
    if (flow) return flow;
  }

  return null;
}
```

---

## 7. FIRE Flow Implementation

### 7.1 FIRE Data Types

```typescript
// src/flows/fire/parser/types.ts

export type ExecutionMode = 'autopilot' | 'confirm' | 'validate';
export type Complexity = 'low' | 'medium' | 'high';
export type AutonomyBias = 'autonomous' | 'balanced' | 'controlled';
export type RunScope = 'single' | 'batch' | 'wide';
export type WorkspaceType = 'greenfield' | 'brownfield';
export type WorkspaceStructure = 'monolith' | 'monorepo' | 'multi-part';
export type RunPhase = 'plan' | 'execute' | 'test' | 'review' | 'complete';
export type ItemStatus = 'pending' | 'in_progress' | 'completed';

export interface FireIntent {
  id: string;                           // "user-authentication"
  title: string;
  status: ItemStatus;
  briefPath: string;
  workItems: FireWorkItem[];
}

export interface FireWorkItem {
  id: string;                           // "login-endpoint"
  title: string;
  intentId: string;
  filePath: string;
  complexity: Complexity;
  mode: ExecutionMode;
  status: ItemStatus;
  hasDesignDoc: boolean;
  designDocPath?: string;
  dependencies: string[];
}

export interface FireRun {
  id: string;                           // "run-001"
  scope: RunScope;
  workItemIds: string[];
  currentItemId: string | null;
  phase: RunPhase;
  phases: PhaseStatus[];
  started: Date;
  completed?: Date;
  artifacts: RunArtifacts;
}

export interface PhaseStatus {
  phase: RunPhase;
  status: ItemStatus | 'skipped';
  artifactPath?: string;
}

export interface RunArtifacts {
  planPath: string;
  testReportPath?: string;
  reviewReportPath?: string;
  walkthroughPath?: string;
}

export interface FireStandard {
  name: string;
  path: string;
  isConstitution: boolean;
  moduleOverrides?: string[];
}

export interface FireWorkspace {
  type: WorkspaceType;
  structure: WorkspaceStructure;
  autonomyBias: AutonomyBias;
  runScopePreference: RunScope;
}

export interface FireProjectState {
  version: string;
  workspace: FireWorkspace;
  intents: Map<string, FireIntent>;
  workItems: Map<string, FireWorkItem>;
  runs: Map<string, FireRun>;
  activeRun: FireRun | null;
  standards: FireStandard[];
}
```

### 7.2 FIRE State Parser

```typescript
// src/flows/fire/parser/stateYamlParser.ts

import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import type { FireProjectState, FireWorkspace } from './types';

export function parseStateYaml(flowPath: string): Partial<FireProjectState> | null {
  const stateFile = path.join(flowPath, 'state.yaml');

  if (!fs.existsSync(stateFile)) {
    return null;
  }

  const content = fs.readFileSync(stateFile, 'utf-8');
  const data = yaml.load(content) as Record<string, unknown>;

  return {
    version: data.version as string,
    workspace: parseWorkspace(data.workspace),
    // Intents and runs are parsed separately from their files
  };
}

function parseWorkspace(data: unknown): FireWorkspace {
  const ws = data as Record<string, unknown>;
  return {
    type: (ws.type as string) || 'greenfield',
    structure: (ws.structure as string) || 'monolith',
    autonomyBias: (ws.autonomy_bias as string) || 'balanced',
    runScopePreference: (ws.run_scope_preference as string) || 'single',
  };
}
```

### 7.3 FIRE UI Components

**Runs Tab (Primary View)**

```
┌─────────────────────────────────────────────────────────────┐
│  [Runs]  [Intents]  [Overview]                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🔥 CURRENT RUN                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  run-003  ·  batch (3 work items)                   │    │
│  │                                                     │    │
│  │  Phases:                                            │    │
│  │  [Plan] ──→ [Execute] ──→ [Test] ──→ [Review]      │    │
│  │    ✓           ●            ○           ○          │    │
│  │                                                     │    │
│  │  Work Items:                                        │    │
│  │  ┌───────────────────────────────────────────────┐ │    │
│  │  │ ✓ login-endpoint       autopilot              │ │    │
│  │  │ ● user-session         confirm    ← current   │ │    │
│  │  │ ○ password-reset       confirm                │ │    │
│  │  └───────────────────────────────────────────────┘ │    │
│  │                                                     │    │
│  │  [Continue Run]  [View Plan]  [View Tests]         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  📋 PENDING WORK ITEMS                    [Start New Run]   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ • email-verification    validate   high             │    │
│  │ • forgot-password       confirm    medium           │    │
│  │ • profile-settings      autopilot  low              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ✅ COMPLETED RUNS                                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ • run-002 (2 items) · completed 2 hours ago         │    │
│  │ • run-001 (1 item) · completed yesterday            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Component Hierarchy:**

```
fire-runs-view.ts
├── fire-current-run.ts
│   ├── fire-run-card.ts
│   │   ├── fire-phase-pipeline.ts      # 4 fixed phases
│   │   ├── fire-work-item-list.ts
│   │   │   └── fire-work-item.ts       # With mode badge
│   │   └── fire-run-actions.ts
│   └── fire-checkpoint-indicator.ts
│
├── fire-pending-items.ts
│   └── fire-pending-item.ts
│
└── fire-completed-runs.ts
    └── fire-completed-run.ts
```

---

## 8. Flow Switcher UI

### Design

```
┌─────────────────────────────────────────────────────────────┐
│  [Main sidebar content above...]                            │
├─────────────────────────────────────────────────────────────┤
│  🔥 FIRE · user-auth                      [Switch Flow ▾]   │
└─────────────────────────────────────────────────────────────┘

When dropdown is open:
┌─────────────────────────────────────────────────────────────┐
│  ✓ 🔥 FIRE (.specs-fire/)                                  │
│    📘 AI-DLC (memory-bank/)                                 │
│  ─────────────────────────────                              │
│    ⚙️  Flow Settings...                                      │
└─────────────────────────────────────────────────────────────┘
```

### Component

```typescript
// src/ui/flowSwitcher/FlowSwitcher.ts

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { FlowInfo, FlowId } from '../../core/types';

@customElement('flow-switcher')
export class FlowSwitcher extends LitElement {
  @property({ type: Array }) availableFlows: FlowInfo[] = [];
  @property({ type: String }) activeFlowId: FlowId = 'fire';
  @property({ type: String }) currentContext: string = '';

  @state() private isOpen = false;

  static styles = css`
    :host {
      display: block;
      border-top: 1px solid var(--vscode-panel-border);
      padding: 8px 12px;
      background: var(--vscode-sideBar-background);
    }

    .switcher-button {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 6px 8px;
      background: var(--vscode-button-secondaryBackground);
      border: 1px solid var(--vscode-button-border);
      border-radius: 4px;
      cursor: pointer;
      color: var(--vscode-button-secondaryForeground);
    }

    .flow-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .flow-icon { font-size: 14px; }
    .flow-name { font-weight: 500; }
    .flow-context {
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
    }

    .dropdown {
      position: absolute;
      bottom: 100%;
      left: 0;
      right: 0;
      background: var(--vscode-dropdown-background);
      border: 1px solid var(--vscode-dropdown-border);
      border-radius: 4px;
      margin-bottom: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      cursor: pointer;
    }

    .dropdown-item:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .dropdown-item.active {
      background: var(--vscode-list-activeSelectionBackground);
    }
  `;

  render() {
    const activeFlow = this.availableFlows.find(f => f.id === this.activeFlowId);

    return html`
      <div class="switcher-container" style="position: relative;">
        ${this.isOpen ? this.renderDropdown() : null}

        <button class="switcher-button" @click=${this.toggleDropdown}>
          <div class="flow-info">
            <span class="flow-icon">${activeFlow?.icon || '📁'}</span>
            <span class="flow-name">${activeFlow?.displayName || 'Unknown'}</span>
            ${this.currentContext ? html`
              <span class="flow-context">· ${this.currentContext}</span>
            ` : null}
          </div>
          <span class="chevron">${this.isOpen ? '▴' : '▾'}</span>
        </button>
      </div>
    `;
  }

  private renderDropdown() {
    return html`
      <div class="dropdown">
        ${this.availableFlows.map(flow => html`
          <div
            class="dropdown-item ${flow.id === this.activeFlowId ? 'active' : ''}"
            @click=${() => this.selectFlow(flow.id)}
          >
            <span>${flow.id === this.activeFlowId ? '✓' : ' '}</span>
            <span>${flow.icon}</span>
            <span>${flow.displayName}</span>
            <span style="color: var(--vscode-descriptionForeground); font-size: 11px;">
              (${flow.rootFolder}/)
            </span>
          </div>
        `)}
        <div class="dropdown-divider"></div>
        <div class="dropdown-item" @click=${this.openSettings}>
          <span>⚙️</span>
          <span>Flow Settings...</span>
        </div>
      </div>
    `;
  }

  private toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  private selectFlow(flowId: FlowId) {
    if (flowId !== this.activeFlowId) {
      this.dispatchEvent(new CustomEvent('flow-change', {
        detail: { flowId },
        bubbles: true,
        composed: true,
      }));
    }
    this.isOpen = false;
  }

  private openSettings() {
    this.dispatchEvent(new CustomEvent('open-settings', {
      bubbles: true,
      composed: true,
    }));
    this.isOpen = false;
  }
}
```

---

## 9. Implementation Phases

### Phase 1: Core Infrastructure

**Goal**: Create shared interfaces and flow registry

**Files to Create**:
- [ ] `src/core/types.ts` - All interfaces
- [ ] `src/core/flowRegistry.ts` - Flow registration
- [ ] `src/core/flowDetector.ts` - Multi-flow detection
- [ ] `src/core/BaseStateStore.ts` - Observable base class
- [ ] `src/core/webview/messaging.ts` - Shared message types

**Estimated Work**: Foundation for all flows

### Phase 2: Refactor AIDLC as Flow Adapter

**Goal**: Move existing code into flow adapter pattern without breaking functionality

**Steps**:
1. Create `src/flows/aidlc/` directory structure
2. Move parser files to `flows/aidlc/parser/`
3. Move state files to `flows/aidlc/state/`
4. Move UI components to `flows/aidlc/ui/`
5. Create `AidlcFlowAdapter` wrapper implementing interfaces
6. Update `extension.ts` to use FlowRegistry
7. **TEST**: Verify AIDLC works identically

**Files to Move**:
- `src/parser/*` → `src/flows/aidlc/parser/`
- `src/state/*` → `src/flows/aidlc/state/`
- `src/webview/components/bolts/*` → `src/flows/aidlc/ui/components/bolts/`
- Create: `src/flows/aidlc/index.ts`, `detector.ts`

### Phase 3: Implement FIRE Flow Adapter ✅ COMPLETE

**Goal**: Create complete FIRE flow support

**Completed**:
- [x] `src/flows/fire/index.ts` - FireFlowAdapter
- [x] `src/flows/fire/detector.ts` - FIRE detection
- [x] `src/flows/fire/types.ts` - Type definitions
- [x] `src/flows/fire/parser/index.ts` - FireParser
- [x] `src/flows/fire/state/index.ts` - FireStateManager
- [x] `src/flows/fire/ui/provider.ts` - FireUIProvider
- [x] FIRE UI components in `src/webview/components/fire/` (15+ components)

### Phase 4: Flow Switcher UI ✅ COMPLETE

**Goal**: Add flow switching capability

**Completed**:
- [x] `src/webview/components/shared/flow-switcher.ts` - Flow switcher component
- [x] Integrated in app.ts
- [x] VS Code quick pick integration
- [x] Flow switch messages handled

### Phase 5: Polish & Testing

**Goal**: Complete implementation with tests

**Tasks**:
- [ ] Add unit tests for FIRE parsers
- [ ] Add integration tests for flow switching
- [ ] Add E2E tests for FIRE visualization
- [ ] Performance optimization
- [ ] Documentation updates

---

## 10. File Creation Checklist

### Core (Phase 1) ✅ COMPLETE
```
[x] src/core/types.ts              # Flow interfaces, type guards, status utilities
[x] src/core/flowRegistry.ts       # Flow registration, detection, activation
[x] src/core/flowDetector.ts       # Base detector, FIRE/AIDLC/Simple detectors
[x] src/core/BaseStateStore.ts     # Observable pattern base class
[x] src/core/webview/messaging.ts  # Message types, factories, handlers
[x] src/core/index.ts              # Module exports
[ ] src/core/webview/WebviewShell.ts  # Deferred to Phase 2 (needs AIDLC refactor first)
```

### AIDLC Refactor (Phase 2)
```
[ ] src/flows/aidlc/index.ts
[ ] src/flows/aidlc/detector.ts
[ ] src/flows/aidlc/parser/index.ts
[ ] src/flows/aidlc/parser/types.ts
[ ] src/flows/aidlc/state/store.ts
[ ] src/flows/aidlc/state/selectors.ts
[ ] src/flows/aidlc/ui/provider.ts
```

### FIRE Flow (Phase 3) ✅ COMPLETE
```
[x] src/flows/fire/index.ts
[x] src/flows/fire/detector.ts
[x] src/flows/fire/types.ts
[x] src/flows/fire/parser/index.ts
[x] src/flows/fire/state/index.ts
[x] src/flows/fire/ui/provider.ts

# UI Components (in src/webview/components/fire/)
[x] fire-view.ts                      # Main container
[x] fire-view-tabs.ts                 # Tab navigation

# Runs View
[x] runs/fire-runs-view.ts
[x] runs/fire-current-run.ts
[x] runs/fire-run-card.ts
[x] runs/fire-phase-pipeline.ts
[x] runs/fire-work-item.ts
[x] runs/fire-pending-items.ts
[x] runs/fire-completed-runs.ts

# Intents View
[x] intents/fire-intents-view.ts
[x] intents/fire-intent-card.ts

# Overview View
[x] overview/fire-overview-view.ts

# Shared Components
[x] shared/fire-mode-badge.ts
[x] shared/fire-status-badge.ts
[x] shared/fire-scope-badge.ts
```

### Flow Switcher (Phase 4) ✅ COMPLETE
```
[x] src/webview/components/shared/flow-switcher.ts  # Implemented in shared components
```

### Shared UI Components
```
[ ] src/ui/shared/progress-ring.ts (move from existing)
[ ] src/ui/shared/progress-bar.ts (move from existing)
[ ] src/ui/shared/status-badge.ts
[ ] src/ui/shared/empty-state.ts (move from existing)
[ ] src/ui/shared/collapsible-section.ts
[ ] src/ui/shared/timestamp.ts
```

---

## Appendix: Key Differences AIDLC vs FIRE

| Aspect | AIDLC | FIRE |
|--------|-------|------|
| **Hierarchy** | Intent → Unit → Story → Bolt | Intent → Work Item → Run |
| **Depth** | 4 layers | 2 layers |
| **Root Folder** | `memory-bank/` | `.specs-fire/` |
| **State File** | None (parsed from files) | `state.yaml` (central) |
| **Execution Unit** | Bolt (N stages) | Run (4 fixed phases) |
| **Execution Modes** | Bolt types | Autopilot/Confirm/Validate |
| **Unique Concepts** | DDD stages, mob rituals | Autonomy bias, run scope |
| **Checkpoints** | 10-26 per feature | 0-2 per work item |

---

## Quick Reference: Message Types

### Extension → Webview
```typescript
{ type: 'setFlowData', flowId, data, availableFlows }
{ type: 'switchFlow', flowId }
{ type: 'setTab', tab }
```

### Webview → Extension
```typescript
{ type: 'ready' }
{ type: 'refresh' }
{ type: 'tabChange', tab }
{ type: 'switchFlow', flowId }
{ type: 'openArtifact', path }
{ type: 'startRun', workItemIds }        // FIRE-specific
{ type: 'continueRun', runId }           // FIRE-specific
{ type: 'viewPlan', runId }              // FIRE-specific
{ type: 'startBolt', boltId }            // AIDLC-specific
{ type: 'continueBolt', boltId }         // AIDLC-specific
```

---

*This document should be referenced when implementing multi-flow support. Update the checklists as work progresses.*

---
id: vscode-extension-story-wlm-027
unit: webview-lit-migration
intent: 011-vscode-extension
status: complete
priority: must
created: 2025-12-26
completed: 2025-12-26
---

# Story: Migrate Overview View to Lit Components

## User Story

**As a** user
**I want** to see project summary, resources, and quick actions
**So that** I can get a high-level view and access common functions

## Acceptance Criteria

- [ ] **Given** Overview tab active, **When** rendered, **Then** all sections display
- [ ] **Given** resource link clicked, **When** event fires, **Then** resource opens
- [ ] **Given** quick action button, **When** clicked, **Then** action executes
- [ ] **Given** project stats, **When** data updates, **Then** stats refresh
- [ ] **Given** getting started section, **When** new project, **Then** shows setup steps

## Components to Create

### 1. OverviewView Container
```typescript
// src/webview/components/overview/overview-view.ts
@customElement('overview-view')
export class OverviewView extends LitElement {
    @property({ type: Object }) data!: OverviewData;

    static styles = css`
        :host {
            display: block;
            padding: 16px;
        }

        .section {
            margin-bottom: 24px;
        }

        .section-title {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 12px;
        }
    `;

    render() {
        return html`
            <project-summary .project=${this.data.project}></project-summary>

            <div class="section">
                <div class="section-title">Quick Actions</div>
                <quick-actions .actions=${this.data.quickActions}></quick-actions>
            </div>

            <div class="section">
                <div class="section-title">Resources</div>
                <resource-list .resources=${this.data.resources}></resource-list>
            </div>

            ${this.data.showGettingStarted ? html`
                <div class="section">
                    <div class="section-title">Getting Started</div>
                    <getting-started .steps=${this.data.gettingStartedSteps}></getting-started>
                </div>
            ` : ''}
        `;
    }
}
```

### 2. ProjectSummary Component
```typescript
// src/webview/components/overview/project-summary.ts
@customElement('project-summary')
export class ProjectSummary extends LitElement {
    @property({ type: Object }) project!: ProjectData;

    static styles = css`
        :host {
            display: block;
            padding: 16px;
            background: var(--vscode-editor-background);
            border-radius: 8px;
            margin-bottom: 16px;
        }

        .project-name {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .stats {
            display: flex;
            gap: 16px;
        }

        .stat {
            text-align: center;
        }

        .stat-value {
            font-size: 24px;
            font-weight: 600;
            color: var(--accent-primary, #f97316);
        }

        .stat-label {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }
    `;

    render() {
        return html`
            <div class="project-name">${this.project.name}</div>
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">${this.project.intentsCount}</div>
                    <div class="stat-label">Intents</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${this.project.boltsCount}</div>
                    <div class="stat-label">Bolts</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${this.project.specsCount}</div>
                    <div class="stat-label">Specs</div>
                </div>
            </div>
        `;
    }
}
```

### 3. QuickActions Component
```typescript
// src/webview/components/overview/quick-actions.ts
@customElement('quick-actions')
export class QuickActions extends LitElement {
    @property({ type: Array }) actions: QuickAction[] = [];

    static styles = css`
        :host {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
        }

        button {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 12px;
            background: var(--vscode-button-secondaryBackground);
            border: none;
            border-radius: 6px;
            color: var(--vscode-button-secondaryForeground);
            cursor: pointer;
            font-size: 12px;
            transition: background 0.15s;
        }

        button:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .icon {
            font-size: 14px;
        }
    `;

    render() {
        return html`
            ${this.actions.map(action => html`
                <button @click=${() => this._executeAction(action)}>
                    <span class="icon">${action.icon}</span>
                    <span>${action.label}</span>
                </button>
            `)}
        `;
    }

    private _executeAction(action: QuickAction) {
        this.dispatchEvent(new CustomEvent('action-execute', {
            detail: { action: action.command },
            bubbles: true,
            composed: true
        }));
    }
}
```

### 4. ResourceList Component
```typescript
// src/webview/components/overview/resource-list.ts
@customElement('resource-list')
export class ResourceList extends LitElement {
    @property({ type: Array }) resources: ResourceLink[] = [];

    static styles = css`
        :host {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        a {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            color: var(--vscode-textLink-foreground);
            text-decoration: none;
            border-radius: 4px;
            font-size: 12px;
        }

        a:hover {
            background: var(--vscode-list-hoverBackground);
        }

        .icon {
            opacity: 0.7;
        }
    `;

    render() {
        return html`
            ${this.resources.map(resource => html`
                <a href="#" @click=${(e: Event) => this._openResource(e, resource)}>
                    <span class="icon">${resource.icon}</span>
                    <span>${resource.label}</span>
                </a>
            `)}
        `;
    }

    private _openResource(e: Event, resource: ResourceLink) {
        e.preventDefault();
        this.dispatchEvent(new CustomEvent('resource-open', {
            detail: { url: resource.url, type: resource.type },
            bubbles: true,
            composed: true
        }));
    }
}
```

### 5. GettingStarted Component
```typescript
// src/webview/components/overview/getting-started.ts
@customElement('getting-started')
export class GettingStarted extends LitElement {
    @property({ type: Array }) steps: GettingStartedStep[] = [];

    static styles = css`
        :host {
            display: block;
        }

        .step {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px;
            background: var(--vscode-editor-background);
            border-radius: 6px;
            margin-bottom: 8px;
        }

        .step-number {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--accent-primary, #f97316);
            color: white;
            border-radius: 50%;
            font-size: 12px;
            font-weight: 600;
            flex-shrink: 0;
        }

        .step.completed .step-number {
            background: var(--status-complete, #22c55e);
        }

        .step-content {
            flex: 1;
        }

        .step-title {
            font-weight: 600;
            margin-bottom: 4px;
        }

        .step-description {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
    `;

    render() {
        return html`
            ${this.steps.map((step, idx) => html`
                <div class="step ${step.completed ? 'completed' : ''}">
                    <div class="step-number">${step.completed ? '✓' : idx + 1}</div>
                    <div class="step-content">
                        <div class="step-title">${step.title}</div>
                        <div class="step-description">${step.description}</div>
                    </div>
                </div>
            `)}
        `;
    }
}
```

## Types to Add
```typescript
// src/webview/types/overview.ts
export interface OverviewData {
    project: ProjectData;
    quickActions: QuickAction[];
    resources: ResourceLink[];
    showGettingStarted: boolean;
    gettingStartedSteps: GettingStartedStep[];
}

export interface ProjectData {
    name: string;
    intentsCount: number;
    boltsCount: number;
    specsCount: number;
}

export interface QuickAction {
    icon: string;
    label: string;
    command: string;
}

export interface ResourceLink {
    icon: string;
    label: string;
    url: string;
    type: 'internal' | 'external';
}

export interface GettingStartedStep {
    title: string;
    description: string;
    completed: boolean;
}
```

## Files to Create

- `src/webview/components/overview/overview-view.ts`
- `src/webview/components/overview/project-summary.ts`
- `src/webview/components/overview/quick-actions.ts`
- `src/webview/components/overview/resource-list.ts`
- `src/webview/components/overview/getting-started.ts`
- `src/webview/types/overview.ts`

## Testing

- Manual: All sections render correctly
- Manual: Quick actions execute commands
- Manual: Resource links open correctly
- Manual: Getting started shows for new projects
- Manual: Stats update when data changes

## Dependencies

### Requires
- 026-specs-view-components

### Enables
- 028-state-context

---
id: vscode-extension-story-wlm-025
unit: webview-lit-migration
intent: 011-vscode-extension
status: complete
priority: must
created: 2025-12-26
completed: 2025-12-26
---

# Story: Migrate Bolts View to Lit Components

## User Story

**As a** user
**I want** to see my bolts with mission status, focus card, queue, and activity
**So that** I can track my development progress

## Acceptance Criteria

- [ ] **Given** Bolts tab active, **When** rendered, **Then** all sections display
- [ ] **Given** active bolt exists, **When** focus card shown, **Then** expand/collapse works
- [ ] **Given** queue items exist, **When** Start clicked, **Then** command popup shows
- [ ] **Given** activity events exist, **When** filter clicked, **Then** list filters
- [ ] **Given** activity item, **When** clicked, **Then** file opens in editor

## Components to Create

### 1. BoltsView Container
```typescript
// src/webview/components/bolts/bolts-view.ts
@customElement('bolts-view')
export class BoltsView extends LitElement {
    @property({ type: Object }) data!: WebviewData;

    render() {
        return html`
            <mission-status .data=${this.data}></mission-status>
            <focus-card .bolt=${this.data.activeBolt} .expanded=${this.data.focusCardExpanded}></focus-card>
            <queue-section .bolts=${this.data.upNextQueue}></queue-section>
            <activity-feed .events=${this.data.activityEvents} .filter=${this.data.activityFilter}></activity-feed>
        `;
    }
}
```

### 2. MissionStatus Component
```typescript
// src/webview/components/bolts/mission-status.ts
@customElement('mission-status')
export class MissionStatus extends LitElement {
    @property({ type: Object }) data!: WebviewData;

    render() {
        return html`
            <div class="mission-label">Current Intent</div>
            <div class="mission-title">${this.data.currentIntent?.number}-${this.data.currentIntent?.name}</div>
            <div class="mission-stats">
                <stat-badge label="In Progress" .value=${this.data.stats.active} color="active"></stat-badge>
                <stat-badge label="Queued" .value=${this.data.stats.queued} color="queued"></stat-badge>
                <stat-badge label="Done" .value=${this.data.stats.done} color="done"></stat-badge>
            </div>
        `;
    }
}
```

### 3. FocusCard Component
```typescript
// src/webview/components/bolts/focus-card.ts
@customElement('focus-card')
export class FocusCard extends LitElement {
    @property({ type: Object }) bolt?: ActiveBoltData;
    @property({ type: Boolean }) expanded = false;

    render() {
        if (!this.bolt) {
            return html`<div class="empty-state">No active bolt</div>`;
        }

        return html`
            <div class="focus-card ${this.expanded ? 'expanded' : ''}">
                <div class="header" @click=${this._toggleExpand}>
                    <div class="title">${this.bolt.name}</div>
                    <span class="badge">In Progress</span>
                </div>
                ${this.expanded ? html`
                    <div class="body">
                        <progress-ring .percent=${this._progressPercent}></progress-ring>
                        <stage-pipeline .stages=${this.bolt.stages}></stage-pipeline>
                        <stories-list .stories=${this.bolt.stories}></stories-list>
                    </div>
                ` : ''}
            </div>
        `;
    }
}
```

### 4. QueueSection Component
```typescript
// src/webview/components/bolts/queue-section.ts
@customElement('queue-section')
export class QueueSection extends LitElement {
    @property({ type: Array }) bolts: QueuedBoltData[] = [];

    render() {
        return html`
            <div class="header">
                <span>Up Next</span>
                <span class="count">${this.bolts.length} bolts</span>
            </div>
            <div class="list">
                ${this.bolts.map((bolt, idx) => html`
                    <queue-item .bolt=${bolt} .priority=${idx + 1}></queue-item>
                `)}
            </div>
        `;
    }
}
```

### 5. ActivityFeed Component
```typescript
// src/webview/components/bolts/activity-feed.ts
@customElement('activity-feed')
export class ActivityFeed extends LitElement {
    @property({ type: Array }) events: ActivityEventData[] = [];
    @property({ type: String }) filter: 'all' | 'stages' | 'bolts' = 'all';

    render() {
        const filtered = this._filterEvents();
        return html`
            <div class="header">
                <span>Recent Activity</span>
                <div class="filters">
                    ${['all', 'stages', 'bolts'].map(f => html`
                        <button
                            class=${this.filter === f ? 'active' : ''}
                            @click=${() => this._setFilter(f as any)}>
                            ${f}
                        </button>
                    `)}
                </div>
            </div>
            <div class="list">
                ${filtered.map(event => html`
                    <activity-item .event=${event} @click=${() => this._openFile(event)}></activity-item>
                `)}
            </div>
        `;
    }
}
```

## Files to Create

- `src/webview/components/bolts/bolts-view.ts`
- `src/webview/components/bolts/mission-status.ts`
- `src/webview/components/bolts/focus-card.ts`
- `src/webview/components/bolts/queue-section.ts`
- `src/webview/components/bolts/queue-item.ts`
- `src/webview/components/bolts/activity-feed.ts`
- `src/webview/components/bolts/activity-item.ts`
- `src/webview/components/shared/progress-ring.ts`
- `src/webview/components/shared/stage-pipeline.ts`

## Testing

- Manual: All sections render with correct data
- Manual: Focus card expands/collapses
- Manual: Queue Start button shows popup
- Manual: Activity filter works
- Manual: Activity click opens file

## Dependencies

### Requires
- 024-tabs-component

### Enables
- 026-specs-view-components

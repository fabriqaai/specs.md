/**
 * FirePendingItems - Section showing pending work items.
 */

import { html, css, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseElement } from '../../shared/base-element.js';
import '../shared/fire-mode-badge.js';
import '../shared/fire-status-badge.js';
import type { ExecutionMode } from '../shared/fire-mode-badge.js';

/**
 * Complexity level.
 */
export type Complexity = 'low' | 'medium' | 'high';

/**
 * Pending work item data.
 */
export interface PendingWorkItemData {
    id: string;
    intentId: string;
    intentTitle?: string;
    intentFilePath?: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    mode: ExecutionMode;
    complexity: Complexity;
    filePath: string;
    dependencies?: string[];
}

/**
 * Pending items section component.
 *
 * @fires start-run - When start run button is clicked
 * @fires open-file - When work item is clicked
 *
 * @example
 * ```html
 * <fire-pending-items .items=${pendingItems}></fire-pending-items>
 * ```
 */
@customElement('fire-pending-items')
export class FirePendingItems extends BaseElement {
    /**
     * Pending work items.
     */
    @property({ type: Array })
    items: PendingWorkItemData[] = [];

    /**
     * Whether a run is currently active (disables start).
     */
    @property({ type: Boolean })
    hasActiveRun = false;

    /**
     * Selected item IDs for batch run.
     */
    @state()
    private _selectedIds: Set<string> = new Set();

    /**
     * Whether section is expanded.
     */
    @state()
    private _expanded = true;

    static styles = [
        ...BaseElement.baseStyles,
        css`
            :host {
                display: block;
            }

            .section {
                padding: 12px;
                border-top: 1px solid var(--border-color);
            }

            .section-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
                cursor: pointer;
            }

            .header-left {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .section-icon {
                font-size: 14px;
            }

            .section-title {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                color: var(--foreground);
                letter-spacing: 0.5px;
            }

            .count-badge {
                font-size: 10px;
                padding: 2px 6px;
                background: var(--editor-background);
                border-radius: 10px;
                color: var(--description-foreground);
            }

            .toggle-icon {
                font-size: 10px;
                color: var(--description-foreground);
                transition: transform 0.15s ease;
            }

            .toggle-icon.collapsed {
                transform: rotate(-90deg);
            }

            .items-list {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 10px;
                cursor: pointer;
                transition: background 0.15s ease;
                border-bottom: 1px solid var(--border-color);
            }

            .item:last-child {
                border-bottom: none;
            }

            .item:hover {
                background: rgba(255, 255, 255, 0.03);
            }

            .item-checkbox {
                width: 14px;
                height: 14px;
                cursor: pointer;
                accent-color: var(--status-active);
                flex-shrink: 0;
            }

            .item-status {
                width: 18px;
                height: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                flex-shrink: 0;
            }

            .item-status.pending { color: var(--description-foreground); }
            .item-status.in_progress { color: var(--status-active); }
            .item-status.completed { color: var(--status-complete); }
            .item-status.blocked { color: var(--status-blocked); }

            .item-content {
                flex: 1;
                min-width: 0;
            }

            .item-title {
                font-size: 12px;
                color: var(--foreground);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .item-deps {
                font-size: 10px;
                color: var(--description-foreground);
                margin-top: 2px;
            }

            .item-badges {
                display: flex;
                align-items: center;
                gap: 6px;
                flex-shrink: 0;
            }

            .complexity {
                font-size: 9px;
                padding: 2px 6px;
                border-radius: 3px;
                text-transform: uppercase;
                font-weight: 500;
            }

            .complexity.low {
                background: rgba(34, 197, 94, 0.15);
                color: #22c55e;
            }

            .complexity.medium {
                background: rgba(249, 115, 22, 0.15);
                color: #f97316;
            }

            .complexity.high {
                background: rgba(239, 68, 68, 0.15);
                color: #ef4444;
            }

            .actions {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid var(--border-color);
            }

            .start-btn {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 6px 12px;
                font-size: 11px;
                font-weight: 500;
                background: var(--status-active);
                color: white;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .start-btn:hover:not(:disabled) {
                background: #ea580c;
            }

            .start-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .selection-hint {
                font-size: 10px;
                color: var(--description-foreground);
            }

            .empty-state {
                text-align: center;
                padding: 16px;
                color: var(--description-foreground);
                font-size: 12px;
            }

            .intent-group {
                margin-bottom: 8px;
            }

            .intent-group-header {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 8px;
                font-size: 11px;
                font-weight: 500;
                color: var(--foreground);
                background: var(--editor-background);
                border-radius: 4px 4px 0 0;
                border-bottom: 1px solid var(--border-color);
            }

            .intent-group-header .open-btn {
                margin-left: auto;
                font-size: 12px;
                padding: 2px 4px;
                cursor: pointer;
                opacity: 0.6;
                transition: opacity 0.15s ease;
                border-radius: 3px;
            }

            .intent-group-header .open-btn:hover {
                opacity: 1;
                background: var(--background);
            }

            .intent-group-icon {
                font-size: 12px;
            }

            .intent-group-items {
                background: var(--editor-background);
                border-radius: 0 0 4px 4px;
                padding: 4px;
            }
        `
    ];

    render() {
        return html`
            <div class="section">
                <div class="section-header" @click=${this._toggleExpanded}>
                    <div class="header-left">
                        <span class="section-icon">📋</span>
                        <span class="section-title">Pending Work Items</span>
                        <span class="count-badge">${this.items.length}</span>
                    </div>
                    <span class="toggle-icon ${this._expanded ? '' : 'collapsed'}">▼</span>
                </div>

                ${this._expanded ? html`
                    ${this.items.length > 0 ? html`
                        <div class="items-list">
                            ${this._renderGroupedItems()}
                        </div>

                        <div class="actions">
                            <button
                                class="start-btn"
                                ?disabled=${this.hasActiveRun || this._selectedIds.size === 0}
                                @click=${this._handleStartRun}
                            >
                                ${this._selectedIds.size > 1
                                    ? `Start Batch Run (${this._selectedIds.size})`
                                    : 'Start Run'}
                            </button>
                            ${this._selectedIds.size === 0 ? html`
                                <span class="selection-hint">Select items to start a run</span>
                            ` : nothing}
                        </div>
                    ` : html`
                        <div class="empty-state">
                            No pending work items
                        </div>
                    `}
                ` : nothing}
            </div>
        `;
    }

    private _renderGroupedItems() {
        // Group items by intentId
        const groups = new Map<string, PendingWorkItemData[]>();

        for (const item of this.items) {
            const key = item.intentId;
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(item);
        }

        return Array.from(groups.entries()).map(([intentId, items]) => {
            const intentTitle = items[0]?.intentTitle || intentId;
            const intentFilePath = items[0]?.intentFilePath;

            return html`
                <div class="intent-group">
                    <div class="intent-group-header">
                        <span class="intent-group-icon">🎯</span>
                        <span>${intentTitle}</span>
                        <span style="color: var(--description-foreground); font-weight: normal;">(${items.length})</span>
                        ${intentFilePath ? html`
                            <span class="open-btn" @click=${(e: Event) => this._handleOpenIntent(e, intentFilePath)} title="Open intent file">🔍</span>
                        ` : nothing}
                    </div>
                    <div class="intent-group-items">
                        ${items.map(item => this._renderItem(item))}
                    </div>
                </div>
            `;
        });
    }

    private _renderItem(item: PendingWorkItemData) {
        const isSelected = this._selectedIds.has(item.id);
        const statusIcon = this._getStatusIcon(item.status);
        const hasDeps = item.dependencies && item.dependencies.length > 0;

        return html`
            <div class="item" @click=${() => this._handleItemClick(item)}>
                <input
                    type="checkbox"
                    class="item-checkbox"
                    .checked=${isSelected}
                    @click=${(e: Event) => e.stopPropagation()}
                    @change=${(e: Event) => this._handleCheckboxChange(e, item.id)}
                />
                <span class="item-status ${item.status}">${statusIcon}</span>
                <div class="item-content">
                    <div class="item-title">${item.title || item.id}</div>
                    ${hasDeps ? html`
                        <div class="item-deps">depends on: ${item.dependencies!.join(', ')}</div>
                    ` : nothing}
                </div>
                <div class="item-badges">
                    <fire-mode-badge mode=${item.mode}></fire-mode-badge>
                    <span class="complexity ${item.complexity}">${item.complexity}</span>
                </div>
            </div>
        `;
    }

    private _getStatusIcon(status: string): string {
        switch (status) {
            case 'pending': return '○';
            case 'in_progress': return '●';
            case 'completed': return '✓';
            case 'blocked': return '⚠';
            default: return '○';
        }
    }

    private _toggleExpanded(): void {
        this._expanded = !this._expanded;
    }

    private _handleItemClick(item: PendingWorkItemData): void {
        this.dispatchEvent(new CustomEvent('open-file', {
            detail: { path: item.filePath },
            bubbles: true,
            composed: true
        }));
    }

    private _handleOpenIntent(e: Event, intentFilePath: string): void {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('open-file', {
            detail: { path: intentFilePath },
            bubbles: true,
            composed: true
        }));
    }

    private _handleCheckboxChange(e: Event, itemId: string): void {
        const checkbox = e.target as HTMLInputElement;
        if (checkbox.checked) {
            this._selectedIds.add(itemId);
            // Auto-select dependencies
            this._selectDependencies(itemId);
        } else {
            this._selectedIds.delete(itemId);
        }
        this._selectedIds = new Set(this._selectedIds);
    }

    private _selectDependencies(itemId: string): void {
        const item = this.items.find(i => i.id === itemId);
        if (!item?.dependencies) return;

        for (const depId of item.dependencies) {
            // Only add if the dependency is in the pending items list
            const depItem = this.items.find(i => i.id === depId);
            if (depItem && !this._selectedIds.has(depId)) {
                this._selectedIds.add(depId);
                // Recursively select dependencies of the dependency
                this._selectDependencies(depId);
            }
        }
    }

    private _handleStartRun(): void {
        if (this._selectedIds.size === 0) return;

        this.dispatchEvent(new CustomEvent('start-run', {
            detail: { workItemIds: Array.from(this._selectedIds) },
            bubbles: true,
            composed: true
        }));
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'fire-pending-items': FirePendingItems;
    }
}

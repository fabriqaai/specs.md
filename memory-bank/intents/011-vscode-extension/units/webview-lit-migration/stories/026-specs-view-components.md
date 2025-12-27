---
id: vscode-extension-story-wlm-026
unit: webview-lit-migration
intent: 011-vscode-extension
status: complete
priority: must
created: 2025-12-26
completed: 2025-12-26
---

# Story: Migrate Specs View to Lit Components

## User Story

**As a** user
**I want** to browse my spec files in a structured tree view
**So that** I can quickly navigate to documentation

## Acceptance Criteria

- [ ] **Given** Specs tab active, **When** rendered, **Then** tree structure displays
- [ ] **Given** spec file clicked, **When** event fires, **Then** file opens in editor
- [ ] **Given** folder item, **When** clicked, **Then** expands/collapses children
- [ ] **Given** search input, **When** typing, **Then** tree filters in real-time
- [ ] **Given** empty state, **When** no specs found, **Then** helpful message shows

## Components to Create

### 1. SpecsView Container
```typescript
// src/webview/components/specs/specs-view.ts
@customElement('specs-view')
export class SpecsView extends LitElement {
    @property({ type: Array }) tree: SpecTreeNode[] = [];
    @property({ type: String }) searchQuery = '';

    render() {
        return html`
            <div class="header">
                <span>Spec Files</span>
                <search-input
                    .value=${this.searchQuery}
                    @search-change=${this._handleSearch}>
                </search-input>
            </div>
            <div class="tree">
                ${this._filteredTree.length > 0
                    ? this._filteredTree.map(node => html`
                        <spec-tree-item .node=${node} .depth=${0}></spec-tree-item>
                    `)
                    : html`<empty-state message="No specs found"></empty-state>`
                }
            </div>
        `;
    }

    private get _filteredTree(): SpecTreeNode[] {
        if (!this.searchQuery) return this.tree;
        return this._filterNodes(this.tree, this.searchQuery.toLowerCase());
    }
}
```

### 2. SpecTreeItem Component
```typescript
// src/webview/components/specs/spec-tree-item.ts
@customElement('spec-tree-item')
export class SpecTreeItem extends LitElement {
    @property({ type: Object }) node!: SpecTreeNode;
    @property({ type: Number }) depth = 0;
    @property({ type: Boolean }) expanded = true;

    static styles = css`
        :host {
            display: block;
        }

        .item {
            display: flex;
            align-items: center;
            padding: 4px 8px;
            cursor: pointer;
            border-radius: 4px;
        }

        .item:hover {
            background: var(--vscode-list-hoverBackground);
        }

        .icon {
            margin-right: 6px;
            opacity: 0.7;
        }

        .children {
            margin-left: 16px;
        }
    `;

    render() {
        const indent = this.depth * 16;
        const isFolder = this.node.type === 'folder';

        return html`
            <div
                class="item"
                style="padding-left: ${indent}px"
                @click=${this._handleClick}>
                <span class="icon">${isFolder ? (this.expanded ? '📂' : '📁') : '📄'}</span>
                <span class="label">${this.node.name}</span>
            </div>
            ${isFolder && this.expanded && this.node.children ? html`
                <div class="children">
                    ${this.node.children.map(child => html`
                        <spec-tree-item
                            .node=${child}
                            .depth=${this.depth + 1}>
                        </spec-tree-item>
                    `)}
                </div>
            ` : ''}
        `;
    }

    private _handleClick() {
        if (this.node.type === 'folder') {
            this.expanded = !this.expanded;
        } else {
            this.dispatchEvent(new CustomEvent('spec-open', {
                detail: { path: this.node.path },
                bubbles: true,
                composed: true
            }));
        }
    }
}
```

### 3. SearchInput Component
```typescript
// src/webview/components/shared/search-input.ts
@customElement('search-input')
export class SearchInput extends LitElement {
    @property({ type: String }) value = '';
    @property({ type: String }) placeholder = 'Search...';

    static styles = css`
        :host {
            display: block;
        }

        input {
            width: 100%;
            padding: 6px 10px;
            background: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            color: var(--vscode-input-foreground);
            font-size: 12px;
        }

        input:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }
    `;

    render() {
        return html`
            <input
                type="text"
                .value=${this.value}
                .placeholder=${this.placeholder}
                @input=${this._handleInput}
            />
        `;
    }

    private _handleInput(e: Event) {
        const input = e.target as HTMLInputElement;
        this.dispatchEvent(new CustomEvent('search-change', {
            detail: { value: input.value },
            bubbles: true,
            composed: true
        }));
    }
}
```

## Types to Add
```typescript
// src/webview/types/specs.ts
export interface SpecTreeNode {
    name: string;
    path: string;
    type: 'file' | 'folder';
    children?: SpecTreeNode[];
}
```

## Files to Create

- `src/webview/components/specs/specs-view.ts`
- `src/webview/components/specs/spec-tree-item.ts`
- `src/webview/components/shared/search-input.ts`
- `src/webview/components/shared/empty-state.ts`
- `src/webview/types/specs.ts`

## Testing

- Manual: Tree renders with correct structure
- Manual: Click file opens in editor
- Manual: Click folder expands/collapses
- Manual: Search filters tree in real-time
- Manual: Empty state shows when no matches

## Dependencies

### Requires
- 025-bolts-view-components

### Enables
- 027-overview-view-components

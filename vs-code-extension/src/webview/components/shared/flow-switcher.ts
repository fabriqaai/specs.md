/**
 * FlowSwitcher - Component for switching between detected flows.
 *
 * Displays at the bottom of the sidebar when multiple flows are detected.
 * Shows the current flow icon and name, with a dropdown to switch flows.
 */

import { html, css, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * Flow information for display.
 */
export interface FlowInfo {
    id: string;
    displayName: string;
    icon: string;
    rootFolder: string;
}

/**
 * Event detail for flow switch.
 */
export interface FlowSwitchDetail {
    flowId: string;
}

/**
 * Flow switcher component.
 */
@customElement('flow-switcher')
export class FlowSwitcher extends LitElement {
    /**
     * Currently active flow.
     */
    @property({ type: Object })
    activeFlow: FlowInfo | null = null;

    /**
     * Available flows to switch between.
     */
    @property({ type: Array })
    availableFlows: FlowInfo[] = [];

    /**
     * Whether the dropdown is open.
     */
    @state()
    private _isOpen = false;

    /**
     * Dropdown position (calculated dynamically for fixed positioning).
     */
    @state()
    private _dropdownStyle = '';

    static styles = css`
        :host {
            display: block;
            --switcher-bg: var(--vscode-sideBarSectionHeader-background, #252526);
            --switcher-border: var(--vscode-sideBarSectionHeader-border, #3c3c3c);
            --switcher-hover: var(--vscode-list-hoverBackground, #2a2d2e);
            --switcher-active: var(--vscode-list-activeSelectionBackground, #094771);
            --switcher-text: var(--vscode-foreground, #cccccc);
            --switcher-muted: var(--vscode-descriptionForeground, #8b8b8b);
        }

        .switcher-container {
            position: relative;
            border-top: 1px solid var(--switcher-border);
            background: var(--switcher-bg);
        }

        .switcher-button {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 10px 12px;
            border: none;
            background: transparent;
            color: var(--switcher-text);
            cursor: pointer;
            font-family: var(--vscode-font-family);
            font-size: 11px;
            text-align: left;
            transition: background 0.15s ease;
        }

        .switcher-button:hover {
            background: var(--switcher-hover);
        }

        .switcher-button:focus {
            outline: none;
            background: var(--switcher-hover);
        }

        .flow-icon {
            font-size: 14px;
            flex-shrink: 0;
        }

        .flow-info {
            flex: 1;
            min-width: 0;
        }

        .flow-name {
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .flow-hint {
            font-size: 9px;
            color: var(--switcher-muted);
            margin-top: 2px;
        }

        .switch-indicator {
            font-size: 10px;
            color: var(--switcher-muted);
            transition: transform 0.2s ease;
        }

        .switcher-button[aria-expanded="true"] .switch-indicator {
            transform: rotate(180deg);
        }

        .dropdown {
            position: fixed;
            bottom: auto;
            left: 0;
            right: 0;
            width: 100%;
            background: var(--switcher-bg);
            border: 1px solid var(--switcher-border);
            border-bottom: none;
            border-radius: 4px 4px 0 0;
            box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
            transform: translateY(4px);
            transition: opacity 0.15s ease, visibility 0.15s ease, transform 0.15s ease;
            z-index: 9999;
        }

        .dropdown.open {
            opacity: 1;
            visibility: visible;
            pointer-events: auto;
            transform: translateY(0);
        }

        .dropdown-header {
            padding: 8px 12px;
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            color: var(--switcher-muted);
            border-bottom: 1px solid var(--switcher-border);
        }

        .dropdown-list {
            max-height: 200px;
            overflow-y: auto;
        }

        .flow-option {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            border: none;
            background: transparent;
            color: var(--switcher-text);
            cursor: pointer;
            font-family: var(--vscode-font-family);
            font-size: 11px;
            text-align: left;
            width: 100%;
            transition: background 0.15s ease;
        }

        .flow-option:hover {
            background: var(--switcher-hover);
        }

        .flow-option:focus {
            outline: none;
            background: var(--switcher-hover);
        }

        .flow-option.active {
            background: var(--switcher-active);
        }

        .flow-option .flow-icon {
            font-size: 16px;
        }

        .flow-option .flow-info {
            flex: 1;
        }

        .flow-option .flow-folder {
            font-size: 9px;
            color: var(--switcher-muted);
            margin-top: 2px;
        }

        .check-icon {
            font-size: 12px;
            color: var(--vscode-gitDecoration-addedResourceForeground, #73c991);
        }

        /* Hide when only one flow */
        :host([hidden]) {
            display: none;
        }
    `;

    connectedCallback(): void {
        super.connectedCallback();
        document.addEventListener('click', this._handleOutsideClick);
        document.addEventListener('keydown', this._handleKeyDown);
    }

    firstUpdated(): void {
        // Debug: Add native click listener to button
        const button = this.shadowRoot?.querySelector('.switcher-button');
        console.log('[FlowSwitcher] firstUpdated, button:', button);
        if (button) {
            button.addEventListener('click', (e) => {
                console.log('[FlowSwitcher] Native click on button!', e);
            });
        }
    }

    disconnectedCallback(): void {
        super.disconnectedCallback();
        document.removeEventListener('click', this._handleOutsideClick);
        document.removeEventListener('keydown', this._handleKeyDown);
    }

    private _handleOutsideClick = (e: MouseEvent): void => {
        if (this._isOpen && !this.contains(e.target as Node)) {
            this._isOpen = false;
        }
    };

    private _handleKeyDown = (e: KeyboardEvent): void => {
        if (this._isOpen && e.key === 'Escape') {
            this._isOpen = false;
            const button = this.shadowRoot?.querySelector('.switcher-button') as HTMLButtonElement;
            button?.focus();
        }
    };

    private _toggleDropdown = (): void => {
        console.log('[FlowSwitcher] _toggleDropdown called, current _isOpen:', this._isOpen);
        if (!this._isOpen) {
            // Calculate position before opening
            const button = this.shadowRoot?.querySelector('.switcher-button') as HTMLButtonElement;
            console.log('[FlowSwitcher] button:', button);
            if (button) {
                const rect = button.getBoundingClientRect();
                console.log('[FlowSwitcher] button rect:', rect);
                // Position dropdown above the button, full width of sidebar
                this._dropdownStyle = `bottom: ${window.innerHeight - rect.top}px; left: 0; right: 0; width: ${rect.width}px;`;
                console.log('[FlowSwitcher] dropdownStyle:', this._dropdownStyle);
            }
        }
        this._isOpen = !this._isOpen;
        console.log('[FlowSwitcher] new _isOpen:', this._isOpen);
    };

    private _selectFlow = (flowId: string): void => {
        console.log('[FlowSwitcher] _selectFlow called with flowId:', flowId);
        console.log('[FlowSwitcher] activeFlow:', this.activeFlow);
        if (flowId !== this.activeFlow?.id) {
            console.log('[FlowSwitcher] Dispatching flow-switch event');
            this.dispatchEvent(new CustomEvent<FlowSwitchDetail>('flow-switch', {
                detail: { flowId },
                bubbles: true,
                composed: true
            }));
        } else {
            console.log('[FlowSwitcher] Same flow selected, not dispatching');
        }
        this._isOpen = false;
    };

    render() {
        // Don't render if only one or no flows
        if (this.availableFlows.length <= 1) {
            return html``;
        }

        const activeFlow = this.activeFlow || this.availableFlows[0];

        return html`
            <div class="switcher-container">
                <div class="dropdown ${this._isOpen ? 'open' : ''}" style="${this._dropdownStyle}">
                    <div class="dropdown-header">Switch Flow</div>
                    <div class="dropdown-list" role="listbox">
                        ${this.availableFlows.map(flow => html`
                            <button
                                class="flow-option ${flow.id === activeFlow?.id ? 'active' : ''}"
                                role="option"
                                aria-selected="${flow.id === activeFlow?.id}"
                                @click=${() => this._selectFlow(flow.id)}
                            >
                                <span class="flow-icon">${flow.icon}</span>
                                <span class="flow-info">
                                    <span class="flow-name">${flow.displayName}</span>
                                    <span class="flow-folder">${flow.rootFolder}/</span>
                                </span>
                                ${flow.id === activeFlow?.id ? html`
                                    <span class="check-icon">&#10003;</span>
                                ` : ''}
                            </button>
                        `)}
                    </div>
                </div>

                <button
                    class="switcher-button"
                    aria-haspopup="listbox"
                    aria-expanded="${this._isOpen}"
                    @click=${this._toggleDropdown}
                >
                    <span class="flow-icon">${activeFlow?.icon || '📄'}</span>
                    <span class="flow-info">
                        <span class="flow-name">${activeFlow?.displayName || 'No Flow'}</span>
                        <span class="flow-hint">${this.availableFlows.length} flows available</span>
                    </span>
                    <span class="switch-indicator">&#9650;</span>
                </button>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'flow-switcher': FlowSwitcher;
    }
}

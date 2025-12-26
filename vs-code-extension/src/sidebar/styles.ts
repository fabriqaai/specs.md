/**
 * Centralized styling for the webview.
 * All colors and styles are defined here for easy maintenance.
 */

/**
 * CSS variables mapped to VS Code theme colors.
 * These use VS Code's built-in CSS variables for proper theme support.
 */
export const CSS_VARIABLES = `
    /* ==================== THEME COLORS ==================== */
    /* Using VS Code's native CSS variables for automatic theme support */

    /* Status Colors - semantic colors for bolt/story states */
    --status-complete: var(--vscode-charts-green, #22c55e);
    --status-active: var(--vscode-charts-orange, #f97316);
    --status-pending: var(--vscode-descriptionForeground, #858585);
    --status-blocked: var(--vscode-charts-red, #ef4444);
    --status-info: var(--vscode-charts-blue, #3b82f6);

    /* Accent color - orange per design mockup variation-8-2 */
    --accent-primary: var(--vscode-charts-orange, #f97316);
    --accent-primary-bg: color-mix(in srgb, var(--accent-primary) 10%, transparent);
`;

/**
 * Returns the complete CSS stylesheet for the webview.
 */
export function getStylesheet(): string {
    return `
    :root {
        ${CSS_VARIABLES}
    }

    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    body {
        font-family: var(--vscode-font-family);
        background: var(--vscode-sideBar-background);
        color: var(--vscode-foreground);
        font-size: 13px;
        line-height: 1.4;
    }

    .sidebar {
        display: flex;
        flex-direction: column;
        height: 100vh;
    }

    /* ==================== TABS ==================== */
    .view-tabs {
        display: flex;
        background: var(--vscode-editor-background);
        border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
    }

    .view-tab {
        flex: 1;
        padding: 10px;
        font-size: 11px;
        font-weight: 600;
        text-align: center;
        background: none;
        border: none;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        border-bottom: 2px solid transparent;
    }

    .view-tab.active {
        color: var(--accent-primary);
        border-bottom-color: var(--accent-primary);
    }

    /* ==================== VIEW CONTAINERS ==================== */
    .view-container {
        display: none;
        flex: 1;
        overflow-y: auto;
        flex-direction: column;
    }

    .view-container.active {
        display: flex;
    }

    /* ==================== MISSION STATUS ==================== */
    .mission-status {
        padding: 16px;
        background: linear-gradient(135deg, var(--vscode-editor-background) 0%, var(--accent-primary-bg) 100%);
        border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
    }

    .mission-label {
        font-size: 9px;
        color: var(--accent-primary);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 4px;
    }

    .mission-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 8px;
    }

    .mission-stats {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
    }

    .mission-stat {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .mission-stat-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
    }

    .mission-stat-dot.active { background: var(--status-active); }
    .mission-stat-dot.queued { background: var(--status-pending); }
    .mission-stat-dot.done { background: var(--status-complete); }
    .mission-stat-dot.blocked { background: var(--status-blocked); }

    .mission-stat-value {
        font-size: 12px;
        font-weight: 600;
    }

    .mission-stat-label {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
    }

    /* ==================== FOCUS SECTION ==================== */
    .focus-section {
        padding: 16px;
        border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
    }

    .section-label {
        font-size: 9px;
        color: var(--vscode-descriptionForeground);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .section-label-icon {
        font-size: 12px;
    }

    /* ==================== FOCUS CARD ==================== */
    .focus-card {
        background: var(--vscode-sideBar-background);
        border: 2px solid var(--accent-primary);
        border-radius: 8px;
        overflow: hidden;
    }

    .focus-card-header {
        padding: 12px;
        background: var(--accent-primary-bg);
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }

    .focus-card-title {
        font-size: 13px;
        font-weight: 600;
    }

    .focus-card-subtitle {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        margin-top: 2px;
    }

    .focus-card-badge {
        font-size: 9px;
        padding: 3px 8px;
        border-radius: 12px;
        background: var(--accent-primary);
        color: white;
    }

    .focus-card-body {
        max-height: 0;
        overflow: hidden;
        padding: 0 12px;
    }

    .focus-card.expanded .focus-card-body {
        max-height: 500px;
        padding: 12px;
        border-top: 1px solid var(--vscode-sideBarSectionHeader-border);
    }

    /* ==================== PROGRESS RING ==================== */
    .progress-ring-container {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 12px;
    }

    .progress-ring {
        width: 64px;
        height: 64px;
        position: relative;
    }

    .progress-ring svg {
        transform: rotate(-90deg);
    }

    .progress-ring-bg {
        fill: none;
        stroke: var(--vscode-input-background);
        stroke-width: 6;
    }

    .progress-ring-fill {
        fill: none;
        stroke: var(--accent-primary);
        stroke-width: 6;
        stroke-linecap: round;
        stroke-dasharray: 157;
    }

    .progress-ring-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 14px;
        font-weight: 700;
    }

    .progress-details {
        flex: 1;
    }

    .progress-stage {
        font-size: 11px;
        margin-bottom: 4px;
    }

    .progress-stage strong {
        color: var(--accent-primary);
    }

    .progress-info {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
    }

    /* ==================== STAGE PIPELINE ==================== */
    .stage-pipeline {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        padding: 8px;
        background: var(--vscode-editor-background);
        border-radius: 6px;
    }

    .pipeline-stage {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
    }

    .pipeline-node {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 600;
    }

    .pipeline-node.complete {
        background: var(--status-complete);
        color: white;
    }

    .pipeline-node.active {
        background: var(--status-active);
        color: white;
        box-shadow: 0 0 12px color-mix(in srgb, var(--status-active) 60%, transparent);
    }

    .pipeline-node.pending {
        background: var(--vscode-input-background);
        color: var(--vscode-descriptionForeground);
        border: 1px dashed var(--vscode-descriptionForeground);
    }

    .pipeline-label {
        font-size: 8px;
        color: var(--vscode-descriptionForeground);
        text-transform: uppercase;
    }

    .pipeline-connector {
        flex: 1;
        height: 2px;
        background: var(--vscode-sideBarSectionHeader-border);
        margin: 0 -4px;
        margin-bottom: 16px;
    }

    .pipeline-connector.complete {
        background: var(--status-complete);
    }

    /* ==================== STORIES SECTION ==================== */
    .stories-section {
        margin-bottom: 12px;
    }

    .stories-header {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        margin-bottom: 6px;
        display: flex;
        justify-content: space-between;
    }

    .stories-list {
        display: flex;
        flex-direction: column;
        gap: 4px;
        max-height: 100px;
        overflow-y: auto;
    }

    .story-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        background: var(--vscode-editor-background);
        border-radius: 4px;
    }

    .story-item.completed .story-name {
        text-decoration: line-through;
        color: var(--vscode-descriptionForeground);
    }

    .story-checkbox {
        width: 14px;
        height: 14px;
        border-radius: 3px;
        border: 1px solid var(--vscode-descriptionForeground);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: white;
    }

    .story-checkbox.checked {
        background: var(--status-complete);
        border-color: var(--status-complete);
    }

    .story-name {
        flex: 1;
        font-size: 11px;
    }

    /* ==================== FOCUS ACTIONS ==================== */
    .focus-actions {
        display: flex;
        gap: 8px;
    }

    .action-btn {
        flex: 1;
        padding: 10px;
        font-size: 11px;
        font-weight: 500;
        border: none;
        border-radius: 6px;
        cursor: pointer;
    }

    .action-btn-primary {
        background: var(--accent-primary);
        color: white;
    }

    .action-btn-secondary {
        background: var(--vscode-input-background);
        color: var(--vscode-foreground);
        border: 1px solid var(--vscode-sideBarSectionHeader-border);
    }

    /* ==================== QUEUE SECTION ==================== */
    .queue-section {
        padding: 12px;
        border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
    }

    .queue-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .queue-title {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--vscode-descriptionForeground);
    }

    .queue-count {
        font-size: 9px;
        padding: 2px 8px;
        border-radius: 10px;
        background: var(--vscode-badge-background);
        color: var(--vscode-badge-foreground);
    }

    .queue-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .queue-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        background: var(--vscode-editor-background);
        border-radius: 6px;
        cursor: pointer;
        border-left: 3px solid transparent;
    }

    .queue-item.blocked {
        opacity: 0.7;
        border-left-color: var(--status-blocked);
    }

    .queue-lock {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: var(--status-blocked);
    }

    .queue-priority {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 600;
        background: var(--vscode-input-background);
        color: var(--vscode-descriptionForeground);
    }

    .queue-info {
        flex: 1;
        min-width: 0;
    }

    .queue-name {
        font-size: 11px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .queue-meta {
        font-size: 9px;
        color: var(--vscode-descriptionForeground);
        margin-top: 2px;
    }

    .queue-blocked-info {
        font-size: 9px;
        color: var(--status-blocked);
        margin-top: 2px;
    }

    .queue-stages {
        display: none;
    }

    .queue-actions {
        flex-shrink: 0;
        margin-left: 8px;
    }

    .queue-start-btn {
        padding: 6px 12px;
        font-size: 11px;
        font-weight: 600;
        border: none;
        border-radius: 4px;
        background: var(--accent-primary);
        color: white;
        cursor: pointer;
    }

    .queue-start-btn.disabled {
        background: var(--vscode-input-background);
        color: var(--vscode-descriptionForeground);
        cursor: not-allowed;
        opacity: 0.7;
    }

    /* ==================== ACTIVITY SECTION ==================== */
    .activity-section {
        padding: 12px;
        padding-top: 0;
        background: var(--vscode-editor-background);
        margin-top: auto;
        display: flex;
        flex-direction: column;
        min-height: 120px;
        max-height: 400px;
    }

    .activity-resize-handle {
        height: 8px;
        cursor: ns-resize;
        background: var(--vscode-sideBarSectionHeader-border);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 -12px;
    }

    .activity-resize-handle.dragging {
        background: var(--accent-primary);
    }

    .activity-resize-handle::after {
        content: '';
        width: 32px;
        height: 3px;
        background: var(--vscode-descriptionForeground);
        border-radius: 2px;
        opacity: 0.5;
    }

    .activity-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
        margin-bottom: 10px;
    }

    .activity-title {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--vscode-descriptionForeground);
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .activity-filter {
        display: flex;
        gap: 4px;
    }

    .activity-filter-btn {
        padding: 3px 8px;
        font-size: 9px;
        border: 1px solid var(--vscode-sideBarSectionHeader-border);
        border-radius: 10px;
        background: var(--vscode-input-background);
        color: var(--vscode-foreground);
        cursor: pointer;
    }

    .activity-filter-btn.active {
        background: var(--accent-primary);
        border-color: var(--accent-primary);
        color: white;
    }

    .activity-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        overflow-y: auto;
    }

    .activity-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 6px;
        cursor: pointer;
        position: relative;
    }

    /* Timeline connector */
    .activity-item::before {
        content: '';
        position: absolute;
        left: 21px;
        top: 32px;
        bottom: -6px;
        width: 2px;
        background: var(--vscode-sideBarSectionHeader-border);
    }

    .activity-item:last-child::before {
        display: none;
    }

    .activity-icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        flex-shrink: 0;
        z-index: 1;
    }

    .activity-icon.stage-complete {
        background: color-mix(in srgb, var(--status-complete) 20%, transparent);
        color: var(--status-complete);
    }

    .activity-icon.bolt-complete {
        background: color-mix(in srgb, var(--status-complete) 30%, transparent);
        color: var(--status-complete);
    }

    .activity-icon.bolt-start {
        background: color-mix(in srgb, var(--status-info) 20%, transparent);
        color: var(--status-info);
    }

    .activity-icon.bolt-created {
        background: color-mix(in srgb, var(--vscode-charts-purple, #8b5cf6) 20%, transparent);
        color: var(--vscode-charts-purple, #8b5cf6);
    }

    .activity-content {
        flex: 1;
        min-width: 0;
    }

    .activity-text {
        font-size: 11px;
        line-height: 1.4;
    }

    .activity-text strong {
        color: var(--accent-primary);
    }

    .activity-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 3px;
    }

    .activity-target {
        font-size: 9px;
        color: var(--vscode-descriptionForeground);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .activity-tag {
        font-size: 8px;
        padding: 2px 6px;
        border-radius: 8px;
        background: var(--vscode-input-background);
        color: var(--vscode-descriptionForeground);
        text-transform: uppercase;
    }

    .activity-time {
        font-size: 9px;
        color: var(--vscode-descriptionForeground);
        white-space: nowrap;
        flex-shrink: 0;
    }

    .activity-open-btn {
        padding: 2px;
        font-size: 11px;
        background: transparent;
        border: none;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        flex-shrink: 0;
        opacity: 0.6;
        line-height: 1;
    }

    /* ==================== SPECS VIEW ==================== */
    .specs-toolbar {
        padding: 8px 12px;
        background: var(--vscode-sideBarSectionHeader-background);
        border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .specs-toolbar-label {
        font-size: 9px;
        color: var(--vscode-descriptionForeground);
        text-transform: uppercase;
    }

    .specs-toolbar-select {
        flex: 1;
        padding: 5px 8px;
        font-size: 10px;
        background: var(--vscode-input-background);
        border: 1px solid var(--vscode-sideBarSectionHeader-border);
        color: var(--vscode-foreground);
        border-radius: 4px;
        cursor: pointer;
    }

    .specs-content {
        flex: 1;
        overflow-y: auto;
    }

    .intent-item {
        border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
    }

    .intent-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        cursor: pointer;
    }

    .intent-expand {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
    }

    .intent-item.collapsed .intent-expand {
        transform: rotate(-90deg);
    }

    .intent-icon {
        font-size: 14px;
    }

    .intent-info {
        flex: 1;
    }

    .intent-name {
        font-size: 12px;
        font-weight: 500;
    }

    .intent-meta {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        margin-top: 2px;
    }

    .intent-progress-ring {
        width: 28px;
        height: 28px;
        position: relative;
    }

    .intent-progress-ring svg {
        transform: rotate(-90deg);
    }

    .intent-progress-ring .ring-bg {
        fill: none;
        stroke: var(--vscode-input-background);
        stroke-width: 3;
    }

    .intent-progress-ring .ring-fill {
        fill: none;
        stroke: var(--status-complete);
        stroke-width: 3;
        stroke-linecap: round;
        stroke-dasharray: 69.115;
    }

    .intent-progress-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 8px;
        font-weight: 600;
    }

    .intent-content {
        max-height: 2000px;
        overflow: hidden;
        background: var(--vscode-editor-background);
    }

    .intent-item.collapsed .intent-content {
        max-height: 0;
    }

    .unit-item {
        border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
    }

    .unit-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px 8px 28px;
        cursor: pointer;
    }

    .unit-expand {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
    }

    .unit-item.collapsed .unit-expand {
        transform: rotate(-90deg);
    }

    .unit-status {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        color: white;
    }

    .unit-status.complete { background: var(--status-complete); }
    .unit-status.active { background: var(--status-active); }
    .unit-status.pending {
        background: var(--vscode-input-background);
        border: 1px dashed var(--vscode-descriptionForeground);
        color: var(--vscode-descriptionForeground);
    }

    .unit-name {
        flex: 1;
        font-size: 11px;
    }

    .unit-progress {
        font-size: 9px;
        color: var(--vscode-descriptionForeground);
    }

    .unit-content {
        max-height: 1000px;
        overflow: hidden;
    }

    .unit-item.collapsed .unit-content {
        max-height: 0;
    }

    .spec-story-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px 6px 52px;
        cursor: pointer;
    }

    .spec-story-status {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid var(--vscode-descriptionForeground);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
    }

    .spec-story-status.complete {
        background: var(--status-complete);
        border-color: var(--status-complete);
        color: white;
    }

    .spec-story-status.active {
        background: var(--status-active);
        border-color: var(--status-active);
        color: white;
    }

    .spec-story-name {
        flex: 1;
        font-size: 11px;
    }

    .spec-story-name.complete {
        color: var(--vscode-descriptionForeground);
    }

    /* ==================== OVERVIEW VIEW ==================== */
    .overview-content {
        padding: 16px;
    }

    .overview-section {
        margin-bottom: 20px;
    }

    .overview-section-title {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--vscode-descriptionForeground);
        margin-bottom: 10px;
    }

    .overview-metrics {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }

    .overview-metric-card {
        background: var(--vscode-editor-background);
        border-radius: 8px;
        padding: 16px;
        text-align: center;
    }

    .overview-metric-value {
        font-size: 28px;
        font-weight: 700;
        margin-bottom: 4px;
    }

    .overview-metric-value.highlight { color: var(--accent-primary); }
    .overview-metric-value.success { color: var(--status-complete); }

    .overview-metric-label {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
    }

    .overview-progress-bar {
        height: 8px;
        background: var(--vscode-input-background);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 20px;
    }

    .overview-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--status-complete), var(--accent-primary));
        border-radius: 4px;
    }

    .overview-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .overview-list-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        background: var(--vscode-editor-background);
        border-radius: 6px;
        cursor: pointer;
    }

    .overview-list-icon {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
    }

    .overview-list-icon.intent {
        background: color-mix(in srgb, var(--vscode-charts-purple, #8b5cf6) 20%, transparent);
        color: var(--vscode-charts-purple, #8b5cf6);
    }

    .overview-list-icon.bolt {
        background: color-mix(in srgb, var(--status-active) 20%, transparent);
        color: var(--status-active);
    }

    .overview-list-icon.action {
        background: color-mix(in srgb, var(--accent-primary) 15%, transparent);
        color: var(--accent-primary);
    }

    .overview-list-icon.action.continue-bolt {
        background: color-mix(in srgb, var(--status-active) 20%, transparent);
        color: var(--status-active);
    }

    .overview-list-icon.action.start-bolt {
        background: color-mix(in srgb, var(--status-info) 20%, transparent);
        color: var(--status-info);
    }

    .overview-list-icon.action.complete-stage {
        background: color-mix(in srgb, var(--status-complete) 20%, transparent);
        color: var(--status-complete);
    }

    .overview-list-info {
        flex: 1;
    }

    .overview-list-name {
        font-size: 12px;
        font-weight: 500;
    }

    .overview-list-meta {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        margin-top: 2px;
    }

    .overview-list-progress {
        font-size: 11px;
        font-weight: 600;
        color: var(--status-complete);
    }

    /* ==================== EMPTY STATE ==================== */
    .empty-state {
        padding: 20px;
        text-align: center;
        color: var(--vscode-descriptionForeground);
    }

    .empty-state-icon {
        font-size: 24px;
        margin-bottom: 8px;
    }

    .empty-state-text {
        font-size: 11px;
    }

    .empty-state-inline {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        background: var(--vscode-editor-background);
        border-radius: 6px;
        color: var(--vscode-descriptionForeground);
        font-size: 11px;
        line-height: 1.4;
    }

    .empty-state-inline-icon {
        font-size: 14px;
        flex-shrink: 0;
    }

    .empty-state-inline-text {
        flex: 1;
    }

    .empty-state-inline code {
        background: var(--vscode-textCodeBlock-background);
        padding: 2px 5px;
        border-radius: 3px;
        font-family: var(--vscode-editor-font-family);
        font-size: 10px;
    }

    /* ==================== SCROLLBAR ==================== */
    ::-webkit-scrollbar {
        width: 8px;
    }

    ::-webkit-scrollbar-track {
        background: transparent;
    }

    ::-webkit-scrollbar-thumb {
        background: var(--vscode-scrollbarSlider-background);
        border-radius: 4px;
    }
    `;
}

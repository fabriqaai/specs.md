/**
 * Webview styles - extracted from variation-8-2.html design mockup.
 * Uses VS Code CSS variables for automatic theme support.
 */

export function getStyles(): string {
    return `
    :root {
        --status-complete: #22c55e;
        --status-active: #f97316;
        --status-pending: #6b7280;
        --status-blocked: #ef4444;
        --status-info: #3b82f6;
        --accent-primary: #f97316;
    }

    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    body {
        font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
        background: var(--vscode-sideBar-background);
        color: var(--vscode-foreground);
        font-size: 13px;
    }

    .sidebar {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    /* ==================== HEADER ==================== */
    .header {
        padding: 10px 12px;
        background: var(--vscode-sideBarSectionHeader-background);
        border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .header-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .header-actions {
        display: flex;
        gap: 4px;
    }

    .icon-btn {
        background: none;
        border: none;
        color: var(--vscode-descriptionForeground);
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 4px;
        font-size: 14px;
        transition: all 0.15s;
    }


    /* ==================== VIEW TABS ==================== */
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
        transition: all 0.15s;
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
        background: linear-gradient(135deg, var(--vscode-editor-background) 0%, rgba(249, 115, 22, 0.1) 100%);
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
        background: rgba(249, 115, 22, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        cursor: pointer;
        transition: background 0.15s;
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
        padding: 0;
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease, padding 0.3s ease;
    }

    .focus-card.expanded .focus-card-body {
        max-height: 400px;
        padding: 12px;
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
        transition: stroke-dashoffset 0.5s ease;
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
        cursor: pointer;
        transition: transform 0.15s;
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
        background: var(--accent-primary);
        color: white;
        box-shadow: 0 0 12px rgba(249, 115, 22, 0.6);
    }

    .pipeline-node.pending {
        background: var(--vscode-input-background);
        color: var(--vscode-descriptionForeground);
        border: 1px dashed var(--vscode-sideBarSectionHeader-border);
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

    /* ==================== STORIES LIST ==================== */
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
        cursor: pointer;
        transition: all 0.15s;
    }

    .story-checkbox {
        width: 14px;
        height: 14px;
        border-radius: 3px;
        border: 1px solid var(--vscode-sideBarSectionHeader-border);
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

    .story-item.completed .story-name {
        text-decoration: line-through;
        color: var(--vscode-descriptionForeground);
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
        transition: all 0.15s;
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
        transition: all 0.15s;
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
        display: flex;
        gap: 2px;
    }

    .queue-stage {
        width: 14px;
        height: 14px;
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        font-weight: 600;
    }

    .queue-stage.complete {
        background: var(--status-complete);
        color: white;
    }

    .queue-stage.active {
        background: var(--accent-primary);
        color: white;
    }

    .queue-stage.pending {
        background: var(--vscode-input-background);
        color: var(--vscode-descriptionForeground);
    }

    /* ==================== ACTIVITY SECTION ==================== */
    .activity-section {
        padding: 12px;
        padding-top: 0;
        margin-top: auto;
        background: var(--vscode-editor-background);
        display: flex;
        flex-direction: column;
        min-height: 120px;
        max-height: 400px;
        flex-shrink: 0;
        overflow: hidden;
    }

    .activity-resize-handle {
        height: 10px;
        background: var(--vscode-sideBarSectionHeader-background);
        border-top: 1px solid var(--vscode-sideBarSectionHeader-border);
        cursor: ns-resize;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 -12px;
        transition: background 0.15s;
        flex-shrink: 0;
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
        margin-bottom: 10px;
        margin-top: 8px;
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
        background: var(--vscode-input-background);
        color: var(--vscode-foreground);
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.15s;
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
        min-height: 0;
        overflow-y: auto;
    }

    .activity-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 8px 10px;
        background: var(--vscode-editor-background);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s;
        position: relative;
    }

    .activity-item::before {
        content: '';
        position: absolute;
        left: 19px;
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
        background: rgba(34, 197, 94, 0.2);
        color: var(--status-complete);
    }

    .activity-icon.bolt-complete {
        background: rgba(34, 197, 94, 0.3);
        color: var(--status-complete);
    }

    .activity-icon.bolt-start {
        background: rgba(59, 130, 246, 0.2);
        color: var(--status-info);
    }

    .activity-icon.bolt-created {
        background: rgba(139, 92, 246, 0.2);
        color: #8b5cf6;
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

    .specs-toolbar-select:focus {
        outline: 1px solid var(--accent-primary);
        border-color: var(--accent-primary);
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
        transition: background 0.15s;
    }

    .intent-expand {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        transition: transform 0.2s;
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
        transition: max-height 0.3s ease;
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
        transition: background 0.15s;
    }

    .unit-expand {
        font-size: 10px;
        color: var(--vscode-descriptionForeground);
        transition: transform 0.2s;
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
        border: 1px dashed var(--vscode-sideBarSectionHeader-border);
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
        transition: max-height 0.3s ease;
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
        transition: background 0.15s;
    }

    .spec-story-status {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 2px solid var(--vscode-sideBarSectionHeader-border);
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
        transition: width 0.5s ease;
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
        transition: all 0.15s;
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
        background: rgba(139, 92, 246, 0.2);
        color: #8b5cf6;
    }

    .overview-list-icon.bolt {
        background: rgba(249, 115, 22, 0.2);
        color: var(--accent-primary);
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

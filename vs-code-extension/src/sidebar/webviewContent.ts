/**
 * HTML/CSS/JS content generation for the webview.
 */

import * as vscode from 'vscode';
import { WebviewData, TabId, ActiveBoltData } from './webviewMessaging';
import { getStylesheet } from './styles';

/**
 * Generates a nonce for CSP.
 */
export function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

/**
 * Generates the full HTML content for the webview.
 */
export function getWebviewContent(
    webview: vscode.Webview,
    data: WebviewData,
    activeTab: TabId
): string {
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <title>SpecsMD</title>
    <style>${getStylesheet()}</style>
</head>
<body>
    <div class="sidebar">
        <div class="header">
            <span class="header-title">SpecsMD</span>
            <div class="header-actions">
                <button type="button" class="icon-btn" id="refreshBtn" title="Refresh">&#8635;</button>
            </div>
        </div>

        <div class="view-tabs">
            <button type="button" class="view-tab ${activeTab === 'bolts' ? 'active' : ''}" data-tab="bolts">
                &#9889; Bolts
            </button>
            <button type="button" class="view-tab ${activeTab === 'specs' ? 'active' : ''}" data-tab="specs">
                &#128203; Specs
            </button>
            <button type="button" class="view-tab ${activeTab === 'overview' ? 'active' : ''}" data-tab="overview">
                &#128202; Overview
            </button>
        </div>

        <div class="view-container ${activeTab === 'bolts' ? 'active' : ''}" id="bolts-view">
            ${getBoltsTabHtml(data)}
        </div>

        <div class="view-container ${activeTab === 'specs' ? 'active' : ''}" id="specs-view">
            ${getSpecsTabHtml(data)}
        </div>

        <div class="view-container ${activeTab === 'overview' ? 'active' : ''}" id="overview-view">
            ${getOverviewTabHtml(data)}
        </div>
    </div>

    <script nonce="${nonce}">${getScripts()}</script>
</body>
</html>`;
}


/**
 * Generates HTML for the Bolts tab.
 */
function getBoltsTabHtml(data: WebviewData): string {
    const intentHeader = data.currentIntent
        ? `<div class="mission-status">
            <div class="mission-label">Current Intent</div>
            <div class="mission-title">${escapeHtml(data.currentIntent.number)}-${escapeHtml(data.currentIntent.name)}</div>
            <div class="mission-stats">
                <div class="mission-stat">
                    <div class="mission-stat-dot active"></div>
                    <span class="mission-stat-value">${data.stats.active}</span>
                    <span class="mission-stat-label">Active</span>
                </div>
                <div class="mission-stat">
                    <div class="mission-stat-dot queued"></div>
                    <span class="mission-stat-value">${data.stats.queued}</span>
                    <span class="mission-stat-label">Queued</span>
                </div>
                <div class="mission-stat">
                    <div class="mission-stat-dot done"></div>
                    <span class="mission-stat-value">${data.stats.done}</span>
                    <span class="mission-stat-label">Done</span>
                </div>
                ${data.stats.blocked > 0 ? `
                <div class="mission-stat">
                    <div class="mission-stat-dot blocked"></div>
                    <span class="mission-stat-value">${data.stats.blocked}</span>
                    <span class="mission-stat-label">Blocked</span>
                </div>
                ` : ''}
            </div>
        </div>`
        : `<div class="mission-status">
            <div class="mission-label">Current Intent</div>
            <div class="mission-title">No intents found</div>
        </div>`;

    const focusSection = data.activeBolt
        ? `<div class="section">
            <div class="section-label">
                <span class="section-label-icon">&#127919;</span>
                Current Focus
            </div>
            <div class="focus-card ${data.focusCardExpanded ? 'expanded' : ''}" data-bolt-id="${escapeHtml(data.activeBolt.id)}">
                <div class="focus-card-header">
                    <span class="focus-card-expand">&#9660;</span>
                    <div class="focus-card-info">
                        <div class="focus-card-title">${escapeHtml(data.activeBolt.name)}</div>
                        <div class="focus-card-subtitle">${escapeHtml(data.activeBolt.type)} Bolt | ${data.activeBolt.currentStage ? escapeHtml(data.activeBolt.currentStage) : 'Not started'} Stage</div>
                    </div>
                    <div class="focus-card-badge">In Progress</div>
                </div>
                <div class="focus-card-body">
                    ${getFocusCardBody(data.activeBolt)}
                </div>
            </div>
        </div>`
        : `<div class="section">
            <div class="section-label">
                <span class="section-label-icon">&#127919;</span>
                Current Focus
            </div>
            <div class="empty-state">
                <div class="empty-state-icon">&#128640;</div>
                <div class="empty-state-text">No active bolt</div>
            </div>
        </div>`;

    // Stage abbreviations for queue items
    const stageAbbrevMap: Record<string, string> = {
        'model': 'M', 'design': 'D', 'architecture': 'A',
        'implement': 'I', 'test': 'T', 'plan': 'P'
    };

    const queueSection = `<div class="section">
        <div class="queue-header">
            <span class="queue-title">Up Next</span>
            <span class="queue-count">${data.upNextQueue.length} bolts</span>
        </div>
        ${data.upNextQueue.length > 0
            ? `<div class="queue-list">
                ${data.upNextQueue.slice(0, 5).map((bolt, idx) => `
                    <div class="queue-item ${bolt.isBlocked ? 'blocked' : ''}" data-bolt-id="${escapeHtml(bolt.id)}">
                        ${bolt.isBlocked
                            ? `<div class="queue-lock">&#128274;</div>`
                            : `<div class="queue-priority">${idx + 1}</div>`
                        }
                        <div class="queue-info">
                            <div class="queue-name">${escapeHtml(bolt.name)}</div>
                            <div class="queue-meta">${escapeHtml(bolt.type)} | ${bolt.storiesCount} stories${bolt.unblocksCount > 0 ? ` | Enables ${bolt.unblocksCount}` : ''}</div>
                            ${bolt.isBlocked ? `<div class="queue-blocked-info">Waiting: ${bolt.blockedBy.map(escapeHtml).join(', ')}</div>` : ''}
                        </div>
                        <div class="queue-stages">
                            ${bolt.stages.map(stage => {
                                const abbrev = stageAbbrevMap[stage.name.toLowerCase()] || stage.name.charAt(0).toUpperCase();
                                return `<div class="queue-stage ${stage.status}">${abbrev}</div>`;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>`
            : `<div class="empty-state">
                <div class="empty-state-text">Queue empty</div>
            </div>`
        }
    </div>`;

    const activitySection = `<div class="activity-section" style="height: ${data.activityHeight}px;">
        <div class="activity-resize-handle" id="activityResizeHandle"></div>
        <div class="activity-header" style="margin-top: 8px;">
            <div class="activity-title">
                <span>&#128340;</span>
                Recent Activity
            </div>
            <div class="activity-filters">
                <button class="activity-filter-btn ${data.activityFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
                <button class="activity-filter-btn ${data.activityFilter === 'stages' ? 'active' : ''}" data-filter="stages">Stages</button>
                <button class="activity-filter-btn ${data.activityFilter === 'bolts' ? 'active' : ''}" data-filter="bolts">Bolts</button>
            </div>
        </div>
        ${data.activityEvents.length > 0
            ? `<div class="activity-list">
                ${data.activityEvents.slice(0, 10).map(event => `
                    <div class="activity-item" data-target="${escapeHtml(event.target)}" data-tag="${event.tag}">
                        <div class="activity-icon ${event.type}">${getActivityIcon(event.type)}</div>
                        <div class="activity-content">
                            <div class="activity-text">${event.text}</div>
                            <div class="activity-meta">
                                <span class="activity-target">${escapeHtml(event.target)}</span>
                                <span class="activity-tag">${event.tag}</span>
                            </div>
                        </div>
                        <div class="activity-time">${escapeHtml(event.relativeTime)}</div>
                    </div>
                `).join('')}
            </div>`
            : `<div class="empty-state">
                <div class="empty-state-text">No recent activity</div>
            </div>`
        }
    </div>`;

    return intentHeader + focusSection + queueSection + activitySection;
}

/**
 * Generates HTML for the Specs tab.
 */
function getSpecsTabHtml(data: WebviewData): string {
    if (data.intents.length === 0) {
        return `<div class="empty-state">
            <div class="empty-state-icon">&#128203;</div>
            <div class="empty-state-text">No intents found</div>
        </div>`;
    }

    return `<div class="specs-content">
        ${data.intents.map(intent => {
            const progress = intent.storiesTotal > 0
                ? Math.round((intent.storiesComplete / intent.storiesTotal) * 100)
                : 0;

            return `<div class="intent-item">
                <div class="intent-header" data-intent="${escapeHtml(intent.number)}">
                    <span class="intent-expand">&#9660;</span>
                    <span class="intent-icon">&#128203;</span>
                    <div class="intent-info">
                        <div class="intent-name">${escapeHtml(intent.number)}-${escapeHtml(intent.name)}</div>
                        <div class="intent-meta">${intent.units.length} units | ${intent.storiesTotal} stories</div>
                    </div>
                    <div class="intent-progress">${progress}%</div>
                </div>
                <div class="intent-content">
                    ${intent.units.map(unit => `
                        <div class="unit-item">
                            <div class="unit-header" data-unit="${escapeHtml(unit.name)}">
                                <span class="unit-expand">&#9660;</span>
                                <div class="unit-status ${unit.status}">
                                    ${unit.status === 'complete' ? '&#10003;' : ''}
                                </div>
                                <span class="unit-name">${escapeHtml(unit.name)}</span>
                                <span class="unit-progress">${unit.storiesComplete}/${unit.storiesTotal}</span>
                            </div>
                            <div class="unit-content">
                                ${unit.stories.map(story => `
                                    <div class="story-item" data-path="${escapeHtml(story.path)}">
                                        <div class="story-status ${story.status}">
                                            ${story.status === 'complete' ? '&#10003;' : story.status === 'active' ? '&#9679;' : ''}
                                        </div>
                                        <span class="story-name ${story.status === 'complete' ? 'complete' : ''}">${escapeHtml(story.id)}-${escapeHtml(story.title)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }).join('')}
    </div>`;
}

/**
 * Generates HTML for the Overview tab.
 */
function getOverviewTabHtml(data: WebviewData): string {
    const totalStories = data.intents.reduce((sum, i) => sum + i.storiesTotal, 0);
    const completedStories = data.intents.reduce((sum, i) => sum + i.storiesComplete, 0);
    const progressPercent = totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0;
    const totalBolts = data.stats.active + data.stats.queued + data.stats.done + data.stats.blocked;

    return `<div class="overview-content">
        <div class="overview-section">
            <div class="overview-section-title">Overall Progress</div>
            <div class="overview-progress-bar">
                <div class="overview-progress-fill" style="width: ${progressPercent}%"></div>
            </div>
            <div class="overview-metrics">
                <div class="overview-metric-card">
                    <div class="overview-metric-value highlight">${progressPercent}%</div>
                    <div class="overview-metric-label">Complete</div>
                </div>
                <div class="overview-metric-card">
                    <div class="overview-metric-value success">${completedStories}/${totalStories}</div>
                    <div class="overview-metric-label">Stories Done</div>
                </div>
                <div class="overview-metric-card">
                    <div class="overview-metric-value">${data.stats.done}/${totalBolts}</div>
                    <div class="overview-metric-label">Bolts Done</div>
                </div>
                <div class="overview-metric-card">
                    <div class="overview-metric-value">${data.intents.length}</div>
                    <div class="overview-metric-label">Intents</div>
                </div>
            </div>
        </div>

        <div class="overview-section">
            <div class="overview-section-title">Intents</div>
            <div class="overview-list">
                ${data.intents.map(intent => {
                    const progress = intent.storiesTotal > 0
                        ? Math.round((intent.storiesComplete / intent.storiesTotal) * 100)
                        : 0;
                    return `
                        <div class="overview-list-item" data-intent="${escapeHtml(intent.number)}">
                            <div class="overview-list-icon intent">&#128203;</div>
                            <div class="overview-list-info">
                                <div class="overview-list-name">${escapeHtml(intent.number)}-${escapeHtml(intent.name)}</div>
                                <div class="overview-list-meta">${intent.units.length} units | ${intent.storiesTotal} stories</div>
                            </div>
                            <div class="overview-list-progress">${progress}%</div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        <div class="overview-section">
            <div class="overview-section-title">Standards</div>
            <div class="overview-list">
                ${data.standards.length > 0
                    ? data.standards.map(standard => `
                        <div class="overview-list-item" data-path="${escapeHtml(standard.path)}">
                            <div class="overview-list-icon intent">&#128220;</div>
                            <div class="overview-list-info">
                                <div class="overview-list-name">${escapeHtml(standard.name)}</div>
                            </div>
                        </div>
                    `).join('')
                    : `<div class="empty-state"><div class="empty-state-text">No standards defined</div></div>`
                }
            </div>
        </div>

        <div class="overview-section">
            <div class="overview-section-title">Resources</div>
            <div class="overview-list">
                <div class="overview-list-item" id="specsWebsiteLink">
                    <div class="overview-list-icon intent">&#127760;</div>
                    <div class="overview-list-info">
                        <div class="overview-list-name">specs.md</div>
                        <div class="overview-list-meta">Visit our website</div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

/**
 * Gets the activity icon for an event type.
 */
function getActivityIcon(type: string): string {
    switch (type) {
        case 'bolt-created': return '&#43;';
        case 'bolt-start': return '&#9654;';
        case 'stage-complete': return '&#10003;';
        case 'bolt-complete': return '&#10004;';
        default: return '&#8226;';
    }
}

/**
 * Generates the focus card body with progress ring, stage pipeline, and stories.
 */
function getFocusCardBody(bolt: ActiveBoltData): string {
    // Calculate progress percentage
    const totalItems = bolt.stagesTotal + bolt.storiesTotal;
    const completedItems = bolt.stagesComplete + bolt.storiesComplete;
    const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // SVG progress ring calculation (larger ring: radius 25, circumference ~157)
    const radius = 25;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (progressPercent / 100) * circumference;

    // Stage pipeline with abbreviations and labels
    const stageLabels: Record<string, string> = {
        'model': 'Model',
        'design': 'Design',
        'architecture': 'ADR',
        'implement': 'Impl',
        'test': 'Test',
        'plan': 'Plan'
    };

    const stageAbbreviations: Record<string, string> = {
        'model': 'M',
        'design': 'D',
        'architecture': 'A',
        'implement': 'I',
        'test': 'T',
        'plan': 'P'
    };

    // Current stage name for display
    const currentStage = bolt.stages.find(s => s.status === 'active');
    const currentStageName = currentStage
        ? stageLabels[currentStage.name.toLowerCase()] || currentStage.name
        : bolt.stages[0]?.name || 'Not started';

    // Build stage pipeline with connectors between stages
    const stagePipelineItems: string[] = [];
    bolt.stages.forEach((stage, idx) => {
        const abbrev = stageAbbreviations[stage.name.toLowerCase()] || stage.name.charAt(0).toUpperCase();
        const label = stageLabels[stage.name.toLowerCase()] || stage.name;

        stagePipelineItems.push(`<div class="stage-pip">
            <div class="stage-pip-indicator ${stage.status}">
                ${stage.status === 'complete' ? '&#10003;' : abbrev}
            </div>
            <span class="stage-pip-label">${escapeHtml(label)}</span>
        </div>`);

        // Add connector between stages (not after last stage)
        if (idx < bolt.stages.length - 1) {
            const connectorStatus = stage.status === 'complete' ? 'complete' : '';
            stagePipelineItems.push(`<div class="pipeline-connector ${connectorStatus}"></div>`);
        }
    });

    // Stories checklist
    const storiesChecklist = bolt.stories.map(story => `
        <div class="focus-story-item">
            <div class="focus-story-checkbox ${story.status}">
                ${story.status === 'complete' ? '&#10003;' : ''}
            </div>
            <span class="focus-story-name ${story.status === 'complete' ? 'complete' : ''}">${escapeHtml(story.id)}</span>
        </div>
    `).join('');

    return `
        <div class="focus-progress">
            <div class="progress-ring-container">
                <svg class="progress-ring" viewBox="0 0 64 64">
                    <circle class="progress-ring-bg" cx="32" cy="32" r="${radius}"></circle>
                    <circle class="progress-ring-fill" cx="32" cy="32" r="${radius}"
                        stroke-dasharray="${circumference}"
                        stroke-dashoffset="${dashOffset}"></circle>
                </svg>
                <div class="progress-ring-text">${progressPercent}%</div>
            </div>
            <div class="progress-details">
                <div class="progress-stage">Stage: <strong>${escapeHtml(currentStageName)}</strong></div>
                <div class="progress-info">${bolt.stagesComplete} of ${bolt.stagesTotal} stages complete</div>
                <div class="progress-info">${bolt.storiesComplete}/${bolt.storiesTotal} stories done</div>
            </div>
        </div>
        <div class="stage-pipeline">
            ${stagePipelineItems.join('')}
        </div>
        ${bolt.stories.length > 0 ? `
            <div class="focus-stories">
                <div class="focus-stories-title">
                    <span>Stories</span>
                    <span>${bolt.storiesComplete}/${bolt.storiesTotal}</span>
                </div>
                <div class="focus-stories-list">
                    ${storiesChecklist}
                </div>
            </div>
        ` : ''}
        <div class="focus-actions">
            <button class="focus-btn primary" id="continueBoltBtn">Continue</button>
            <button class="focus-btn secondary" id="filesBoltBtn">Files</button>
        </div>
    `;
}

/**
 * Generates the JavaScript for the webview.
 */
function getScripts(): string {
    return `
    const vscode = acquireVsCodeApi();

    // Notify extension that webview is ready
    vscode.postMessage({ type: 'ready' });

    // Tab switching
    document.querySelectorAll('.view-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            vscode.postMessage({ type: 'tabChange', tab: tabId });
        });
    });

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        vscode.postMessage({ type: 'refresh' });
    });

    // Focus card expand/collapse
    const focusCard = document.querySelector('.focus-card');
    if (focusCard) {
        const focusHeader = focusCard.querySelector('.focus-card-header');
        if (focusHeader) {
            focusHeader.addEventListener('click', () => {
                focusCard.classList.toggle('expanded');
                const expanded = focusCard.classList.contains('expanded');
                vscode.postMessage({ type: 'toggleFocus', expanded: expanded });
            });
        }

        // Continue button
        const continueBtn = document.getElementById('continueBoltBtn');
        if (continueBtn) {
            continueBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const boltId = focusCard.dataset.boltId;
                if (boltId) {
                    vscode.postMessage({ type: 'startBolt', boltId: boltId });
                }
            });
        }

        // Files button
        const filesBtn = document.getElementById('filesBoltBtn');
        if (filesBtn) {
            filesBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Show files associated with bolt - placeholder for now
            });
        }
    }

    // Activity filter buttons
    document.querySelectorAll('.activity-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;

            // Update active state
            document.querySelectorAll('.activity-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter activity items
            document.querySelectorAll('.activity-item').forEach(item => {
                const tag = item.dataset.tag;
                if (filter === 'all') {
                    item.style.display = 'flex';
                } else if (filter === 'stages' && tag === 'stage') {
                    item.style.display = 'flex';
                } else if (filter === 'bolts' && tag === 'bolt') {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                }
            });

            // Persist filter
            vscode.postMessage({ type: 'activityFilter', filter: filter });
        });
    });

    // Activity resize handle
    const resizeHandle = document.getElementById('activityResizeHandle');
    const activitySection = document.querySelector('.activity-section');
    if (resizeHandle && activitySection) {
        let isResizing = false;
        let startY = 0;
        let startHeight = 0;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startY = e.clientY;
            startHeight = activitySection.offsetHeight;
            document.body.style.cursor = 'ns-resize';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            // Moving up increases height, moving down decreases
            const deltaY = startY - e.clientY;
            let newHeight = startHeight + deltaY;

            // Clamp to min/max
            newHeight = Math.max(120, Math.min(500, newHeight));

            activitySection.style.height = newHeight + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';

                // Persist height
                const finalHeight = activitySection.offsetHeight;
                vscode.postMessage({ type: 'activityResize', height: finalHeight });
            }
        });
    }

    // Intent toggle in specs view
    document.querySelectorAll('.intent-header').forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            item.classList.toggle('collapsed');
        });
    });

    // Unit toggle in specs view
    document.querySelectorAll('.unit-header').forEach(header => {
        header.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = header.parentElement;
            item.classList.toggle('collapsed');
        });
    });

    // Story click in specs view
    document.querySelectorAll('.story-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const path = item.dataset.path;
            if (path) {
                vscode.postMessage({ type: 'openArtifact', kind: 'story', path: path });
            }
        });
    });

    // Overview list item clicks
    document.querySelectorAll('.overview-list-item').forEach(item => {
        item.addEventListener('click', () => {
            const path = item.dataset.path;
            if (path) {
                vscode.postMessage({ type: 'openArtifact', kind: 'standard', path: path });
            } else if (item.dataset.intent) {
                vscode.postMessage({ type: 'tabChange', tab: 'specs' });
            }
        });
    });

    // Queue item clicks
    document.querySelectorAll('.queue-item').forEach(item => {
        item.addEventListener('click', () => {
            const boltId = item.dataset.boltId;
            if (boltId) {
                vscode.postMessage({ type: 'startBolt', boltId: boltId });
            }
        });
    });

    // Website link in Overview tab
    const specsWebsiteLink = document.getElementById('specsWebsiteLink');
    if (specsWebsiteLink) {
        specsWebsiteLink.addEventListener('click', () => {
            vscode.postMessage({ type: 'openExternal', url: 'https://specs.md' });
        });
    }

    // Handle messages from extension
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.type) {
            case 'update':
                // Full page refresh will be handled by extension re-rendering
                break;
            case 'setTab':
                // Tab switch handled by extension re-rendering
                break;
        }
    });
    `;
}

/**
 * Escapes HTML special characters.
 */
function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

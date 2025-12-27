/**
 * HTML generation for webview - based on variation-8-2.html design mockup.
 */

import { WebviewData, TabId, ActiveBoltData, NextActionData, SpecsFilter } from '../sidebar/webviewMessaging';

/**
 * Escape HTML special characters.
 */
export function escapeHtml(text: string): string {
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Capitalize first letter of a string.
 */
function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate mission status section HTML.
 */
export function getMissionStatusHtml(data: WebviewData): string {
    if (!data.currentIntent) {
        return `
        <div class="mission-status">
            <div class="mission-label">Current Intent</div>
            <div class="mission-title">No intents found</div>
        </div>`;
    }

    return `
    <div class="mission-status">
        <div class="mission-label">Current Intent</div>
        <div class="mission-title">${escapeHtml(data.currentIntent.number)}-${escapeHtml(data.currentIntent.name)}</div>
        <div class="mission-stats">
            <div class="mission-stat">
                <div class="mission-stat-dot active"></div>
                <span class="mission-stat-value">${data.stats.active}</span>
                <span class="mission-stat-label">In Progress</span>
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
    </div>`;
}

/**
 * Generate focus card body HTML with progress ring, pipeline, and stories.
 */
function getFocusCardBodyHtml(bolt: ActiveBoltData): string {
    const progressPercent = bolt.stagesTotal > 0 ? Math.round((bolt.stagesComplete / bolt.stagesTotal) * 100) : 0;
    const dashOffset = 157 - (157 * progressPercent / 100);

    // Find current stage name
    const currentStage = bolt.stages.find(s => s.status === 'active');
    const currentStageName = currentStage?.name
        ? capitalize(currentStage.name)
        : (bolt.stages[0]?.name ? capitalize(bolt.stages[0].name) : 'Not started');

    // Build pipeline HTML
    const pipelineHtml = bolt.stages.map((stage, idx) => {
        const stageName = stage.name || 'Unknown';
        const label = capitalize(stageName);
        const nodeHtml = `
            <div class="pipeline-stage">
                <div class="pipeline-node ${stage.status}">
                    ${stage.status === 'complete' ? '&#10003;' : label.charAt(0)}
                </div>
                <span class="pipeline-label">${escapeHtml(label)}</span>
            </div>`;

        const connectorHtml = idx < bolt.stages.length - 1
            ? `<div class="pipeline-connector ${stage.status === 'complete' ? 'complete' : ''}"></div>`
            : '';

        return nodeHtml + connectorHtml;
    }).join('');

    // Build stories HTML
    const storiesHtml = bolt.stories.map(story => `
        <div class="story-item ${story.status === 'complete' ? 'completed' : ''}">
            <div class="story-checkbox ${story.status === 'complete' ? 'checked' : ''}">
                ${story.status === 'complete' ? '&#10003;' : ''}
            </div>
            <span class="story-name">${escapeHtml(story.id)}</span>
        </div>
    `).join('');

    return `
        <div class="progress-ring-container">
            <div class="progress-ring">
                <svg width="64" height="64" viewBox="0 0 64 64">
                    <circle class="progress-ring-bg" cx="32" cy="32" r="25"></circle>
                    <circle class="progress-ring-fill" cx="32" cy="32" r="25" style="stroke-dashoffset: ${dashOffset}"></circle>
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
            ${pipelineHtml}
        </div>

        ${bolt.stories.length > 0 ? `
        <div class="stories-section">
            <div class="stories-header">
                <span>Stories</span>
                <span>${bolt.storiesComplete}/${bolt.storiesTotal}</span>
            </div>
            <div class="stories-list">
                ${storiesHtml}
            </div>
        </div>
        ` : ''}

        <div class="focus-actions">
            <button type="button" class="action-btn action-btn-primary" id="continueBoltBtn">Continue</button>
            <button type="button" class="action-btn action-btn-secondary" id="filesBoltBtn">Files</button>
        </div>
    `;
}

/**
 * Generate focus section HTML.
 */
export function getFocusSectionHtml(data: WebviewData): string {
    if (!data.activeBolts || data.activeBolts.length === 0) {
        return `
        <div class="focus-section">
            <div class="section-label">
                <span class="section-label-icon">&#127919;</span>
                Current Focus
            </div>
            <div class="empty-state-inline">
                <span class="empty-state-inline-icon">&#128640;</span>
                <span class="empty-state-inline-text">No active bolt — run <code>/specsmd-construction-agent</code> to start</span>
            </div>
        </div>`;
    }

    // Render the most recent active bolt (first in the sorted array)
    const bolt = data.activeBolts[0];
    const stageLabel = bolt.currentStage
        ? capitalize(bolt.currentStage)
        : 'Not started';

    return `
    <div class="focus-section">
        <div class="section-label">
            <span class="section-label-icon">&#127919;</span>
            Current Focus
        </div>
        <div class="focus-card ${data.focusCardExpanded ? 'expanded' : ''}" data-bolt-id="${escapeHtml(bolt.id)}">
            <div class="focus-card-header">
                <div>
                    <div class="focus-card-title">${escapeHtml(bolt.name)}</div>
                    <div class="focus-card-subtitle">${escapeHtml(bolt.type)} Bolt | ${escapeHtml(stageLabel)} Stage</div>
                </div>
                <div class="focus-card-badge">In Progress</div>
            </div>
            <div class="focus-card-body">
                ${getFocusCardBodyHtml(bolt)}
            </div>
        </div>
    </div>`;
}

/**
 * Generate queue section HTML.
 */
export function getQueueSectionHtml(data: WebviewData): string {
    const queueHtml = data.upNextQueue.length > 0
        ? data.upNextQueue.slice(0, 5).map((bolt, idx) => {
            const stagesHtml = bolt.stages.map(stage => {
                const stageName = stage.name || 'Unknown';
                return `<div class="queue-stage ${stage.status}">${capitalize(stageName).charAt(0)}</div>`;
            }).join('');

            return `
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
                <div class="queue-actions">
                    ${bolt.isBlocked
                        ? `<button type="button" class="queue-start-btn disabled" disabled title="Blocked by: ${bolt.blockedBy.map(escapeHtml).join(', ')}">Blocked</button>`
                        : `<button type="button" class="queue-start-btn" data-bolt-id="${escapeHtml(bolt.id)}">Start &#9654;</button>`
                    }
                </div>
            </div>`;
        }).join('')
        : `<div class="empty-state"><div class="empty-state-text">Queue empty</div></div>`;

    return `
    <div class="queue-section">
        <div class="queue-header">
            <span class="queue-title">Up Next</span>
            <span class="queue-count">${data.upNextQueue.length} bolts</span>
        </div>
        <div class="queue-list">
            ${queueHtml}
        </div>
    </div>`;
}

/**
 * Get activity icon HTML.
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
 * Get next action icon HTML.
 */
function getNextActionIcon(type: string): string {
    switch (type) {
        case 'continue-bolt': return '&#9654;';  // Play
        case 'start-bolt': return '&#43;';       // Plus
        case 'complete-stage': return '&#10003;'; // Check
        case 'unblock-bolt': return '&#128275;';  // Unlock
        case 'create-bolt': return '&#128221;';   // Memo
        case 'celebrate': return '&#127881;';     // Party
        default: return '&#128161;';              // Lightbulb
    }
}

/**
 * Generate activity section HTML.
 */
export function getActivitySectionHtml(data: WebviewData): string {
    const activityHtml = data.activityEvents.length > 0
        ? data.activityEvents.slice(0, 6).map(event => `
            <div class="activity-item" data-target="${escapeHtml(event.target)}" data-tag="${event.tag}" data-path="${event.path ? escapeHtml(event.path) : ''}">
                <div class="activity-icon ${event.type}">${getActivityIcon(event.type)}</div>
                <div class="activity-content">
                    <div class="activity-text">${event.text}</div>
                    <div class="activity-meta">
                        <span class="activity-target">${escapeHtml(event.target)}</span>
                        <span class="activity-tag">${event.tag}</span>
                    </div>
                </div>
                <div class="activity-time" title="${escapeHtml(event.exactTime)}">${escapeHtml(event.relativeTime)}</div>
                ${event.path ? `<button type="button" class="activity-open-btn" data-path="${escapeHtml(event.path)}" title="Open file">&#128269;</button>` : ''}
            </div>
        `).join('')
        : `<div class="empty-state"><div class="empty-state-text">No recent activity</div></div>`;

    return `
    <div class="activity-section" style="height: ${data.activityHeight}px;">
        <div class="activity-resize-handle" id="activityResizeHandle"></div>
        <div class="activity-header">
            <div class="activity-title">
                <span>&#128340;</span>
                Recent Activity
            </div>
            <div class="activity-filter">
                <button type="button" class="activity-filter-btn ${data.activityFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
                <button type="button" class="activity-filter-btn ${data.activityFilter === 'stages' ? 'active' : ''}" data-filter="stages">Stages</button>
                <button type="button" class="activity-filter-btn ${data.activityFilter === 'bolts' ? 'active' : ''}" data-filter="bolts">Bolts</button>
            </div>
        </div>
        <div class="activity-list">
            ${activityHtml}
        </div>
    </div>`;
}

/**
 * Generate bolts view HTML.
 */
export function getBoltsViewHtml(data: WebviewData): string {
    return getMissionStatusHtml(data)
        + getFocusSectionHtml(data)
        + getQueueSectionHtml(data)
        + getActivitySectionHtml(data);
}

/**
 * Generate specs view HTML.
 */
export function getSpecsViewHtml(data: WebviewData): string {
    const filter = data.specsFilter || 'all';
    const availableStatuses = data.availableStatuses || [];

    // Build dropdown options HTML - show raw status values as they appear in markdown files
    const statusOptionsHtml = availableStatuses
        .map(status => {
            const selected = status === filter ? ' selected' : '';
            return `<option value="${escapeHtml(status)}"${selected}>${escapeHtml(status)}</option>`;
        })
        .join('');

    const allSelected = filter === 'all' ? ' selected' : '';

    // Always show the toolbar with filter dropdown
    const toolbarHtml = `
    <div class="specs-toolbar">
        <span class="specs-toolbar-label">Filter</span>
        <select class="specs-toolbar-select" id="specsFilter">
            <option value="all"${allSelected}>all</option>
            ${statusOptionsHtml}
        </select>
    </div>`;

    // Show empty state if no intents match the filter
    if (data.intents.length === 0) {
        const emptyMessage = filter === 'all'
            ? 'No intents found'
            : `No units with '${escapeHtml(filter)}' status`;
        return `${toolbarHtml}
    <div class="specs-content">
        <div class="empty-state">
            <div class="empty-state-icon">&#128203;</div>
            <div class="empty-state-text">${emptyMessage}</div>
        </div>
    </div>`;
    }

    return `${toolbarHtml}
    <div class="specs-content">
        ${data.intents.map(intent => {
            const progress = intent.storiesTotal > 0
                ? Math.round((intent.storiesComplete / intent.storiesTotal) * 100)
                : 0;
            // Circumference = 2 * π * r = 2 * 3.14159 * 11 = 69.115
            const dashOffset = 69.115 - (69.115 * progress / 100);

            return `
            <div class="intent-item">
                <div class="intent-header" data-intent="${escapeHtml(intent.number)}">
                    <span class="intent-expand">&#9660;</span>
                    <span class="intent-icon">&#127919;</span>
                    <div class="intent-info">
                        <div class="intent-name">${escapeHtml(intent.number)}-${escapeHtml(intent.name)} - intent</div>
                        <div class="intent-meta">${intent.units.length} units | ${intent.storiesTotal} stories</div>
                    </div>
                    <button type="button" class="spec-open-btn intent-open-btn" data-path="${escapeHtml(intent.path)}/requirements.md" title="Open intent requirements">&#128269;</button>
                    <div class="intent-progress-ring">
                        <svg width="28" height="28" viewBox="0 0 28 28">
                            <circle class="ring-bg" cx="14" cy="14" r="11"></circle>
                            <circle class="ring-fill" cx="14" cy="14" r="11" style="stroke-dashoffset: ${dashOffset}"></circle>
                        </svg>
                        <span class="intent-progress-text">${progress}%</span>
                    </div>
                </div>
                <div class="intent-content">
                    ${intent.units.map(unit => `
                        <div class="unit-item">
                            <div class="unit-header" data-unit="${escapeHtml(unit.name)}">
                                <span class="unit-expand">&#9660;</span>
                                <span class="unit-icon">&#128218;</span>
                                <span class="unit-name">${escapeHtml(unit.name)} - unit</span>
                                <button type="button" class="spec-open-btn unit-open-btn" data-path="${escapeHtml(unit.path)}/unit-brief.md" title="Open unit brief">&#128269;</button>
                                <span class="unit-progress">${unit.storiesComplete}/${unit.storiesTotal}</span>
                            </div>
                            <div class="unit-content">
                                ${unit.stories.length > 0
                                    ? unit.stories.map(story => `
                                        <div class="spec-story-item" data-path="${escapeHtml(story.path)}">
                                            <span class="spec-story-icon">&#128221;</span>
                                            <div class="spec-story-status ${story.status}">
                                                ${story.status === 'complete' ? '&#10003;' : story.status === 'active' ? '&#9679;' : ''}
                                            </div>
                                            <span class="spec-story-name ${story.status === 'complete' ? 'complete' : ''}">${escapeHtml(story.id)}-${escapeHtml(story.title)}</span>
                                        </div>
                                    `).join('')
                                    : `<div class="spec-no-stories">No stories in this unit</div>`
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }).join('')}
    </div>`;
}

/**
 * Generate suggested actions section HTML.
 */
function getSuggestedActionsHtml(nextActions: NextActionData[]): string {
    if (nextActions.length === 0) {
        return `
        <div class="overview-section">
            <div class="overview-section-title">Suggested Actions</div>
            <div class="overview-list">
                <div class="empty-state">
                    <div class="empty-state-icon">&#127881;</div>
                    <div class="empty-state-text">All caught up!</div>
                </div>
            </div>
        </div>`;
    }

    return `
    <div class="overview-section">
        <div class="overview-section-title">Suggested Actions</div>
        <div class="overview-list">
            ${nextActions.slice(0, 3).map(action => `
                <div class="overview-list-item action-item" data-action-type="${action.type}" data-target-id="${action.targetId || ''}">
                    <div class="overview-list-icon action ${action.type}">${getNextActionIcon(action.type)}</div>
                    <div class="overview-list-info">
                        <div class="overview-list-name">${escapeHtml(action.title)}</div>
                        <div class="overview-list-meta">${escapeHtml(action.description)}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>`;
}

/**
 * Generate overview view HTML.
 */
export function getOverviewViewHtml(data: WebviewData): string {
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

        ${getSuggestedActionsHtml(data.nextActions)}

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

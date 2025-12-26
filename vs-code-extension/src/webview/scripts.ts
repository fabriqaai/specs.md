/**
 * Webview JavaScript - based on variation-8-2.html design mockup.
 */

export function getScripts(): string {
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
                const boltId = focusCard.dataset.boltId;
                if (boltId) {
                    vscode.postMessage({ type: 'openBoltFiles', boltId: boltId });
                }
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

            // Filter activity items (filter is plural: 'stages'/'bolts', tag is singular: 'stage'/'bolt')
            document.querySelectorAll('.activity-item').forEach(item => {
                const tag = item.dataset.tag;
                if (filter === 'all') {
                    item.style.display = 'flex';
                } else if ((filter === 'stages' && tag === 'stage') || (filter === 'bolts' && tag === 'bolt')) {
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
            resizeHandle.classList.add('dragging');
            document.body.style.cursor = 'ns-resize';
            document.body.style.userSelect = 'none';
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
                resizeHandle.classList.remove('dragging');
                document.body.style.cursor = '';
                document.body.style.userSelect = '';

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

    // Specs filter dropdown
    const specsFilter = document.getElementById('specsFilter');
    if (specsFilter) {
        specsFilter.addEventListener('change', (e) => {
            const filter = e.target.value;
            vscode.postMessage({ type: 'specsFilter', filter: filter });
        });
    }

    // Story click in specs view
    document.querySelectorAll('.spec-story-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const path = item.dataset.path;
            if (path) {
                vscode.postMessage({ type: 'openArtifact', kind: 'story', path: path });
            }
        });
    });

    // Queue start button clicks
    document.querySelectorAll('.queue-start-btn:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const boltId = btn.dataset.boltId;
            if (boltId) {
                vscode.postMessage({ type: 'startBolt', boltId: boltId });
            }
        });
    });

    // Queue item clicks (open bolt details)
    document.querySelectorAll('.queue-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // Don't trigger if start button was clicked
            if (e.target.closest('.queue-start-btn')) return;

            const boltId = item.dataset.boltId;
            if (boltId) {
                vscode.postMessage({ type: 'openBolt', boltId: boltId });
            }
        });
    });

    // Activity open button clicks
    document.querySelectorAll('.activity-open-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const path = btn.dataset.path;
            if (path) {
                vscode.postMessage({ type: 'openArtifact', kind: 'bolt', path: path });
            }
        });
    });

    // Activity item clicks (clicking on the whole item also opens the file)
    document.querySelectorAll('.activity-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // Don't trigger if open button was clicked
            if (e.target.closest('.activity-open-btn')) return;

            const path = item.dataset.path;
            if (path) {
                vscode.postMessage({ type: 'openArtifact', kind: 'bolt', path: path });
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

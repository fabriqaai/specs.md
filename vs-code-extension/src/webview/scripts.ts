/**
 * Webview JavaScript - based on variation-8-2.html design mockup.
 */

export function getScripts(): string {
    return `
(function() {
    try {
        const vscode = acquireVsCodeApi();
        console.log('[SpecsMD] Scripts initializing...');

        // Notify extension that webview is ready
        vscode.postMessage({ type: 'ready' });

        // Tab switching
        const tabs = document.querySelectorAll('.view-tab');
        console.log('[SpecsMD] Found ' + tabs.length + ' tabs');
        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                console.log('[SpecsMD] Tab clicked:', this.dataset.tab);
                vscode.postMessage({ type: 'tabChange', tab: this.dataset.tab });
            });
        });

        // Focus card expand/collapse
        const focusCard = document.querySelector('.focus-card');
        if (focusCard) {
            const focusHeader = focusCard.querySelector('.focus-card-header');
            if (focusHeader) {
                focusHeader.addEventListener('click', function() {
                    focusCard.classList.toggle('expanded');
                    const expanded = focusCard.classList.contains('expanded');
                    vscode.postMessage({ type: 'toggleFocus', expanded: expanded });
                });
            }

            // Continue button
            const continueBtn = document.getElementById('continueBoltBtn');
            if (continueBtn) {
                continueBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const boltId = focusCard.dataset.boltId;
                    if (boltId) {
                        vscode.postMessage({ type: 'continueBolt', boltId: boltId });
                    }
                });
            }

            // Files button
            const filesBtn = document.getElementById('filesBoltBtn');
            if (filesBtn) {
                filesBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    const boltId = focusCard.dataset.boltId;
                    if (boltId) {
                        vscode.postMessage({ type: 'viewBoltFiles', boltId: boltId });
                    }
                });
            }
        }

        // Activity filter buttons
        document.querySelectorAll('.activity-filter-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const filter = this.dataset.filter;

                // Update active state
                document.querySelectorAll('.activity-filter-btn').forEach(function(b) {
                    b.classList.remove('active');
                });
                this.classList.add('active');

                // Filter activity items
                document.querySelectorAll('.activity-item').forEach(function(item) {
                    const tag = item.dataset.tag;
                    if (filter === 'all') {
                        item.style.display = 'flex';
                    } else if ((filter === 'stages' && tag === 'stage') || (filter === 'bolts' && tag === 'bolt')) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                });

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

            resizeHandle.addEventListener('mousedown', function(e) {
                isResizing = true;
                startY = e.clientY;
                startHeight = activitySection.offsetHeight;
                resizeHandle.classList.add('dragging');
                document.body.style.cursor = 'ns-resize';
                document.body.style.userSelect = 'none';
                e.preventDefault();
            });

            document.addEventListener('mousemove', function(e) {
                if (!isResizing) return;
                const deltaY = startY - e.clientY;
                let newHeight = startHeight + deltaY;
                newHeight = Math.max(120, Math.min(500, newHeight));
                activitySection.style.height = newHeight + 'px';
            });

            document.addEventListener('mouseup', function() {
                if (isResizing) {
                    isResizing = false;
                    resizeHandle.classList.remove('dragging');
                    document.body.style.cursor = '';
                    document.body.style.userSelect = '';
                    vscode.postMessage({ type: 'activityResize', height: activitySection.offsetHeight });
                }
            });
        }

        // Intent toggle in specs view
        document.querySelectorAll('.intent-header').forEach(function(header) {
            header.addEventListener('click', function() {
                this.parentElement.classList.toggle('collapsed');
            });
        });

        // Unit toggle in specs view
        document.querySelectorAll('.unit-header').forEach(function(header) {
            header.addEventListener('click', function(e) {
                e.stopPropagation();
                this.parentElement.classList.toggle('collapsed');
            });
        });

        // Specs filter dropdown
        const specsFilter = document.getElementById('specsFilter');
        if (specsFilter) {
            specsFilter.addEventListener('change', function() {
                vscode.postMessage({ type: 'specsFilter', filter: this.value });
            });
        }

        // Story click in specs view
        document.querySelectorAll('.spec-story-item').forEach(function(item) {
            item.addEventListener('click', function(e) {
                e.stopPropagation();
                const path = this.dataset.path;
                if (path) {
                    vscode.postMessage({ type: 'openArtifact', kind: 'story', path: path });
                }
            });
        });

        // Queue start button clicks
        document.querySelectorAll('.queue-start-btn:not(.disabled)').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const boltId = this.dataset.boltId;
                if (boltId) {
                    vscode.postMessage({ type: 'startBolt', boltId: boltId });
                }
            });
        });

        // Queue item clicks
        document.querySelectorAll('.queue-item').forEach(function(item) {
            item.addEventListener('click', function(e) {
                if (e.target.closest('.queue-start-btn')) return;
                const boltId = this.dataset.boltId;
                if (boltId) {
                    vscode.postMessage({ type: 'openBolt', boltId: boltId });
                }
            });
        });

        // Activity open button clicks
        document.querySelectorAll('.activity-open-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const path = this.dataset.path;
                if (path) {
                    vscode.postMessage({ type: 'openArtifact', kind: 'bolt', path: path });
                }
            });
        });

        // Activity item clicks
        document.querySelectorAll('.activity-item').forEach(function(item) {
            item.addEventListener('click', function(e) {
                if (e.target.closest('.activity-open-btn')) return;
                const path = this.dataset.path;
                if (path) {
                    vscode.postMessage({ type: 'openArtifact', kind: 'bolt', path: path });
                }
            });
        });

        // Overview list item clicks
        document.querySelectorAll('.overview-list-item').forEach(function(item) {
            item.addEventListener('click', function() {
                const path = this.dataset.path;
                if (path) {
                    vscode.postMessage({ type: 'openArtifact', kind: 'standard', path: path });
                } else if (this.dataset.intent) {
                    vscode.postMessage({ type: 'tabChange', tab: 'specs' });
                }
            });
        });

        // Website link in Overview tab
        const specsWebsiteLink = document.getElementById('specsWebsiteLink');
        if (specsWebsiteLink) {
            specsWebsiteLink.addEventListener('click', function() {
                vscode.postMessage({ type: 'openExternal', url: 'https://specs.md' });
            });
        }

        // Handle messages from extension
        window.addEventListener('message', function(event) {
            const message = event.data;
            switch (message.type) {
                case 'update':
                case 'setTab':
                    // Handled by extension re-rendering
                    break;
            }
        });

        console.log('[SpecsMD] All event listeners attached successfully');
    } catch (error) {
        console.error('[SpecsMD] Script initialization error:', error);
    }
})();
    `;
}

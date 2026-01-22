/**
 * FIRE Flow Adapter
 *
 * Main entry point for the FIRE flow adapter.
 * Bundles detector, parser, state manager, and UI provider.
 */

import * as vscode from 'vscode';
import { FlowAdapter, FlowId } from '../../core/types';
import { FireFlowDetector, createFireDetector } from './detector';
import { FireParser, createFireParser, FireArtifacts } from './parser';
import { FireStateManager, createFireStateManager, FireWebviewSnapshot } from './state';
import { FireUIProvider, createFireUIProvider, FIRE_TABS } from './ui/provider';

// Re-export all types and utilities
export * from './types';
export { FireFlowDetector, createFireDetector } from './detector';
export { FireParser, createFireParser } from './parser';
export type { FireArtifacts } from './parser';
export { FireStateManager, createFireStateManager } from './state';
export type { FireWebviewSnapshot } from './state';
export { FireUIProvider, createFireUIProvider, FIRE_TABS } from './ui/provider';

/**
 * FIRE Flow Adapter implementation.
 *
 * Provides a complete flow adapter for FIRE (Fast Intent-Run Engineering).
 */
export class FireFlowAdapter implements FlowAdapter<FireWebviewSnapshot, FireArtifacts> {
    readonly flowId: FlowId = 'fire';

    private _detector: FireFlowDetector;
    private _parser: FireParser;
    private _stateManager: FireStateManager;
    private _uiProvider: FireUIProvider;
    private _context: vscode.ExtensionContext | null = null;

    constructor() {
        this._detector = createFireDetector();
        this._parser = createFireParser();
        this._stateManager = createFireStateManager();
        this._uiProvider = createFireUIProvider();
    }

    /**
     * Get the flow detector.
     */
    get detector(): FireFlowDetector {
        return this._detector;
    }

    /**
     * Get the artifact parser.
     */
    get parser(): FireParser {
        return this._parser;
    }

    /**
     * Get the state manager.
     */
    get stateManager(): FireStateManager {
        return this._stateManager;
    }

    /**
     * Get the UI provider.
     */
    get uiProvider(): FireUIProvider {
        return this._uiProvider;
    }

    /**
     * Initialize the flow adapter.
     */
    async initialize(context: vscode.ExtensionContext): Promise<void> {
        this._context = context;

        // Initialize state manager
        this._stateManager.initialize(context);

        // Initialize UI provider with callback to persist state
        this._uiProvider.initialize(context, (key: string, value: unknown) => {
            this._stateManager.persistUIState(key, value);

            // Handle special cases
            if (key === 'expandIntent') {
                const { intentId, expanded } = value as { intentId: string; expanded: boolean };
                const currentExpanded = this._stateManager.getFireUIState().expandedIntents;

                if (expanded && !currentExpanded.includes(intentId)) {
                    this._stateManager.setFireUIState({
                        expandedIntents: [...currentExpanded, intentId]
                    });
                } else if (!expanded && currentExpanded.includes(intentId)) {
                    this._stateManager.setFireUIState({
                        expandedIntents: currentExpanded.filter(id => id !== intentId)
                    });
                }
            } else {
                // General UI state update
                this._stateManager.setFireUIState({ [key]: value } as Partial<FireWebviewSnapshot['ui']>);
            }
        });
    }

    /**
     * Activate the flow for a specific path.
     */
    async activate(flowPath: string): Promise<void> {
        // Set workspace path (parent of .specs-fire)
        const workspacePath = flowPath.replace(/[/\\]\.specs-fire$/, '');
        this._stateManager.setWorkspacePath(workspacePath);

        // Scan and load artifacts
        const artifacts = await this._parser.scanArtifacts(flowPath);
        this._stateManager.loadFromArtifacts(artifacts);
    }

    /**
     * Deactivate the flow.
     */
    async deactivate(): Promise<void> {
        // Clear state
        this._stateManager.dispose();
    }

    /**
     * Refresh the flow's data.
     * Re-scans artifacts and updates state.
     */
    async refresh(): Promise<void> {
        const artifacts = this._stateManager.getArtifacts();
        if (artifacts && artifacts.rootPath) {
            const newArtifacts = await this._parser.scanArtifacts(artifacts.rootPath);
            this._stateManager.loadFromArtifacts(newArtifacts);
        }
    }

    /**
     * Dispose resources.
     */
    dispose(): void {
        this._stateManager.dispose();
    }
}

/**
 * Create a FIRE flow adapter instance.
 */
export function createFireFlowAdapter(): FireFlowAdapter {
    return new FireFlowAdapter();
}

/**
 * AIDLC Flow Adapter
 *
 * Main integration point for AI-DLC flow support.
 * Implements FlowAdapter interface to integrate with the multi-flow architecture.
 *
 * This adapter wraps the existing AIDLC implementation while providing
 * a clean interface for the flow registry.
 */

import * as vscode from 'vscode';
import {
    FlowId,
    FlowAdapter,
    FlowDetector,
    FlowParser,
    FlowStateManager,
    FlowUIProvider
} from '../../core/types';
import { AidlcFlowDetector, createAidlcDetector } from './detector';
import { AidlcParser, AidlcArtifacts, createAidlcParser } from './parser';
import { AidlcStateManager, createAidlcStateManager, WebviewSnapshot } from './state';
import { AidlcUIProvider, createAidlcUIProvider } from './ui/provider';

// Re-export sub-modules for convenience
export * from './detector';
export * from './parser';
export * from './state';
export { AidlcUIProvider, createAidlcUIProvider, AIDLC_TABS } from './ui/provider';

/**
 * AIDLC Flow Adapter implementation.
 *
 * Bundles together:
 * - Detection (memory-bank/ or .specsmd/)
 * - Parsing (intents, units, stories, bolts, standards)
 * - State management (centralized store with computed selectors)
 * - UI rendering (Lit components for bolts, specs, overview)
 */
export class AidlcFlowAdapter implements FlowAdapter<WebviewSnapshot, AidlcArtifacts> {
    readonly flowId: FlowId = 'aidlc';

    private _detector: AidlcFlowDetector;
    private _parser: AidlcParser;
    private _stateManager: AidlcStateManager;
    private _uiProvider: AidlcUIProvider;
    private _context: vscode.ExtensionContext | null = null;
    private _flowPath: string | null = null;
    private _isActive: boolean = false;

    constructor() {
        this._detector = createAidlcDetector();
        this._parser = createAidlcParser();
        this._stateManager = createAidlcStateManager();
        this._uiProvider = createAidlcUIProvider();
    }

    // ========================================================================
    // Interface Getters
    // ========================================================================

    get detector(): FlowDetector {
        return this._detector;
    }

    get parser(): FlowParser<AidlcArtifacts> {
        return this._parser;
    }

    get stateManager(): FlowStateManager<WebviewSnapshot> {
        return this._stateManager;
    }

    get uiProvider(): FlowUIProvider {
        return this._uiProvider;
    }

    // ========================================================================
    // Lifecycle Methods
    // ========================================================================

    /**
     * Initialize the adapter with VS Code context.
     */
    async initialize(context: vscode.ExtensionContext): Promise<void> {
        this._context = context;
        this._stateManager.initialize(context);
        this._uiProvider.initialize(context, (key, value) => {
            this._stateManager.persistUIState(key, value);
        });
    }

    /**
     * Activate this flow for the given path.
     */
    async activate(flowPath: string): Promise<void> {
        this._flowPath = flowPath;
        this._isActive = true;

        // Set workspace path for state manager (parent of memory-bank)
        const workspacePath = flowPath.replace(/[/\\]memory-bank$/, '');
        this._stateManager.setWorkspacePath(workspacePath);

        // Perform initial scan
        await this.refresh();
    }

    /**
     * Deactivate this flow.
     */
    deactivate(): void {
        this._isActive = false;
        // State is preserved for potential re-activation
    }

    /**
     * Refresh the flow's data.
     */
    async refresh(): Promise<void> {
        if (!this._flowPath || !this._isActive) {
            return;
        }

        try {
            const artifacts = await this._parser.scanArtifacts(this._flowPath);
            this._stateManager.loadFromArtifacts(artifacts);
        } catch (error) {
            console.error('AIDLC refresh error:', error);
            throw error;
        }
    }

    /**
     * Dispose all resources.
     */
    dispose(): void {
        this._stateManager.dispose();
        this._isActive = false;
        this._flowPath = null;
    }

    // ========================================================================
    // AIDLC-Specific Methods
    // ========================================================================

    /**
     * Get the underlying state manager for direct access.
     * Useful for backward compatibility with existing code.
     */
    getStateManager(): AidlcStateManager {
        return this._stateManager;
    }

    /**
     * Get the underlying UI provider for direct access.
     */
    getUIProvider(): AidlcUIProvider {
        return this._uiProvider;
    }

    /**
     * Check if this adapter is currently active.
     */
    isActive(): boolean {
        return this._isActive;
    }

    /**
     * Get the current flow path.
     */
    getFlowPath(): string | null {
        return this._flowPath;
    }
}

/**
 * Create an AIDLC flow adapter instance.
 */
export function createAidlcFlowAdapter(): AidlcFlowAdapter {
    return new AidlcFlowAdapter();
}

/**
 * Default export for the adapter.
 */
export default AidlcFlowAdapter;

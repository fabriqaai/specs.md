/**
 * Flow Adapters Module
 *
 * Exports all available flow adapters for registration with the FlowRegistry.
 *
 * Usage:
 * ```typescript
 * import { createAidlcFlowAdapter, createFireFlowAdapter } from './flows';
 *
 * registry.register(createAidlcFlowAdapter());
 * registry.register(createFireFlowAdapter());
 * ```
 */

// AIDLC Flow
export {
    AidlcFlowAdapter,
    createAidlcFlowAdapter,
    AidlcFlowDetector,
    createAidlcDetector,
    AidlcParser,
    createAidlcParser,
    AidlcStateManager,
    createAidlcStateManager,
    AidlcUIProvider,
    createAidlcUIProvider,
    AIDLC_TABS
} from './aidlc';

// Re-export AIDLC types
export type { AidlcArtifacts } from './aidlc/parser';
export type { WebviewSnapshot } from './aidlc/state';

// FIRE Flow
export {
    FireFlowAdapter,
    createFireFlowAdapter,
    FireFlowDetector,
    createFireDetector,
    FireParser,
    createFireParser,
    FireStateManager,
    createFireStateManager,
    FireUIProvider,
    createFireUIProvider,
    FIRE_TABS
} from './fire';

// Re-export FIRE types
export type { FireArtifacts } from './fire/parser';
export type { FireWebviewSnapshot } from './fire/state';

// Simple Flow (future)
// export { SimpleFlowAdapter, createSimpleFlowAdapter } from './simple';

/**
 * Register all available flow adapters with a registry.
 */
import { FlowRegistry } from '../core';
import { createAidlcFlowAdapter } from './aidlc';
import { createFireFlowAdapter } from './fire';

export function registerAllFlows(registry: FlowRegistry): void {
    // Register AIDLC
    registry.register(createAidlcFlowAdapter());

    // Register FIRE
    registry.register(createFireFlowAdapter());

    // TODO: Register Simple when implemented
    // registry.register(createSimpleFlowAdapter());
}

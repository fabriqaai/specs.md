/**
 * FIRE Flow Detector
 *
 * Detects if a workspace contains a FIRE flow project
 * by checking for the .specs-fire directory.
 */

import * as path from 'path';
import { FlowId, FlowInfo } from '../../core/types';
import { BaseFlowDetector } from '../../core/flowDetector';

/**
 * FIRE flow detector implementation.
 *
 * Detects FIRE projects by looking for:
 * - .specs-fire/ directory (primary)
 * - .specs-fire/state.yaml file (confirmation)
 */
export class FireFlowDetector extends BaseFlowDetector {
    readonly flowId: FlowId = 'fire';
    readonly displayName = 'FIRE';
    readonly rootFolder = '.specs-fire';
    readonly icon = '🔥';

    /**
     * Get the path to check for FIRE flow detection.
     */
    protected getDetectionPath(workspacePath: string): string {
        return path.join(workspacePath, this.rootFolder);
    }

    /**
     * Build flow info after successful detection.
     */
    protected buildFlowInfo(workspacePath: string, detectionPath: string): FlowInfo {
        return {
            id: this.flowId,
            displayName: this.displayName,
            rootFolder: this.rootFolder,
            flowPath: detectionPath,
            icon: this.icon
        };
    }
}

/**
 * Create a FIRE flow detector instance.
 */
export function createFireDetector(): FireFlowDetector {
    return new FireFlowDetector();
}

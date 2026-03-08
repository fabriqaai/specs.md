/**
 * FIRE Flow Detector
 *
 * Detects if a workspace contains a FIRE flow project
 * by checking for the .specs-fire directory (project artifacts).
 */

import * as path from 'path';
import * as yaml from 'js-yaml';
import { FlowId, FlowDetectionResult } from '../../core/types';
import { BaseFlowDetector, directoryExists, readFileSafe } from '../../core/flowDetector';

/**
 * FIRE flow detector implementation.
 *
 * Detects FIRE projects by looking for:
 * - .specs-fire/ directory (primary - project artifacts)
 * - Falls back to .specsmd/fire/ directory (flow definition only)
 *
 * The manifest.yaml tracks the currently active flow, not all available flows,
 * so detection is based on directory presence instead.
 */
export class FireFlowDetector extends BaseFlowDetector {
    readonly flowId: FlowId = 'fire';
    readonly displayName = 'FIRE';
    readonly rootFolder = '.specs-fire';
    readonly icon = '🔥';

    detectSync(workspacePath: string): FlowDetectionResult {
        try {
            const artifactsPath = path.join(workspacePath, '.specs-fire');
            const fireFlowPath = path.join(workspacePath, '.specsmd', 'fire');

            // Primary: check for .specs-fire directory (project artifacts)
            if (directoryExists(artifactsPath)) {
                // Try to read version from state.yaml
                let version: string | undefined;
                const stateContent = readFileSafe(path.join(artifactsPath, 'state.yaml'));
                if (stateContent) {
                    try {
                        const state = yaml.load(stateContent) as { version?: string };
                        version = state?.version;
                    } catch { /* ignore parse errors */ }
                }

                return { detected: true, flowPath: artifactsPath, version };
            }

            // Fallback: check for .specsmd/fire directory (flow definition installed but no artifacts yet)
            if (directoryExists(fireFlowPath)) {
                return { detected: true, flowPath: fireFlowPath };
            }

            return { detected: false, flowPath: null };
        } catch (error) {
            console.error('FireFlowDetector.detectSync error:', error);
            return { detected: false, flowPath: null };
        }
    }
}

/**
 * Create a FIRE flow detector instance.
 */
export function createFireDetector(): FireFlowDetector {
    return new FireFlowDetector();
}

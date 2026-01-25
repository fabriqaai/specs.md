/**
 * FIRE Flow Detector
 *
 * Detects if a workspace contains a FIRE flow project
 * by checking for the .specsmd/manifest.yaml with flow: fire.
 */

import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { FlowId, FlowDetectionResult } from '../../core/types';
import { BaseFlowDetector, directoryExists, fileExists, readFileSafe } from '../../core/flowDetector';

/**
 * FIRE flow detector implementation.
 *
 * Detects FIRE projects by looking for:
 * - .specsmd/manifest.yaml with flow: fire
 * - .specsmd/fire/ directory (flow definition)
 * - .specs-fire/ directory (project artifacts, optional)
 */
export class FireFlowDetector extends BaseFlowDetector {
    readonly flowId: FlowId = 'fire';
    readonly displayName = 'FIRE';
    readonly rootFolder = '.specsmd/fire';
    readonly icon = '🔥';

    /**
     * Override synchronous detection to check manifest.yaml.
     */
    detectSync(workspacePath: string): FlowDetectionResult {
        try {
            const manifestPath = path.join(workspacePath, '.specsmd', 'manifest.yaml');

            // Check if manifest exists
            if (!fileExists(manifestPath)) {
                return { detected: false, flowPath: null };
            }

            // Read and parse manifest
            const manifestContent = readFileSafe(manifestPath);
            if (!manifestContent) {
                return { detected: false, flowPath: null };
            }

            const manifest = yaml.load(manifestContent) as { flow?: string; version?: string };

            // Check if flow is fire
            if (manifest?.flow !== 'fire') {
                return { detected: false, flowPath: null };
            }

            // Verify .specsmd/fire directory exists (flow definition)
            const fireFlowPath = path.join(workspacePath, '.specsmd', 'fire');
            if (!directoryExists(fireFlowPath)) {
                return { detected: false, flowPath: null };
            }

            // Check for .specs-fire directory (project artifacts)
            // This is optional - project might just have flow definition
            const artifactsPath = path.join(workspacePath, '.specs-fire');
            const hasArtifacts = directoryExists(artifactsPath);

            return {
                detected: true,
                flowPath: hasArtifacts ? artifactsPath : fireFlowPath,
                version: manifest.version
            };
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

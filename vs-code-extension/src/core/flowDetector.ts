/**
 * FlowDetector - Utility for detecting flows in a workspace.
 *
 * This module provides:
 * - Base detector class for flows to extend
 * - Utility functions for file system checks
 * - Multi-flow detection helpers
 *
 * See: MULTI_FLOW_ARCHITECTURE.md for full documentation.
 */

import * as fs from 'fs';
import * as path from 'path';
import { FlowId, FlowInfo, FlowDetector, FlowDetectionResult } from './types';

// ============================================================================
// Flow Configuration
// ============================================================================

/**
 * Configuration for known flows.
 */
export interface FlowConfig {
    id: FlowId;
    rootFolder: string;
    displayName: string;
    icon: string;
    /** Optional: File that contains version info */
    versionFile?: string;
    /** Optional: Regex pattern to extract version from version file */
    versionPattern?: RegExp;
}

/**
 * Known flow configurations.
 */
export const FLOW_CONFIGS: FlowConfig[] = [
    {
        id: 'fire',
        rootFolder: '.specs-fire',
        displayName: 'FIRE',
        icon: '🔥',
        versionFile: 'state.yaml',
        versionPattern: /^version:\s*["']?([^"'\n\r]+)["']?/m
    },
    {
        id: 'aidlc',
        rootFolder: 'memory-bank',
        displayName: 'AI-DLC',
        icon: '📘'
    },
    {
        id: 'simple',
        rootFolder: 'specs',
        displayName: 'Simple',
        icon: '📄'
    }
];

// ============================================================================
// File System Utilities
// ============================================================================

/**
 * Check if a directory exists.
 * @param dirPath - Path to check
 * @returns true if directory exists
 */
export function directoryExists(dirPath: string): boolean {
    try {
        const stats = fs.statSync(dirPath);
        return stats.isDirectory();
    } catch {
        return false;
    }
}

/**
 * Check if a file exists.
 * @param filePath - Path to check
 * @returns true if file exists
 */
export function fileExists(filePath: string): boolean {
    try {
        const stats = fs.statSync(filePath);
        return stats.isFile();
    } catch {
        return false;
    }
}

/**
 * Read file contents safely.
 * @param filePath - Path to read
 * @returns File contents or null if read fails
 */
export function readFileSafe(filePath: string): string | null {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch {
        return null;
    }
}

/**
 * Extract version from file contents using pattern.
 * @param contents - File contents
 * @param pattern - Regex pattern with capture group for version
 * @returns Extracted version or undefined
 */
export function extractVersion(contents: string, pattern: RegExp): string | undefined {
    const match = contents.match(pattern);
    return match?.[1]?.trim();
}

// ============================================================================
// Base Flow Detector
// ============================================================================

/**
 * Base class for flow detectors.
 * Provides common detection logic that flows can extend.
 */
export abstract class BaseFlowDetector implements FlowDetector {
    abstract readonly flowId: FlowId;
    abstract readonly displayName: string;
    abstract readonly rootFolder: string;
    abstract readonly icon: string;

    /**
     * Optional: File containing version info (relative to root folder).
     */
    protected readonly versionFile?: string;

    /**
     * Optional: Regex pattern to extract version from version file.
     */
    protected readonly versionPattern?: RegExp;

    /**
     * Detect if this flow exists in the workspace.
     * @param workspacePath - Root path of the workspace
     */
    async detect(workspacePath: string): Promise<FlowDetectionResult> {
        return this.detectSync(workspacePath);
    }

    /**
     * Synchronous detection.
     * @param workspacePath - Root path of the workspace
     */
    detectSync(workspacePath: string): FlowDetectionResult {
        const flowPath = path.join(workspacePath, this.rootFolder);

        if (!directoryExists(flowPath)) {
            return {
                detected: false,
                flowPath: null
            };
        }

        // Try to extract version if version file is configured
        let version: string | undefined;
        if (this.versionFile && this.versionPattern) {
            const versionFilePath = path.join(flowPath, this.versionFile);
            const contents = readFileSafe(versionFilePath);
            if (contents) {
                version = extractVersion(contents, this.versionPattern);
            }
        }

        return {
            detected: true,
            flowPath,
            version
        };
    }

    /**
     * Additional validation beyond folder existence.
     * Override in subclasses for flow-specific validation.
     * @param flowPath - Path to the flow's root folder
     */
    protected validateFlow(flowPath: string): boolean {
        // Base implementation just checks folder exists
        return directoryExists(flowPath);
    }
}

// ============================================================================
// Concrete Detectors
// ============================================================================

/**
 * Detector for FIRE flow.
 */
export class FireFlowDetector extends BaseFlowDetector {
    readonly flowId: FlowId = 'fire';
    readonly displayName = 'FIRE';
    readonly rootFolder = '.specs-fire';
    readonly icon = '🔥';
    protected readonly versionFile = 'state.yaml';
    protected readonly versionPattern = /^version:\s*["']?([^"'\n\r]+)["']?/m;

    protected validateFlow(flowPath: string): boolean {
        // FIRE requires state.yaml to be present
        const stateFile = path.join(flowPath, 'state.yaml');
        return fileExists(stateFile);
    }

    detectSync(workspacePath: string): FlowDetectionResult {
        const flowPath = path.join(workspacePath, this.rootFolder);

        if (!directoryExists(flowPath)) {
            return { detected: false, flowPath: null };
        }

        // FIRE can be detected even without state.yaml (initialization state)
        // But we should still try to read version if available
        let version: string | undefined;
        const stateFile = path.join(flowPath, 'state.yaml');
        const contents = readFileSafe(stateFile);
        if (contents && this.versionPattern) {
            version = extractVersion(contents, this.versionPattern);
        }

        return {
            detected: true,
            flowPath,
            version
        };
    }
}

/**
 * Detector for AI-DLC flow.
 */
export class AidlcFlowDetector extends BaseFlowDetector {
    readonly flowId: FlowId = 'aidlc';
    readonly displayName = 'AI-DLC';
    readonly rootFolder = 'memory-bank';
    readonly icon = '📘';

    protected validateFlow(flowPath: string): boolean {
        // AIDLC typically has intents and/or bolts folders
        const intentsPath = path.join(flowPath, 'intents');
        const boltsPath = path.join(flowPath, 'bolts');
        const standardsPath = path.join(flowPath, 'standards');

        // Valid if any of these exist
        return directoryExists(intentsPath) ||
               directoryExists(boltsPath) ||
               directoryExists(standardsPath);
    }
}

/**
 * Detector for Simple flow.
 */
export class SimpleFlowDetector extends BaseFlowDetector {
    readonly flowId: FlowId = 'simple';
    readonly displayName = 'Simple';
    readonly rootFolder = 'specs';
    readonly icon = '📄';
}

// ============================================================================
// Multi-Flow Detection
// ============================================================================

/**
 * Detect all known flows in a workspace.
 * @param workspacePath - Root path of the workspace
 * @param detectors - Array of detectors to use (defaults to all known flows)
 * @returns Array of detected flows
 */
export function detectAllFlows(
    workspacePath: string,
    detectors?: FlowDetector[]
): FlowInfo[] {
    const detectorsToUse = detectors || [
        new FireFlowDetector(),
        new AidlcFlowDetector(),
        new SimpleFlowDetector()
    ];

    const detected: FlowInfo[] = [];

    for (const detector of detectorsToUse) {
        const result = detector.detectSync(workspacePath);

        if (result.detected && result.flowPath) {
            detected.push({
                id: detector.flowId,
                displayName: detector.displayName,
                icon: detector.icon,
                rootFolder: detector.rootFolder,
                version: result.version,
                flowPath: result.flowPath
            });
        }
    }

    return detected;
}

/**
 * Detect all known flows asynchronously.
 * @param workspacePath - Root path of the workspace
 * @param detectors - Array of detectors to use (defaults to all known flows)
 * @returns Promise resolving to array of detected flows
 */
export async function detectAllFlowsAsync(
    workspacePath: string,
    detectors?: FlowDetector[]
): Promise<FlowInfo[]> {
    const detectorsToUse = detectors || [
        new FireFlowDetector(),
        new AidlcFlowDetector(),
        new SimpleFlowDetector()
    ];

    const results = await Promise.all(
        detectorsToUse.map(async (detector) => {
            const result = await detector.detect(workspacePath);
            if (result.detected && result.flowPath) {
                return {
                    id: detector.flowId,
                    displayName: detector.displayName,
                    icon: detector.icon,
                    rootFolder: detector.rootFolder,
                    version: result.version,
                    flowPath: result.flowPath
                } as FlowInfo;
            }
            return null;
        })
    );

    return results.filter((f): f is FlowInfo => f !== null);
}

/**
 * Get the default flow from detected flows based on priority.
 * @param detectedFlows - Array of detected flows
 * @param priority - Priority order (default: fire > aidlc > simple)
 * @returns Default flow or null if none detected
 */
export function getDefaultFlow(
    detectedFlows: FlowInfo[],
    priority: FlowId[] = ['fire', 'aidlc', 'simple']
): FlowInfo | null {
    if (detectedFlows.length === 0) {
        return null;
    }

    for (const flowId of priority) {
        const flow = detectedFlows.find(f => f.id === flowId);
        if (flow) {
            return flow;
        }
    }

    return detectedFlows[0];
}

/**
 * Check if any flow is detected in the workspace.
 * Quick check for extension activation.
 * @param workspacePath - Root path of the workspace
 * @returns true if any flow is detected
 */
export function hasAnyFlow(workspacePath: string): boolean {
    for (const config of FLOW_CONFIGS) {
        const flowPath = path.join(workspacePath, config.rootFolder);
        if (directoryExists(flowPath)) {
            return true;
        }
    }
    return false;
}

/**
 * Check if a specific flow is detected.
 * @param workspacePath - Root path of the workspace
 * @param flowId - Flow to check
 * @returns true if the specified flow is detected
 */
export function hasFlow(workspacePath: string, flowId: FlowId): boolean {
    const config = FLOW_CONFIGS.find(c => c.id === flowId);
    if (!config) {
        return false;
    }

    const flowPath = path.join(workspacePath, config.rootFolder);
    return directoryExists(flowPath);
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a detector for a specific flow.
 * @param flowId - Flow identifier
 * @returns Detector instance or undefined if flow is not known
 */
export function createDetector(flowId: FlowId): FlowDetector | undefined {
    switch (flowId) {
        case 'fire':
            return new FireFlowDetector();
        case 'aidlc':
            return new AidlcFlowDetector();
        case 'simple':
            return new SimpleFlowDetector();
        default:
            return undefined;
    }
}

/**
 * Create detectors for all known flows.
 * @returns Array of detector instances
 */
export function createAllDetectors(): FlowDetector[] {
    return [
        new FireFlowDetector(),
        new AidlcFlowDetector(),
        new SimpleFlowDetector()
    ];
}

/**
 * AIDLC Flow Detector
 *
 * Detects AI-DLC projects by looking for memory-bank/ folder.
 * Also checks for .specsmd/ folder as an alternative indicator.
 */

import * as path from 'path';
import {
    BaseFlowDetector,
    directoryExists
} from '../../core/flowDetector';
import { FlowId, FlowDetectionResult } from '../../core/types';

/**
 * Detector for AI-DLC flow.
 *
 * Detection criteria:
 * - Primary: `memory-bank/` folder exists
 * - Alternative: `.specsmd/` folder exists
 *
 * The memory-bank folder is expected to contain:
 * - intents/ - Feature specifications
 * - bolts/ - Construction sessions
 * - standards/ - Project standards
 */
export class AidlcFlowDetector extends BaseFlowDetector {
    readonly flowId: FlowId = 'aidlc';
    readonly displayName = 'AI-DLC';
    readonly rootFolder = 'memory-bank';
    readonly icon = '📘';

    /**
     * Alternative root folder (.specsmd) for detection.
     */
    private readonly altRootFolder = '.specsmd';

    /**
     * Detect AI-DLC flow in workspace.
     */
    detectSync(workspacePath: string): FlowDetectionResult {
        // Check primary location: memory-bank/
        const memoryBankPath = path.join(workspacePath, this.rootFolder);
        if (directoryExists(memoryBankPath)) {
            return {
                detected: true,
                flowPath: memoryBankPath
            };
        }

        // Check alternative location: .specsmd/
        const specsmdPath = path.join(workspacePath, this.altRootFolder);
        if (directoryExists(specsmdPath)) {
            // For .specsmd/, we still report memory-bank as the root
            // because artifacts are stored there
            const mbPath = path.join(workspacePath, this.rootFolder);
            return {
                detected: true,
                flowPath: directoryExists(mbPath) ? mbPath : specsmdPath
            };
        }

        return {
            detected: false,
            flowPath: null
        };
    }

    /**
     * Validate that this is a proper AI-DLC project.
     * A valid project has at least one of: intents/, bolts/, or standards/
     */
    protected validateFlow(flowPath: string): boolean {
        const intentsPath = path.join(flowPath, 'intents');
        const boltsPath = path.join(flowPath, 'bolts');
        const standardsPath = path.join(flowPath, 'standards');

        return directoryExists(intentsPath) ||
               directoryExists(boltsPath) ||
               directoryExists(standardsPath);
    }
}

/**
 * Create an AIDLC detector instance.
 */
export function createAidlcDetector(): AidlcFlowDetector {
    return new AidlcFlowDetector();
}

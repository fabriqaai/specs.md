/**
 * Project detection utilities.
 * Determines whether a workspace is a specsmd project.
 */

import * as fs from 'fs';
import { MemoryBankSchema } from './memoryBankSchema';

/**
 * Checks if a directory exists.
 *
 * @param dirPath - Path to check
 * @returns true if directory exists, false otherwise
 */
function directoryExists(dirPath: string): boolean {
    try {
        const stats = fs.statSync(dirPath);
        return stats.isDirectory();
    } catch {
        return false;
    }
}

/**
 * Detects if the given workspace is a specsmd project.
 *
 * A workspace is considered a specsmd project if it has:
 * - A `memory-bank/` folder, OR
 * - A `.specsmd/` folder
 *
 * @param workspacePath - The root workspace path to check
 * @returns true if this is a specsmd project, false otherwise
 *
 * @example
 * ```typescript
 * const isProject = await detectProject('/path/to/workspace');
 * if (isProject) {
 *   // Show artifact tree
 * } else {
 *   // Show welcome/install view
 * }
 * ```
 */
export async function detectProject(workspacePath: string | undefined): Promise<boolean> {
    if (!workspacePath) {
        return false;
    }

    const schema = new MemoryBankSchema(workspacePath);

    // Check for memory-bank folder
    const memoryBankPath = schema.getMemoryBankPath();
    if (directoryExists(memoryBankPath)) {
        return true;
    }

    // Check for .specsmd folder
    const specsmdPath = schema.getSpecsmdPath();
    if (directoryExists(specsmdPath)) {
        return true;
    }

    return false;
}

/**
 * Synchronous version of detectProject for use in activation.
 *
 * @param workspacePath - The root workspace path to check
 * @returns true if this is a specsmd project, false otherwise
 */
export function detectProjectSync(workspacePath: string | undefined): boolean {
    if (!workspacePath) {
        return false;
    }

    const schema = new MemoryBankSchema(workspacePath);

    // Check for memory-bank folder
    const memoryBankPath = schema.getMemoryBankPath();
    if (directoryExists(memoryBankPath)) {
        return true;
    }

    // Check for .specsmd folder
    const specsmdPath = schema.getSpecsmdPath();
    if (directoryExists(specsmdPath)) {
        return true;
    }

    return false;
}

/**
 * Gets detailed project detection info.
 *
 * @param workspacePath - The root workspace path to check
 * @returns Object with detection details
 */
export function getProjectInfo(workspacePath: string | undefined): {
    isProject: boolean;
    hasMemoryBank: boolean;
    hasSpecsmd: boolean;
    memoryBankPath: string | null;
    specsmdPath: string | null;
} {
    if (!workspacePath) {
        return {
            isProject: false,
            hasMemoryBank: false,
            hasSpecsmd: false,
            memoryBankPath: null,
            specsmdPath: null
        };
    }

    const schema = new MemoryBankSchema(workspacePath);

    const memoryBankPath = schema.getMemoryBankPath();
    const specsmdPath = schema.getSpecsmdPath();

    const hasMemoryBank = directoryExists(memoryBankPath);
    const hasSpecsmd = directoryExists(specsmdPath);

    return {
        isProject: hasMemoryBank || hasSpecsmd,
        hasMemoryBank,
        hasSpecsmd,
        memoryBankPath: hasMemoryBank ? memoryBankPath : null,
        specsmdPath: hasSpecsmd ? specsmdPath : null
    };
}

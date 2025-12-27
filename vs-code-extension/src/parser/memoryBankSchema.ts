/**
 * Central class for memory-bank path definitions.
 * Provides all paths used by the artifact parser.
 *
 * Design note: Currently uses hardcoded paths for Phase 1.
 * Future: Will support dynamic loading from memory-bank.yaml.
 */

import * as path from 'path';

/**
 * MemoryBankSchema provides all path definitions for memory-bank artifacts.
 * This is the single source of truth for path construction.
 */
export class MemoryBankSchema {
    private readonly workspacePath: string;

    /**
     * Creates a new MemoryBankSchema instance.
     * @param workspacePath - The root workspace path
     */
    constructor(workspacePath: string) {
        this.workspacePath = workspacePath;
    }

    /**
     * Gets the root memory-bank folder path.
     * @returns Path to memory-bank/
     */
    getMemoryBankPath(): string {
        return path.join(this.workspacePath, 'memory-bank');
    }

    /**
     * Gets the intents folder path.
     * @returns Path to memory-bank/intents/
     */
    getIntentsPath(): string {
        return path.join(this.getMemoryBankPath(), 'intents');
    }

    /**
     * Gets the bolts folder path.
     * @returns Path to memory-bank/bolts/
     */
    getBoltsPath(): string {
        return path.join(this.getMemoryBankPath(), 'bolts');
    }

    /**
     * Gets the standards folder path.
     * @returns Path to memory-bank/standards/
     */
    getStandardsPath(): string {
        return path.join(this.getMemoryBankPath(), 'standards');
    }

    /**
     * Gets the units folder path for a specific intent.
     * @param intentName - The intent folder name (e.g., "001-user-auth")
     * @returns Path to memory-bank/intents/{intent}/units/
     */
    getUnitsPath(intentName: string): string {
        return path.join(this.getIntentsPath(), intentName, 'units');
    }

    /**
     * Gets the stories folder path for a specific unit.
     * @param intentName - The intent folder name
     * @param unitName - The unit folder name
     * @returns Path to memory-bank/intents/{intent}/units/{unit}/stories/
     */
    getStoriesPath(intentName: string, unitName: string): string {
        return path.join(this.getUnitsPath(intentName), unitName, 'stories');
    }

    /**
     * Gets the path to a specific bolt folder.
     * @param boltId - The bolt ID (e.g., "bolt-artifact-parser-1")
     * @returns Path to memory-bank/bolts/{boltId}/
     */
    getBoltPath(boltId: string): string {
        return path.join(this.getBoltsPath(), boltId);
    }

    /**
     * Gets the .specsmd configuration folder path.
     * @returns Path to .specsmd/
     */
    getSpecsmdPath(): string {
        return path.join(this.workspacePath, '.specsmd');
    }

    /**
     * Gets the path to an intent folder.
     * @param intentName - The intent folder name
     * @returns Path to memory-bank/intents/{intent}/
     */
    getIntentPath(intentName: string): string {
        return path.join(this.getIntentsPath(), intentName);
    }

    /**
     * Gets the path to a unit folder.
     * @param intentName - The intent folder name
     * @param unitName - The unit folder name
     * @returns Path to memory-bank/intents/{intent}/units/{unit}/
     */
    getUnitPath(intentName: string, unitName: string): string {
        return path.join(this.getUnitsPath(intentName), unitName);
    }

    /**
     * Gets the path to the unit-brief.md file.
     * @param intentName - The intent folder name
     * @param unitName - The unit folder name
     * @returns Path to unit-brief.md
     */
    getUnitBriefPath(intentName: string, unitName: string): string {
        return path.join(this.getUnitPath(intentName, unitName), 'unit-brief.md');
    }

    /**
     * Gets the path to the requirements.md file for an intent.
     * @param intentName - The intent folder name
     * @returns Path to requirements.md
     */
    getRequirementsPath(intentName: string): string {
        return path.join(this.getIntentPath(intentName), 'requirements.md');
    }

    /**
     * Gets the path to the bolt.md file.
     * @param boltId - The bolt ID
     * @returns Path to bolt.md
     */
    getBoltFilePath(boltId: string): string {
        return path.join(this.getBoltPath(boltId), 'bolt.md');
    }
}

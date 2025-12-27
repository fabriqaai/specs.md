/**
 * TypeScript interfaces and types for memory-bank artifact parsing.
 * These types represent the structure of AI-DLC artifacts.
 */

/**
 * Normalized artifact status.
 * Handles variations in status strings from frontmatter.
 */
export enum ArtifactStatus {
    Draft = 'draft',
    InProgress = 'in-progress',
    Complete = 'complete',
    Blocked = 'blocked',
    Unknown = 'unknown'
}

/**
 * Represents a stage within a bolt.
 */
export interface Stage {
    name: string;
    order: number;
    status: ArtifactStatus;
    /** Timestamp when stage was completed (ISO 8601) */
    completedAt?: Date;
    /** Artifact produced by this stage */
    artifact?: string;
}

/**
 * Represents a user story within a unit.
 */
export interface Story {
    /** Story number, e.g., "001" */
    id: string;
    /** Story title from filename or frontmatter */
    title: string;
    /** Parent unit name */
    unitName: string;
    /** Parent intent name */
    intentName: string;
    /** Full path to story file */
    path: string;
    /** Parsed status */
    status: ArtifactStatus;
    /** Priority: must, should, could */
    priority: string;
}

/**
 * Represents a unit (deployable work unit) within an intent.
 */
export interface Unit {
    /** Unit name from folder */
    name: string;
    /** Parent intent name */
    intentName: string;
    /** Full path to unit folder */
    path: string;
    /** Calculated status based on stories */
    status: ArtifactStatus;
    /** Raw status string from frontmatter (for display/filtering) */
    rawStatus?: string;
    /** Child stories */
    stories: Story[];
}

/**
 * Represents an intent (feature/capability).
 */
export interface Intent {
    /** Intent name from folder (without number prefix) */
    name: string;
    /** Number prefix, e.g., "001" */
    number: string;
    /** Full path to intent folder */
    path: string;
    /** Parsed status from requirements.md or calculated */
    status: ArtifactStatus;
    /** Child units */
    units: Unit[];
}

/**
 * Represents a bolt (construction session).
 */
export interface Bolt {
    /** Bolt ID, e.g., "bolt-artifact-parser-1" */
    id: string;
    /** Unit this bolt belongs to */
    unit: string;
    /** Intent this bolt belongs to */
    intent: string;
    /** Bolt type: simple-construction-bolt, ddd-construction-bolt */
    type: string;
    /** Current bolt status */
    status: ArtifactStatus;
    /** Current stage name, null if not started */
    currentStage: string | null;
    /** All stages for this bolt type */
    stages: Stage[];
    /** Names of completed stages */
    stagesCompleted: string[];
    /** Story IDs included in this bolt */
    stories: string[];
    /** Full path to bolt folder */
    path: string;
    /** Full path to bolt.md file */
    filePath: string;

    // Dependency fields
    /** IDs of bolts that must complete before this bolt can start */
    requiresBolts: string[];
    /** IDs of bolts that this bolt enables (become unblocked when this completes) */
    enablesBolts: string[];
    /** Computed: true if any required bolts are incomplete */
    isBlocked: boolean;
    /** Computed: IDs of incomplete required bolts */
    blockedBy: string[];
    /** Computed: number of bolts this bolt enables */
    unblocksCount: number;

    // Timestamp fields for activity feed
    /** When bolt was created (ISO 8601) */
    createdAt?: Date;
    /** When bolt was started (ISO 8601) */
    startedAt?: Date;
    /** When bolt was completed (ISO 8601) */
    completedAt?: Date;
}

/**
 * Represents a project standard.
 */
export interface Standard {
    /** Standard name from filename */
    name: string;
    /** Full path to standard file */
    path: string;
}

/**
 * Complete model of memory-bank contents.
 */
export interface MemoryBankModel {
    /** All intents with nested units and stories */
    intents: Intent[];
    /** All bolts */
    bolts: Bolt[];
    /** All standards */
    standards: Standard[];
    /** Whether this is a valid specsmd project */
    isProject: boolean;
}

/**
 * Parsed frontmatter data.
 * Keys are dynamic based on artifact type.
 */
export type FrontmatterData = Record<string, unknown>;

/**
 * Bolt type definitions for stage mapping.
 */
export const BOLT_TYPE_STAGES: Record<string, string[]> = {
    'simple-construction-bolt': ['plan', 'implement', 'test'],
    'ddd-construction-bolt': ['model', 'design', 'adr', 'implement', 'test'],
    'spike-bolt': ['explore', 'document']
};

/**
 * Stage name aliases for flexible matching.
 * Maps canonical stage names to variations that may appear in bolt frontmatter.
 */
export const STAGE_ALIASES: Record<string, string[]> = {
    'model': ['model', 'domain-model', 'domain_model'],
    'design': ['design', 'technical-design', 'technical_design'],
    'adr': ['adr', 'adr-analysis', 'adr_analysis'],
    'implement': ['implement', 'implementation'],
    'test': ['test', 'testing'],
    'plan': ['plan', 'planning'],
    'explore': ['explore', 'exploration'],
    'document': ['document', 'documentation']
};

/**
 * Check if a completed stage matches an expected stage name.
 * Uses alias matching for flexibility.
 */
export function stageMatches(expectedStage: string, completedStage: string): boolean {
    const normalizedCompleted = completedStage.toLowerCase();
    const normalizedExpected = expectedStage.toLowerCase();

    // Direct match
    if (normalizedCompleted === normalizedExpected) {
        return true;
    }

    // Check aliases
    const aliases = STAGE_ALIASES[normalizedExpected];
    if (aliases && aliases.includes(normalizedCompleted)) {
        return true;
    }

    // Fallback: substring matching (e.g., "model" in "domain-model")
    return normalizedCompleted.includes(normalizedExpected) ||
           normalizedExpected.includes(normalizedCompleted);
}

/**
 * Activity event types for the activity feed.
 */
export type ActivityEventType = 'bolt-created' | 'bolt-start' | 'stage-complete' | 'bolt-complete';

/**
 * Represents an activity event derived from bolt timestamps.
 * Used to build the activity feed in the command center UI.
 */
export interface ActivityEvent {
    /** Unique event ID, e.g., "bolt-artifact-parser-1-started" */
    id: string;
    /** Event type */
    type: ActivityEventType;
    /** When the event occurred */
    timestamp: Date;
    /** Icon character for display */
    icon: string;
    /** CSS class for icon styling */
    iconClass: string;
    /** Human-readable description */
    text: string;
    /** ID of the bolt this event relates to */
    targetId: string;
    /** Display name of the bolt */
    targetName: string;
    /** Category tag for filtering */
    tag: 'bolt' | 'stage';
    /** Path to the bolt.md file for navigation */
    path?: string;
}

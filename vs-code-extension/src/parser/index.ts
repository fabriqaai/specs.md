/**
 * Memory Bank Parser Module
 *
 * This module provides all functionality for parsing AI-DLC memory-bank artifacts.
 *
 * @example
 * ```typescript
 * import {
 *   scanMemoryBank,
 *   detectProject,
 *   MemoryBankSchema,
 *   ArtifactStatus
 * } from './parser';
 *
 * const isProject = await detectProject('/path/to/workspace');
 * if (isProject) {
 *   const model = await scanMemoryBank('/path/to/workspace');
 *   console.log(`Found ${model.intents.length} intents`);
 * }
 * ```
 */

// Types
export {
    ArtifactStatus,
    Stage,
    Story,
    Unit,
    Intent,
    Bolt,
    Standard,
    MemoryBankModel,
    FrontmatterData,
    BOLT_TYPE_STAGES,
    STAGE_ALIASES,
    stageMatches,
    ActivityEvent,
    ActivityEventType
} from './types';

// Bolt Type Parser
export {
    getBoltTypeStages,
    loadBoltTypeDefinition,
    clearBoltTypeCache,
    BoltTypeStage,
    BoltTypeDefinition
} from './boltTypeParser';

// Schema
export { MemoryBankSchema } from './memoryBankSchema';

// Project Detection
export {
    detectProject,
    detectProjectSync,
    getProjectInfo
} from './projectDetection';

// Frontmatter Parsing
export {
    parseFrontmatter,
    normalizeStatus,
    extractFrontmatterField,
    extractStatus
} from './frontmatterParser';

// Artifact Parsing
export {
    scanMemoryBank,
    parseIntent,
    parseUnit,
    parseStory,
    parseBolt,
    parseStandard
} from './artifactParser';

// Dependency Computation
export {
    computeBoltDependencies,
    getUpNextBolts,
    isBoltBlocked,
    getBlockingBolts,
    countUnblocks
} from './dependencyComputation';

// Activity Feed
export {
    buildActivityFeed,
    filterActivityEvents,
    limitActivityEvents,
    formatRelativeTime
} from './activityFeed';

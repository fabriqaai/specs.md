/**
 * AIDLC Parser Module
 *
 * Wraps the existing parser implementation to fit the FlowParser interface.
 * Re-exports all types and functions for backward compatibility.
 */

import * as path from 'path';
import { FlowParser, ArtifactParseResult } from '../../../core/types';

// Re-export all types from the original parser for backward compatibility
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
} from '../../../parser/types';

export {
    getBoltTypeStages,
    loadBoltTypeDefinition,
    clearBoltTypeCache,
    BoltTypeStage,
    BoltTypeDefinition
} from '../../../parser/boltTypeParser';

export { MemoryBankSchema } from '../../../parser/memoryBankSchema';

export {
    detectProject,
    detectProjectSync,
    getProjectInfo
} from '../../../parser/projectDetection';

export {
    parseFrontmatter,
    normalizeStatus,
    extractFrontmatterField,
    extractStatus
} from '../../../parser/frontmatterParser';

export {
    scanMemoryBank,
    parseIntent,
    parseUnit,
    parseStory,
    parseBolt,
    parseStandard
} from '../../../parser/artifactParser';

export {
    computeBoltDependencies,
    getUpNextBolts,
    isBoltBlocked,
    getBlockingBolts,
    countUnblocks
} from '../../../parser/dependencyComputation';

export {
    buildActivityFeed,
    filterActivityEvents,
    limitActivityEvents,
    formatRelativeTime
} from '../../../parser/activityFeed';

// Import for internal use
import { scanMemoryBank } from '../../../parser/artifactParser';
import { MemoryBankModel } from '../../../parser/types';

/**
 * AIDLC artifacts structure returned by the parser.
 * Currently identical to MemoryBankModel but kept as separate type for future extension.
 */
export type AidlcArtifacts = MemoryBankModel;

/**
 * AIDLC-specific FlowParser implementation.
 *
 * Wraps the existing scanMemoryBank function to fit the FlowParser interface.
 */
export class AidlcParser implements FlowParser<AidlcArtifacts> {
    /**
     * Scan and parse all artifacts from the memory-bank folder.
     * @param rootPath - Path to the memory-bank folder
     */
    async scanArtifacts(rootPath: string): Promise<AidlcArtifacts> {
        // Get workspace root (parent of memory-bank)
        const workspacePath = path.dirname(rootPath);
        const model = await scanMemoryBank(workspacePath);
        return model as AidlcArtifacts;
    }

    /**
     * Get glob patterns to watch for changes.
     * @returns Array of glob patterns relative to memory-bank
     */
    watchPatterns(): string[] {
        return [
            '**/*.md',
            '**/*.yaml',
            '**/*.yml'
        ];
    }

    /**
     * Parse a single artifact file.
     * @param filePath - Path to the file to parse
     */
    async parseArtifact(filePath: string): Promise<ArtifactParseResult | null> {
        // Determine artifact type from path
        const normalizedPath = filePath.replace(/\\/g, '/');

        if (normalizedPath.includes('/bolts/') && normalizedPath.endsWith('bolt.md')) {
            // This is a bolt file
            // For now, return a generic result - full parsing would require more context
            return {
                type: 'bolt',
                data: null, // Would need parseBolt with full context
                path: filePath
            };
        }

        if (normalizedPath.includes('/intents/')) {
            if (normalizedPath.includes('/stories/')) {
                return {
                    type: 'story',
                    data: null,
                    path: filePath
                };
            }
            if (normalizedPath.includes('/units/')) {
                return {
                    type: 'unit',
                    data: null,
                    path: filePath
                };
            }
            return {
                type: 'intent',
                data: null,
                path: filePath
            };
        }

        if (normalizedPath.includes('/standards/')) {
            return {
                type: 'standard',
                data: null,
                path: filePath
            };
        }

        return null;
    }
}

/**
 * Create an AIDLC parser instance.
 */
export function createAidlcParser(): AidlcParser {
    return new AidlcParser();
}

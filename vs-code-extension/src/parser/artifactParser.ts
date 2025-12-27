/**
 * Artifact parsing functions.
 * Scans memory-bank directory and parses all AI-DLC artifacts.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { MemoryBankSchema } from './memoryBankSchema';
import { parseFrontmatter, normalizeStatus } from './frontmatterParser';
import { detectProject } from './projectDetection';
import {
    Intent,
    Unit,
    Story,
    Bolt,
    Stage,
    Standard,
    MemoryBankModel,
    ArtifactStatus,
    BOLT_TYPE_STAGES,
    stageMatches
} from './types';
import { getBoltTypeStages, clearBoltTypeCache } from './boltTypeParser';

/**
 * Reads file content safely, returning null on error.
 */
async function readFileSafe(filePath: string): Promise<string | null> {
    try {
        return await fs.readFile(filePath, 'utf-8');
    } catch {
        return null;
    }
}

/**
 * Parses an ISO 8601 timestamp string into a Date.
 * Returns undefined for null, invalid, or malformed timestamps.
 */
function parseTimestamp(value: string | null | undefined): Date | undefined {
    if (!value || value === 'null') {
        return undefined;
    }

    try {
        const date = new Date(value);
        // Check for invalid date
        if (isNaN(date.getTime())) {
            return undefined;
        }
        return date;
    } catch {
        return undefined;
    }
}

/**
 * Lists directories in a path, returning empty array on error.
 */
async function listDirectories(dirPath: string): Promise<string[]> {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        return entries
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);
    } catch {
        return [];
    }
}

/**
 * Lists markdown files in a path, returning empty array on error.
 */
async function listMarkdownFiles(dirPath: string): Promise<string[]> {
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        return entries
            .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
            .map(entry => entry.name);
    } catch {
        return [];
    }
}

/**
 * Extracts intent number and name from folder name.
 * Format: "NNN-intent-name" -> { number: "NNN", name: "intent-name" }
 */
function parseIntentFolderName(folderName: string): { number: string; name: string } | null {
    const match = folderName.match(/^(\d{3})-(.+)$/);
    if (!match) {
        return null;
    }
    return { number: match[1], name: match[2] };
}

/**
 * Extracts story ID and title from filename.
 * Format: "NNN-story-title.md" -> { id: "NNN", title: "story-title" }
 */
function parseStoryFilename(filename: string): { id: string; title: string } | null {
    const match = filename.match(/^(\d{3})-(.+)\.md$/);
    if (!match) {
        return null;
    }
    return { id: match[1], title: match[2] };
}

/**
 * Calculates aggregate status from child items.
 */
function calculateAggregateStatus(statuses: ArtifactStatus[]): ArtifactStatus {
    if (statuses.length === 0) {
        return ArtifactStatus.Unknown;
    }

    // If any are in-progress, the aggregate is in-progress
    if (statuses.includes(ArtifactStatus.InProgress)) {
        return ArtifactStatus.InProgress;
    }

    // If all are complete, the aggregate is complete
    if (statuses.every(s => s === ArtifactStatus.Complete)) {
        return ArtifactStatus.Complete;
    }

    // If all are draft/unknown, the aggregate is draft
    if (statuses.every(s => s === ArtifactStatus.Draft || s === ArtifactStatus.Unknown)) {
        return ArtifactStatus.Draft;
    }

    // Mixed states - likely in-progress
    return ArtifactStatus.InProgress;
}

/**
 * Parses a single story file.
 */
export async function parseStory(
    storyPath: string,
    unitName: string,
    intentName: string
): Promise<Story | null> {
    const filename = path.basename(storyPath);
    const parsed = parseStoryFilename(filename);

    if (!parsed) {
        return null;
    }

    const content = await readFileSafe(storyPath);
    const frontmatter = content ? parseFrontmatter(content) : null;

    return {
        id: parsed.id,
        title: parsed.title,
        unitName,
        intentName,
        path: storyPath,
        status: frontmatter ? normalizeStatus(frontmatter.status as string) : ArtifactStatus.Unknown,
        priority: (frontmatter?.priority as string) || 'should'
    };
}

/**
 * Parses a single unit folder.
 */
export async function parseUnit(
    unitPath: string,
    intentName: string
): Promise<Unit> {
    const unitName = path.basename(unitPath);
    const storiesPath = path.join(unitPath, 'stories');

    // Parse stories
    const storyFiles = await listMarkdownFiles(storiesPath);
    const stories: Story[] = [];

    for (const storyFile of storyFiles) {
        const story = await parseStory(
            path.join(storiesPath, storyFile),
            unitName,
            intentName
        );
        if (story) {
            stories.push(story);
        }
    }

    // Sort stories by ID
    stories.sort((a, b) => a.id.localeCompare(b.id));

    // Try to read unit-brief.md for status
    const unitBriefPath = path.join(unitPath, 'unit-brief.md');
    const unitBriefContent = await readFileSafe(unitBriefPath);
    const unitFrontmatter = unitBriefContent ? parseFrontmatter(unitBriefContent) : null;

    // Get raw status from frontmatter (for display/filtering)
    const rawStatus = unitFrontmatter?.status as string | undefined;

    // Calculate normalized status from stories if not in frontmatter
    const status = rawStatus
        ? normalizeStatus(rawStatus)
        : calculateAggregateStatus(stories.map(s => s.status));

    return {
        name: unitName,
        intentName,
        path: unitPath,
        status,
        rawStatus,
        stories
    };
}

/**
 * Parses a single intent folder.
 */
export async function parseIntent(intentPath: string): Promise<Intent | null> {
    const folderName = path.basename(intentPath);
    const parsed = parseIntentFolderName(folderName);

    if (!parsed) {
        return null;
    }

    const unitsPath = path.join(intentPath, 'units');
    const unitFolders = await listDirectories(unitsPath);

    // Parse units
    const units: Unit[] = [];
    for (const unitFolder of unitFolders) {
        const unit = await parseUnit(
            path.join(unitsPath, unitFolder),
            folderName
        );
        units.push(unit);
    }

    // Sort units alphabetically
    units.sort((a, b) => a.name.localeCompare(b.name));

    // Try to read requirements.md for status
    const requirementsPath = path.join(intentPath, 'requirements.md');
    const requirementsContent = await readFileSafe(requirementsPath);
    const requirementsFrontmatter = requirementsContent ? parseFrontmatter(requirementsContent) : null;

    // Calculate status from units if not in frontmatter
    const status = requirementsFrontmatter?.status
        ? normalizeStatus(requirementsFrontmatter.status as string)
        : calculateAggregateStatus(units.map(u => u.status));

    return {
        name: parsed.name,
        number: parsed.number,
        path: intentPath,
        status,
        units
    };
}

/**
 * Parses a single bolt folder.
 * @param boltPath - Path to the bolt folder
 * @param workspacePath - Path to the workspace root (for loading bolt type definitions)
 */
export async function parseBolt(boltPath: string, workspacePath?: string): Promise<Bolt | null> {
    const boltId = path.basename(boltPath);
    const boltFilePath = path.join(boltPath, 'bolt.md');

    const content = await readFileSafe(boltFilePath);
    if (!content) {
        return null;
    }

    const frontmatter = parseFrontmatter(content);
    if (!frontmatter) {
        return null;
    }

    const boltType = (frontmatter.type as string) || 'simple-construction-bolt';
    const currentStage = (frontmatter.current_stage as string) || null;
    const stagesCompleted = Array.isArray(frontmatter.stages_completed)
        ? (frontmatter.stages_completed as Array<{ name: string } | string>)
            .map(s => typeof s === 'string' ? s : s?.name)
            .filter((s): s is string => typeof s === 'string' && s.length > 0)
        : [];

    // Get stage names dynamically from bolt type definition, with fallback
    let stageNames: string[];
    if (workspacePath) {
        stageNames = await getBoltTypeStages(workspacePath, boltType);
    } else {
        // Fallback to hardcoded defaults
        stageNames = BOLT_TYPE_STAGES[boltType] || BOLT_TYPE_STAGES['simple-construction-bolt'];
    }

    // Parse stages_completed with timestamp data
    const stagesCompletedRaw = Array.isArray(frontmatter.stages_completed)
        ? frontmatter.stages_completed as Array<{ name: string; completed?: string; artifact?: string } | string>
        : [];

    // Create a map of completed stage data for timestamp lookup
    const stageCompletedMap = new Map<string, { completedAt?: Date; artifact?: string }>();
    for (const s of stagesCompletedRaw) {
        if (typeof s === 'string' && s.length > 0) {
            stageCompletedMap.set(s.toLowerCase(), {});
        } else if (typeof s === 'object' && s !== null && typeof s.name === 'string' && s.name.length > 0) {
            stageCompletedMap.set(s.name.toLowerCase(), {
                completedAt: s.completed ? parseTimestamp(s.completed) : undefined,
                artifact: s.artifact
            });
        }
    }

    // Build stages array with status using flexible matching
    const stages: Stage[] = stageNames.map((name, index) => {
        let stageStatus: ArtifactStatus;

        // Use flexible matching to handle stage name variations
        const isCompleted = stagesCompleted.some(completed => stageMatches(name, completed));
        const isCurrentStage = currentStage ? stageMatches(name, currentStage) : false;

        if (isCompleted) {
            stageStatus = ArtifactStatus.Complete;
        } else if (isCurrentStage) {
            stageStatus = ArtifactStatus.InProgress;
        } else {
            stageStatus = ArtifactStatus.Draft;
        }

        // Get timestamp data from map
        const completedData = stageCompletedMap.get(name.toLowerCase());

        return {
            name,
            order: index + 1,
            status: stageStatus,
            completedAt: completedData?.completedAt,
            artifact: completedData?.artifact
        };
    });

    // Parse dependency fields
    const requiresBolts = Array.isArray(frontmatter.requires_bolts)
        ? (frontmatter.requires_bolts as string[])
        : [];
    const enablesBolts = Array.isArray(frontmatter.enables_bolts)
        ? (frontmatter.enables_bolts as string[])
        : [];

    // Parse timestamp fields
    const createdAt = frontmatter.created ? parseTimestamp(frontmatter.created as string) : undefined;
    const startedAt = frontmatter.started ? parseTimestamp(frontmatter.started as string) : undefined;
    const completedAt = frontmatter.completed ? parseTimestamp(frontmatter.completed as string) : undefined;

    return {
        id: boltId,
        unit: (frontmatter.unit as string) || '',
        intent: (frontmatter.intent as string) || '',
        type: boltType,
        status: normalizeStatus(frontmatter.status as string),
        currentStage,
        stages,
        stagesCompleted,
        stories: Array.isArray(frontmatter.stories) ? (frontmatter.stories as string[]) : [],
        path: boltPath,
        filePath: boltFilePath,
        // Dependency fields (computed later by computeBoltDependencies)
        requiresBolts,
        enablesBolts,
        isBlocked: false, // Will be computed
        blockedBy: [],    // Will be computed
        unblocksCount: 0, // Will be computed
        // Timestamp fields
        createdAt,
        startedAt,
        completedAt
    };
}

/**
 * Parses a single standard file.
 */
export async function parseStandard(standardPath: string): Promise<Standard> {
    const filename = path.basename(standardPath, '.md');
    return {
        name: filename,
        path: standardPath
    };
}

/**
 * Scans the entire memory-bank and returns a complete model.
 */
export async function scanMemoryBank(workspacePath: string): Promise<MemoryBankModel> {
    const schema = new MemoryBankSchema(workspacePath);
    const isProject = await detectProject(workspacePath);

    if (!isProject) {
        return {
            intents: [],
            bolts: [],
            standards: [],
            isProject: false
        };
    }

    // Parse intents
    const intentsPath = schema.getIntentsPath();
    const intentFolders = await listDirectories(intentsPath);
    const intents: Intent[] = [];

    for (const intentFolder of intentFolders) {
        try {
            const intent = await parseIntent(path.join(intentsPath, intentFolder));
            if (intent) {
                intents.push(intent);
            }
        } catch (error) {
            console.error(`[SpecsMD] Error parsing intent: ${intentFolder}`, error);
        }
    }

    // Sort intents by number
    intents.sort((a, b) => a.number.localeCompare(b.number));

    // Parse bolts (pass workspacePath for dynamic bolt type loading)
    const boltsPath = schema.getBoltsPath();
    const boltFolders = await listDirectories(boltsPath);
    const bolts: Bolt[] = [];

    // Clear bolt type cache on each scan to pick up any definition changes
    clearBoltTypeCache();

    for (const boltFolder of boltFolders) {
        try {
            const bolt = await parseBolt(path.join(boltsPath, boltFolder), workspacePath);
            if (bolt) {
                bolts.push(bolt);
            }
        } catch (error) {
            console.error(`[SpecsMD] Error parsing bolt: ${boltFolder}`, error);
        }
    }

    // Sort bolts: in-progress first, then by ID
    bolts.sort((a, b) => {
        if (a.status === ArtifactStatus.InProgress && b.status !== ArtifactStatus.InProgress) {
            return -1;
        }
        if (b.status === ArtifactStatus.InProgress && a.status !== ArtifactStatus.InProgress) {
            return 1;
        }
        return a.id.localeCompare(b.id);
    });

    // Parse standards
    const standardsPath = schema.getStandardsPath();
    const standardFiles = await listMarkdownFiles(standardsPath);
    const standards: Standard[] = [];

    for (const standardFile of standardFiles) {
        const standard = await parseStandard(path.join(standardsPath, standardFile));
        standards.push(standard);
    }

    // Sort standards alphabetically
    standards.sort((a, b) => a.name.localeCompare(b.name));

    return {
        intents,
        bolts,
        standards,
        isProject: true
    };
}

/**
 * Frontmatter parsing utilities.
 * Extracts YAML frontmatter from markdown files and normalizes status values.
 */

import * as yaml from 'js-yaml';
import { ArtifactStatus, FrontmatterData } from './types';

/**
 * Regex to match YAML frontmatter at the start of a file.
 * Matches content between --- delimiters.
 */
const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---/;

/**
 * Parses YAML frontmatter from a markdown file's content.
 *
 * @param content - The full file content
 * @returns Parsed frontmatter object, or null if no valid frontmatter found
 *
 * @example
 * ```typescript
 * const content = `---
 * status: in-progress
 * priority: must
 * ---
 * # My Document`;
 *
 * const fm = parseFrontmatter(content);
 * // { status: 'in-progress', priority: 'must' }
 * ```
 */
export function parseFrontmatter(content: string): FrontmatterData | null {
    if (!content || typeof content !== 'string') {
        return null;
    }

    const match = content.match(FRONTMATTER_REGEX);
    if (!match || !match[1]) {
        return null;
    }

    try {
        const parsed = yaml.load(match[1]);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as FrontmatterData;
        }
        return null;
    } catch (error) {
        // Log warning but don't throw - graceful degradation
        console.warn('Failed to parse YAML frontmatter:', error);
        return null;
    }
}

/**
 * Normalizes a raw status string to ArtifactStatus enum.
 * Handles common variations in status naming.
 *
 * @param rawStatus - The raw status string from frontmatter
 * @returns Normalized ArtifactStatus
 *
 * @example
 * ```typescript
 * normalizeStatus('in-progress'); // ArtifactStatus.InProgress
 * normalizeStatus('completed');   // ArtifactStatus.Complete
 * normalizeStatus('pending');     // ArtifactStatus.Draft
 * normalizeStatus('unknown');     // ArtifactStatus.Unknown
 * ```
 */
export function normalizeStatus(rawStatus: string | undefined): ArtifactStatus {
    if (!rawStatus || typeof rawStatus !== 'string') {
        return ArtifactStatus.Unknown;
    }

    const normalized = rawStatus.toLowerCase().trim();

    // Draft variations
    if (['draft', 'pending', 'planned', 'todo', 'new'].includes(normalized)) {
        return ArtifactStatus.Draft;
    }

    // In-progress variations
    if ([
        'in-progress',
        'in_progress',
        'inprogress',
        'in progress',
        'active',
        'started',
        'wip',
        'working',
        'ready',
        'construction'
    ].includes(normalized)) {
        return ArtifactStatus.InProgress;
    }

    // Complete variations
    if ([
        'complete',
        'completed',
        'done',
        'finished',
        'closed',
        'resolved'
    ].includes(normalized)) {
        return ArtifactStatus.Complete;
    }

    return ArtifactStatus.Unknown;
}

/**
 * Extracts a specific field from frontmatter content.
 *
 * @param content - The full file content
 * @param field - The field name to extract
 * @returns The field value, or undefined if not found
 */
export function extractFrontmatterField<T = unknown>(
    content: string,
    field: string
): T | undefined {
    const frontmatter = parseFrontmatter(content);
    if (!frontmatter) {
        return undefined;
    }
    return frontmatter[field] as T | undefined;
}

/**
 * Extracts the status from frontmatter and normalizes it.
 *
 * @param content - The full file content
 * @returns Normalized ArtifactStatus
 */
export function extractStatus(content: string): ArtifactStatus {
    const frontmatter = parseFrontmatter(content);
    if (!frontmatter) {
        return ArtifactStatus.Unknown;
    }
    return normalizeStatus(frontmatter.status as string | undefined);
}

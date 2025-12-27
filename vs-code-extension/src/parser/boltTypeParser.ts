/**
 * Parses bolt type definition files to extract stage information dynamically.
 * Bolt type definitions are located at:
 * .specsmd/aidlc/templates/construction/bolt-types/{bolt_type}.md
 */

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Parsed stage information from a bolt type definition.
 */
export interface BoltTypeStage {
    name: string;
    order: number;
    optional: boolean;
}

/**
 * Parsed bolt type definition.
 */
export interface BoltTypeDefinition {
    type: string;
    name: string;
    stages: BoltTypeStage[];
}

/**
 * Cache for bolt type definitions to avoid repeated file reads.
 */
const boltTypeCache: Map<string, BoltTypeDefinition | null> = new Map();

/**
 * Clears the bolt type cache.
 * Useful when files change.
 */
export function clearBoltTypeCache(): void {
    boltTypeCache.clear();
}

/**
 * Gets the path to a bolt type definition file.
 */
function getBoltTypePath(workspacePath: string, boltType: string): string {
    return path.join(
        workspacePath,
        '.specsmd',
        'aidlc',
        'templates',
        'construction',
        'bolt-types',
        `${boltType}.md`
    );
}

/**
 * Parses stage names from bolt type definition content.
 *
 * Looks for patterns like:
 * - "### Stage 1: Plan" -> "plan"
 * - "### Stage 2: Implement" -> "implement"
 * - "### Stage 3: ADR Analysis (Optional)" -> "adr" (optional: true)
 */
function parseStagesFromContent(content: string): BoltTypeStage[] {
    const stages: BoltTypeStage[] = [];

    // Match stage headers: ### Stage N: Name or ### Stage N: Name (Optional)
    const stageRegex = /###\s+Stage\s+(\d+):\s+([^\n(]+)(?:\s*\(([^)]+)\))?/gi;
    let match;

    while ((match = stageRegex.exec(content)) !== null) {
        const order = parseInt(match[1], 10);
        const rawName = match[2].trim();
        const modifier = match[3]?.toLowerCase() || '';

        // Normalize stage name to lowercase slug
        // "Domain Model" -> "model"
        // "Technical Design" -> "design"
        // "ADR Analysis" -> "adr"
        // "Plan" -> "plan"
        const name = normalizeStageNameToSlug(rawName);

        stages.push({
            name,
            order,
            optional: modifier.includes('optional')
        });
    }

    // Sort by order
    stages.sort((a, b) => a.order - b.order);

    return stages;
}

/**
 * Normalizes a stage name to a slug form.
 * Examples:
 * - "Domain Model" -> "model"
 * - "Technical Design" -> "design"
 * - "ADR Analysis" -> "adr"
 * - "Implement" -> "implement"
 */
function normalizeStageNameToSlug(name: string): string {
    const normalized = name.toLowerCase().trim();

    // Handle specific known mappings
    const mappings: Record<string, string> = {
        'domain model': 'model',
        'technical design': 'design',
        'adr analysis': 'adr',
        'explore': 'explore',
        'document': 'document',
        'plan': 'plan',
        'implement': 'implement',
        'test': 'test'
    };

    if (mappings[normalized]) {
        return mappings[normalized];
    }

    // Default: take the last word and lowercase it
    const words = normalized.split(/\s+/);
    return words[words.length - 1];
}

/**
 * Loads and parses a bolt type definition file.
 * Returns null if the file doesn't exist or can't be parsed.
 */
export async function loadBoltTypeDefinition(
    workspacePath: string,
    boltType: string
): Promise<BoltTypeDefinition | null> {
    // Check cache first
    const cacheKey = `${workspacePath}:${boltType}`;
    if (boltTypeCache.has(cacheKey)) {
        return boltTypeCache.get(cacheKey) || null;
    }

    try {
        const filePath = getBoltTypePath(workspacePath, boltType);
        const content = await fs.readFile(filePath, 'utf-8');

        const stages = parseStagesFromContent(content);

        if (stages.length === 0) {
            // Couldn't parse stages, cache null
            boltTypeCache.set(cacheKey, null);
            return null;
        }

        const definition: BoltTypeDefinition = {
            type: boltType,
            name: boltType.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            stages
        };

        boltTypeCache.set(cacheKey, definition);
        return definition;
    } catch {
        // File doesn't exist or can't be read
        boltTypeCache.set(cacheKey, null);
        return null;
    }
}

/**
 * Gets stage names for a bolt type.
 * Falls back to hardcoded defaults if definition can't be loaded.
 */
export async function getBoltTypeStages(
    workspacePath: string,
    boltType: string
): Promise<string[]> {
    const definition = await loadBoltTypeDefinition(workspacePath, boltType);

    if (definition) {
        return definition.stages.map(s => s.name);
    }

    // Fallback to hardcoded defaults
    const defaults: Record<string, string[]> = {
        'simple-construction-bolt': ['plan', 'implement', 'test'],
        'ddd-construction-bolt': ['model', 'design', 'adr', 'implement', 'test'],
        'spike-bolt': ['explore', 'document']
    };

    return defaults[boltType] || defaults['simple-construction-bolt'];
}

#!/usr/bin/env node

/**
 * specsmd Bolt Completion Script
 *
 * Called from bolt-start.md skill when a bolt completes.
 * Updates bolt status, stories, and cascades to unit/intent status.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * EXECUTION FLOW
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This script performs a deterministic cascade of status updates when a bolt
 * completes. It replaces manual multi-step LLM operations that were prone
 * to being skipped due to "Lost in the Middle" effect.
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │                              STATUS CASCADE                               │
 * │                                                                          │
 * │  Bolt Complete ──→ Stories Complete ──→ Unit Complete ──→ Intent Complete │
 * │        │                  │                   │                     │        │
 * │        ▼                  ▼                   ▼                     ▼        │
 * │   bolt.md          story/*.md       unit-brief.md      requirements.md   │
 * │   status:          status:           status:            status:          │
 * │   complete         complete          complete           complete         │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │                            STEP-BY-STEP                                  │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Step 1: READ BOLT FILE
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │ Input:  bolt-id (e.g., "016-analytics-tracker" or "016")           │
 *   │ Output: Bolt object with id, unit, intent, stories array           │
 *   │                                                                  │
 *   │ - Scans memory-bank/bolts/ for matching directory                 │
 *   │ - Reads bolt.md frontmatter                                       │
 *   │ - Extracts: intent, unit, stories, current_status                │
 *   └─────────────────────────────────────────────────────────────────────┘
 *
 * Step 2: UPDATE BOLT STATUS
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │ Action: Update bolt.md frontmatter                                │
 *   │                                                                  │
 *   │   status: in-progress → complete                                  │
 *   │   completed: {ISO-8601-timestamp}                                 │
 *   │   current_stage: null                                            │
 *   │   stages_completed: [adds final stage if not present]            │
 *   └─────────────────────────────────────────────────────────────────────┘
 *
 * Step 3: UPDATE ALL STORIES
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │ For each story in bolt.stories array:                             │
 *   │                                                                  │
 *   │ 1. Find story file (handles numeric prefixes, fuzzy matching)    │
 *   │ 2. Read story frontmatter                                         │
 *   │ 3. If not complete:                                              │
 *   │      status: {current} → complete                                 │
 *   │      implemented: false → true                                    │
 *   │                                                                  │
 *   │ Story search strategy:                                           │
 *   │ - Direct path: {intent}/units/{unit}/stories/{story}.md          │
 *   │ - With prefix: {intent}/units/*-{unit}/stories/{story}.md        │
 *   │ - Fuzzy match: filename starts with {story}-                    │
 *   └─────────────────────────────────────────────────────────────────────┘
 *
 * Step 4: UPDATE UNIT STATUS
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │ Action: Check ALL bolts for this unit, update if all complete     │
 *   │                                                                  │
 *   │ 1. Scan memory-bank/bolts/ for bolts with matching unit         │
 *   │ 2. Check if ALL bolts have status: complete                     │
 *   │ 3. If yes, update unit-brief.md:                                │
 *   │      status: {current} → complete                                 │
 *   │                                                                  │
 *   │ Note: Unit path = {intent}/units/{unit}/unit-brief.md            │
 *   │       Handles numeric prefixes (e.g., 001-analytics-tracker)     │
 *   └─────────────────────────────────────────────────────────────────────┘
 *
 * Step 5: UPDATE INTENT STATUS
 *   ┌─────────────────────────────────────────────────────────────────────┐
 *   │ Action: Check ALL units for this intent, update if all complete  │
 *   │                                                                  │
 *   │ 1. Scan {intent}/units/ for all unit directories                │
 *   │ 2. Read each unit-brief.md status                               │
 *   │ 3. If ALL units have status: complete:                           │
 *   │      Update requirements.md:                                      │
 *   │      status: {current} → complete                                 │
 *   │                                                                  │
 *   │ Note: Intent path = {intent}/requirements.md                     │
 *   └─────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │                          FILE STRUCTURE                                │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 *   memory-bank/
 *   ├── bolts/
 *   │   └── {BBB}-{unit}/
 *   │       └── bolt.md              ← Updated: status, completed
 *   ├── intents/
 *   │   └── {intent}/
 *   │       ├── requirements.md       ← Updated: status (if all units complete)
 *   │       └── units/
 *   │           └── {unit}/
 *   │               ├── unit-brief.md  ← Updated: status (if all bolts complete)
 *   │               └── stories/
 *   │                   ├── 001-{story}.md  ← Updated: status, implemented
 *   │                   └── ...
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │                              USAGE                                       │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 *   From agent skill (bolt-start.md Step 10):
 *
 *     node .specsmd/aidlc/scripts/bolt-complete.js 016-analytics-tracker
 *
 *   With optional stage name:
 *
 *     node .specsmd/aidlc/scripts/bolt-complete.js 016-analytics-tracker --last-stage test
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

// Theme colors for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    dim: '\x1b[90m',
    bright: '\x1b[1m'
};

// Memory bank paths (relative to project root)
const MEMORY_BANK_DIR = 'memory-bank';
const BOLTS_DIR = path.join(MEMORY_BANK_DIR, 'bolts');
const INTENTS_DIR = path.join(MEMORY_BANK_DIR, 'intents');

/**
 * Extract frontmatter from a markdown file
 */
function extractFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]+?)\n---/);
    if (!match) return null;

    try {
        return yaml.load(match[1]);
    } catch (error) {
        console.error(`${colors.red}Error parsing YAML frontmatter:${colors.reset}`, error.message);
        return null;
    }
}

/**
 * Update frontmatter in a markdown file
 */
function updateFrontmatter(content, newFrontmatter) {
    const match = content.match(/^---\n([\s\S]+?)\n---/);
    if (!match) return null;

    const newYaml = yaml.dump(newFrontmatter, {
        lineWidth: -1,
        noRefs: true,
        quotingType: '"',
        forceQuotes: false,
        sortKeys: false
    }).trim();

    return `---\n${newYaml}\n---${content.slice(match[0].length)}`;
}

/**
 * Format timestamp as ISO 8601
 * Format: YYYY-MM-DDTHH:MM:SSZ (no milliseconds, per memory-bank.yaml convention)
 */
function getTimestamp() {
    const date = new Date();
    // Format to ISO 8601 without milliseconds
    return date.toISOString().replace(/\.\d+Z$/, 'Z');
}

/**
 * Read a bolt file and extract metadata
 */
async function readBolt(boltId) {
    // Support both formats: "016-analytics-tracker" or "016"
    const boltDirs = await fs.readdir(BOLTS_DIR).catch(() => []);
    const boltDir = boltId.includes('-')
        ? boltId
        : boltDirs.find(d => d.startsWith(boltId + '-'));

    if (!boltDir) {
        throw new Error(`Bolt not found: ${boltId}`);
    }

    const boltPath = path.join(BOLTS_DIR, boltDir, 'bolt.md');

    if (!await fs.pathExists(boltPath)) {
        throw new Error(`Bolt file not found: ${boltPath}`);
    }

    const content = await fs.readFile(boltPath, 'utf8');
    const frontmatter = extractFrontmatter(content);

    if (!frontmatter) {
        throw new Error(`Invalid bolt file (no frontmatter): ${boltPath}`);
    }

    return {
        id: frontmatter.id || boltDir.replace(/\/$/, ''),
        path: boltPath,
        dir: boltDir,
        content,
        frontmatter
    };
}

/**
 * Find a story file by ID
 * Tries multiple approaches to find the story file:
 * 1. Direct path with unit name
 * 2. Search all unit directories with prefix matching
 * 3. Fuzzy search by story ID pattern
 */
async function findStoryFile(intent, unit, storyId) {
    // Try with .md extension (direct path)
    let storyPath = path.join(INTENTS_DIR, intent, 'units', unit, 'stories', `${storyId}.md`);

    if (await fs.pathExists(storyPath)) {
        return storyPath;
    }

    // Try without extension if storyId already has it
    storyPath = path.join(INTENTS_DIR, intent, 'units', unit, 'stories', storyId);
    if (await fs.pathExists(storyPath)) {
        return storyPath;
    }

    // Try to find unit directory with prefix (e.g., unit=analytics-tracker could be 001-analytics-tracker)
    const intentUnitsDir = path.join(INTENTS_DIR, intent, 'units');
    if (await fs.pathExists(intentUnitsDir)) {
        const unitDirs = await fs.readdir(intentUnitsDir).catch(() => []);

        for (const unitDir of unitDirs) {
            // Check if directory name ends with the unit name (handles numeric prefixes)
            if (unitDir === unit || unitDir.endsWith(`-${unit}`)) {
                storyPath = path.join(intentUnitsDir, unitDir, 'stories', `${storyId}.md`);
                if (await fs.pathExists(storyPath)) {
                    return storyPath;
                }

                // Also try fuzzy match - story ID might be embedded in filename
                const storiesDir = path.join(intentUnitsDir, unitDir, 'stories');
                if (await fs.pathExists(storiesDir)) {
                    const storyFiles = await fs.readdir(storiesDir).catch(() => []);

                    // Look for files that start with the story ID or contain it
                    for (const storyFile of storyFiles) {
                        const baseName = storyFile.replace('.md', '');
                        if (baseName === storyId || baseName.startsWith(`${storyId}-`)) {
                            return path.join(storiesDir, storyFile);
                        }
                    }
                }
            }
        }
    }

    return null;
}

/**
 * Update bolt file to complete status
 */
async function updateBoltStatus(bolt, lastStage) {
    const newFrontmatter = {
        ...bolt.frontmatter,
        status: 'complete',
        completed: getTimestamp(),
        current_stage: null
    };

    // Ensure stages_completed includes the final stage
    const stagesCompleted = bolt.frontmatter.stages_completed || [];
    if (lastStage && !stagesCompleted.find(s => s.name === lastStage)) {
        stagesCompleted.push({
            name: lastStage,
            completed: getTimestamp(),
            artifact: `completion-stage-${lastStage}.md`
        });
    }
    newFrontmatter.stages_completed = stagesCompleted;

    const newContent = updateFrontmatter(bolt.content, newFrontmatter);
    if (!newContent) {
        throw new Error('Failed to update bolt frontmatter');
    }

    await fs.writeFile(bolt.path, newContent, 'utf8');
    return newFrontmatter;
}

/**
 * Update all stories in the bolt to complete status
 */
async function updateStories(bolt) {
    const stories = bolt.frontmatter.stories || [];
    const intent = bolt.frontmatter.intent;
    const unit = bolt.frontmatter.unit;

    if (stories.length === 0) {
        return { updated: 0, skipped: 0, errors: 0 };
    }

    const results = { updated: 0, skipped: 0, errors: 0, details: [] };

    for (const storyId of stories) {
        const storyPath = await findStoryFile(intent, unit, storyId);

        if (!storyPath) {
            console.log(`  ${colors.red}✗${colors.reset} ${storyId} - ${colors.dim}File not found${colors.reset}`);
            results.errors++;
            results.details.push({ storyId, status: 'error', reason: 'File not found' });
            continue;
        }

        const content = await fs.readFile(storyPath, 'utf8');
        const frontmatter = extractFrontmatter(content);

        if (!frontmatter) {
            console.log(`  ${colors.red}✗${colors.reset} ${storyId} - ${colors.dim}Invalid frontmatter${colors.reset}`);
            results.errors++;
            results.details.push({ storyId, status: 'error', reason: 'Invalid frontmatter' });
            continue;
        }

        // Check if already complete
        if (frontmatter.status === 'complete' && frontmatter.implemented === true) {
            console.log(`  ${colors.dim}−${colors.reset} ${storyId} - ${colors.dim}Already complete${colors.reset}`);
            results.skipped++;
            results.details.push({ storyId, status: 'skipped', reason: 'Already complete' });
            continue;
        }

        // Update frontmatter
        const newFrontmatter = {
            ...frontmatter,
            status: 'complete',
            implemented: true
        };

        const newContent = updateFrontmatter(content, newFrontmatter);
        if (newContent) {
            await fs.writeFile(storyPath, newContent, 'utf8');
            const oldStatus = frontmatter.status || 'draft';
            console.log(`  ${colors.green}✓${colors.reset} ${storyId} - ${colors.dim}${oldStatus} → complete${colors.reset}`);
            results.updated++;
            results.details.push({ storyId, status: 'updated', from: oldStatus, to: 'complete' });
        } else {
            console.log(`  ${colors.red}✗${colors.reset} ${storyId} - ${colors.dim}Failed to update${colors.reset}`);
            results.errors++;
            results.details.push({ storyId, status: 'error', reason: 'Failed to update' });
        }
    }

    return results;
}

/**
 * Update unit status if all bolts are complete
 */
async function updateUnitStatus(bolt) {
    const unit = bolt.frontmatter.unit;
    const intent = bolt.frontmatter.intent;

    // Find all bolts for this unit
    const boltDirs = await fs.readdir(BOLTS_DIR).catch(() => []);
    const unitBolts = [];

    for (const boltDir of boltDirs) {
        const boltPath = path.join(BOLTS_DIR, boltDir, 'bolt.md');
        if (await fs.pathExists(boltPath)) {
            const content = await fs.readFile(boltPath, 'utf8');
            const frontmatter = extractFrontmatter(content);
            if (frontmatter && frontmatter.unit === unit) {
                unitBolts.push({
                    id: frontmatter.id || boltDir,
                    status: frontmatter.status
                });
            }
        }
    }

    const allComplete = unitBolts.every(b => b.status === 'complete');

    // Find unit brief
    const unitBriefPath = path.join(INTENTS_DIR, intent, 'units', unit, 'unit-brief.md');

    if (!await fs.pathExists(unitBriefPath)) {
        console.log(`\n${colors.dim}Unit brief not found, skipping unit status update${colors.reset}`);
        return { updated: false };
    }

    const unitBriefContent = await fs.readFile(unitBriefPath, 'utf8');
    const unitBriefFrontmatter = extractFrontmatter(unitBriefContent);

    if (!unitBriefFrontmatter) {
        console.log(`\n${colors.dim}Invalid unit brief frontmatter, skipping${colors.reset}`);
        return { updated: false };
    }

    const currentStatus = unitBriefFrontmatter.status || 'unknown';

    if (allComplete && currentStatus !== 'complete') {
        const newFrontmatter = {
            ...unitBriefFrontmatter,
            status: 'complete'
        };
        const newContent = updateFrontmatter(unitBriefContent, newFrontmatter);
        if (newContent) {
            await fs.writeFile(unitBriefPath, newContent, 'utf8');
            console.log(`\n${colors.green}✓${colors.reset} Unit status: ${currentStatus} → complete`);
            return { updated: true, from: currentStatus, to: 'complete' };
        }
    } else if (allComplete) {
        console.log(`\n${colors.dim}Unit status already complete${colors.reset}`);
    } else {
        const incompleteCount = unitBolts.filter(b => b.status !== 'complete').length;
        console.log(`\n${colors.dim}Unit has ${incompleteCount} incomplete bolt(s), status unchanged${colors.reset}`);
    }

    return { updated: false };
}

/**
 * Update intent status if all units are complete
 */
async function updateIntentStatus(bolt) {
    const intent = bolt.frontmatter.intent;

    // Find all units for this intent
    const intentPath = path.join(INTENTS_DIR, intent);
    const unitsDir = path.join(intentPath, 'units');

    if (!await fs.pathExists(unitsDir)) {
        console.log(`${colors.dim}No units directory found for intent${colors.reset}`);
        return { updated: false };
    }

    const unitDirs = await fs.readdir(unitsDir).catch(() => []);
    const allComplete = [];

    for (const unitDir of unitDirs) {
        const unitBriefPath = path.join(unitsDir, unitDir, 'unit-brief.md');
        if (await fs.pathExists(unitBriefPath)) {
            const content = await fs.readFile(unitBriefPath, 'utf8');
            const frontmatter = extractFrontmatter(content);
            if (frontmatter) {
                allComplete.push(frontmatter.status === 'complete');
            }
        }
    }

    const unitsAllComplete = allComplete.length > 0 && allComplete.every(Boolean);

    // Find requirements file
    const requirementsPath = path.join(intentPath, 'requirements.md');

    if (!await fs.pathExists(requirementsPath)) {
        console.log(`${colors.dim}Requirements file not found, skipping intent status update${colors.reset}`);
        return { updated: false };
    }

    const requirementsContent = await fs.readFile(requirementsPath, 'utf8');
    const requirementsFrontmatter = extractFrontmatter(requirementsContent);

    if (!requirementsFrontmatter) {
        console.log(`${colors.dim}Invalid requirements frontmatter, skipping${colors.reset}`);
        return { updated: false };
    }

    const currentStatus = requirementsFrontmatter.status || 'unknown';

    if (unitsAllComplete && currentStatus !== 'complete') {
        const newFrontmatter = {
            ...requirementsFrontmatter,
            status: 'complete'
        };
        const newContent = updateFrontmatter(requirementsContent, newFrontmatter);
        if (newContent) {
            await fs.writeFile(requirementsPath, newContent, 'utf8');
            console.log(`${colors.green}✓${colors.reset} Intent status: ${currentStatus} → complete`);
            return { updated: true, from: currentStatus, to: 'complete' };
        }
    } else if (unitsAllComplete) {
        console.log(`${colors.dim}Intent status already complete${colors.reset}`);
    } else {
        const incompleteCount = allComplete.filter(c => !c).length;
        console.log(`${colors.dim}Intent has ${incompleteCount} incomplete unit(s), status unchanged${colors.reset}`);
    }

    return { updated: false };
}

/**
 * Validate bolt status before allowing completion
 *
 * Pre-flight checks to ensure:
 * - Bolt is in "in-progress" status (can't complete already-complete or not-started bolts)
 * - Bolt has not already been completed
 */
function validateBoltStatus(bolt) {
    const status = bolt.frontmatter.status || 'unknown';

    // Cannot complete a bolt that's already complete
    if (status === 'complete') {
        return { valid: false, reason: 'Bolt is already complete' };
    }

    // Bolt should be in-progress before completing
    if (status !== 'in-progress') {
        return { valid: false, reason: `Bolt status is "${status}", expected "in-progress"` };
    }

    return { valid: true };
}

/**
 * Main: Mark bolt as complete with all dependent updates
 */
async function boltMarkComplete(boltId, lastStage) {
    console.log(`${colors.bright}${colors.blue}════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}Bolt Completion: ${boltId}${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}════════════════════════════════════════${colors.reset}\n`);

    try {
        // Step 1: Read bolt file
        const bolt = await readBolt(boltId);

        // Step 1.5: Validate bolt status before proceeding
        const validation = validateBoltStatus(bolt);
        if (!validation.valid) {
            console.error(`\n${colors.red}Error:${colors.reset} ${validation.reason}`);
            console.error(`${colors.dim}Use bolt-status command to check current state.${colors.reset}`);
            return 1;
        }

        console.log(`${colors.dim}Bolt: ${bolt.id}${colors.reset}`);
        console.log(`${colors.dim}Intent: ${bolt.frontmatter.intent}${colors.reset}`);
        console.log(`${colors.dim}Unit: ${bolt.frontmatter.unit}${colors.reset}`);
        console.log(`${colors.dim}Stories: ${(bolt.frontmatter.stories || []).length}${colors.reset}\n`);

        // Step 2: Update bolt file to complete status
        await updateBoltStatus(bolt, lastStage);
        console.log(`${colors.green}✓${colors.reset} Bolt status: ${bolt.frontmatter.status || 'in-progress'} → complete\n`);

        // Step 3: Update stories
        console.log(`${colors.bright}Updating stories:${colors.reset}`);
        const storyResults = await updateStories(bolt);
        console.log(`\n${colors.dim}Stories: ${colors.green}${storyResults.updated} updated${colors.reset}, ${colors.dim}${storyResults.skipped} skipped${colors.reset}${storyResults.errors > 0 ? `, ${colors.red}${storyResults.errors} errors${colors.reset}` : ''}\n`);

        // Step 4: Update unit status
        await updateUnitStatus(bolt);
        console.log();

        // Step 5: Update intent status
        await updateIntentStatus(bolt);
        console.log();

        // Final summary
        console.log(`${colors.bright}${colors.blue}════════════════════════════════════════${colors.reset}`);
        console.log(`${colors.bright}${colors.green}✓ Bolt Complete: ${boltId}${colors.reset}`);
        console.log(`${colors.bright}${colors.blue}════════════════════════════════════════${colors.reset}`);

        return storyResults.errors > 0 ? 1 : 0;

    } catch (error) {
        console.error(`\n${colors.red}Error:${colors.reset}`, error.message);
        return 1;
    }
}

// CLI entry point
const boltId = process.argv[2];
const lastStage = process.argv['--last-stage'] || null;

if (!boltId) {
    console.error(`${colors.red}Error:${colors.reset} Bolt ID required`);
    console.error(`${colors.dim}Usage: node bolt-complete.js <bolt-id> [--last-stage <stage-name>]${colors.reset}`);
    process.exit(1);
}

boltMarkComplete(boltId, lastStage)
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
        console.error(`${colors.red}Error:${colors.reset}`, error.message);
        process.exit(1);
    });

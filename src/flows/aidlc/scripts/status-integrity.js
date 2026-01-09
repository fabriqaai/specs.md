#!/usr/bin/env node

/**
 * specsmd Status Integrity Script
 *
 * Checks and fixes status inconsistencies across the artifact hierarchy.
 * Status must cascade correctly: Bolt complete → Stories complete → Unit complete → Intent complete
 *
 * Usage:
 *   node .specsmd/aidlc/scripts/status-integrity.js
 *   node .specsmd/aidlc/scripts/status-integrity.js --fix
 *
 * Cross-platform: Works on Linux, macOS, Windows via Node.js
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
const MAINTENANCE_LOG = path.join(MEMORY_BANK_DIR, 'maintenance-log.md');

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
async function readBolt(boltDir) {
    const boltPath = path.join(BOLTS_DIR, boltDir, 'bolt.md');

    if (!await fs.pathExists(boltPath)) {
        return null;
    }

    const content = await fs.readFile(boltPath, 'utf8');
    const frontmatter = extractFrontmatter(content);

    if (!frontmatter) {
        return null;
    }

    return {
        id: frontmatter.id || boltDir.replace(/\/$/, ''),
        dir: boltDir,
        path: boltPath,
        content,
        frontmatter
    };
}

/**
 * Find a story file by ID
 */
async function findStoryFile(intent, unit, storyId) {
    let storyPath = path.join(INTENTS_DIR, intent, 'units', unit, 'stories', `${storyId}.md`);

    if (await fs.pathExists(storyPath)) {
        return storyPath;
    }

    storyPath = path.join(INTENTS_DIR, intent, 'units', unit, 'stories', storyId);
    if (await fs.pathExists(storyPath)) {
        return storyPath;
    }

    return null;
}

/**
 * Check story status consistency
 */
async function checkStoryStatus(bolt) {
    const stories = bolt.frontmatter.stories || [];
    const intent = bolt.frontmatter.intent;
    const unit = bolt.frontmatter.unit;
    const boltComplete = bolt.frontmatter.status === 'complete';

    const inconsistencies = [];

    if (!boltComplete) {
        return inconsistencies; // Only check if bolt is complete
    }

    for (const storyId of stories) {
        const storyPath = await findStoryFile(intent, unit, storyId);

        if (!storyPath) {
            inconsistencies.push({
                type: 'story',
                path: `{intent}/${unit}/stories/${storyId}.md`,
                current: 'file_not_found',
                expected: 'complete',
                reason: `Bolt ${bolt.id} is complete but story file not found`
            });
            continue;
        }

        const content = await fs.readFile(storyPath, 'utf8');
        const frontmatter = extractFrontmatter(content);

        if (!frontmatter) {
            inconsistencies.push({
                type: 'story',
                path: storyPath,
                current: 'invalid_frontmatter',
                expected: 'complete',
                reason: `Bolt ${bolt.id} is complete but story has no frontmatter`
            });
            continue;
        }

        const status = frontmatter.status || 'draft';
        const implemented = frontmatter.implemented || false;

        if (status !== 'complete' || !implemented) {
            inconsistencies.push({
                type: 'story',
                path: storyPath,
                current: `${status}${implemented ? '' : ' (not implemented)'}`,
                expected: 'complete, implemented: true',
                reason: `Bolt ${bolt.id} is complete but story is not marked complete`,
                storyPath,
                content
            });
        }
    }

    return inconsistencies;
}

/**
 * Check unit status consistency
 */
async function checkUnitStatus(unit, intent) {
    const inconsistencies = [];
    const unitBriefPath = path.join(INTENTS_DIR, intent, 'units', unit, 'unit-brief.md');

    if (!await fs.pathExists(unitBriefPath)) {
        return [];
    }

    const unitBriefContent = await fs.readFile(unitBriefPath, 'utf8');
    const unitBriefFrontmatter = extractFrontmatter(unitBriefContent);

    if (!unitBriefFrontmatter) {
        return [];
    }

    const currentStatus = unitBriefFrontmatter.status || 'unknown';

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
                    status: frontmatter.status || 'planned'
                });
            }
        }
    }

    if (unitBolts.length === 0) {
        return []; // No bolts, can't determine expected status
    }

    // Determine expected status
    let expectedStatus;
    const allComplete = unitBolts.every(b => b.status === 'complete');
    const anyInProgress = unitBolts.some(b => b.status === 'in-progress');
    const allPlanned = unitBolts.every(b => b.status === 'planned');

    if (allComplete) {
        expectedStatus = 'complete';
    } else if (anyInProgress) {
        expectedStatus = 'in-progress';
    } else if (allPlanned) {
        expectedStatus = 'stories-defined';
    } else {
        expectedStatus = 'stories-defined';
    }

    if (currentStatus !== expectedStatus) {
        inconsistencies.push({
            type: 'unit',
            path: unitBriefPath,
            current: currentStatus,
            expected: expectedStatus,
            reason: `Unit has ${unitBolts.length} bolts (${unitBolts.filter(b => b.status === 'complete').length}/${unitBolts.length} complete)`,
            unitBriefContent
        });
    }

    return inconsistencies;
}

/**
 * Check intent status consistency
 */
async function checkIntentStatus(intent) {
    const inconsistencies = [];
    const requirementsPath = path.join(INTENTS_DIR, intent, 'requirements.md');

    if (!await fs.pathExists(requirementsPath)) {
        return [];
    }

    const requirementsContent = await fs.readFile(requirementsPath, 'utf8');
    const requirementsFrontmatter = extractFrontmatter(requirementsContent);

    if (!requirementsFrontmatter) {
        return [];
    }

    const currentStatus = requirementsFrontmatter.status || 'unknown';

    // Find all units for this intent
    const unitsDir = path.join(INTENTS_DIR, intent, 'units');
    if (!await fs.pathExists(unitsDir)) {
        return [];
    }

    const unitDirs = await fs.readdir(unitsDir).catch(() => []);
    const unitStatuses = [];

    for (const unitDir of unitDirs) {
        const unitBriefPath = path.join(unitsDir, unitDir, 'unit-brief.md');
        if (await fs.pathExists(unitBriefPath)) {
            const content = await fs.readFile(unitBriefPath, 'utf8');
            const frontmatter = extractFrontmatter(content);
            if (frontmatter) {
                unitStatuses.push({
                    unit: unitDir,
                    status: frontmatter.status || 'unknown'
                });
            }
        }
    }

    if (unitStatuses.length === 0) {
        return []; // No units, can't determine expected status
    }

    // Determine expected status
    let expectedStatus;
    const allComplete = unitStatuses.every(u => u.status === 'complete');
    const anyInProgress = unitStatuses.some(u => u.status === 'in-progress');

    if (allComplete) {
        expectedStatus = 'complete';
    } else if (anyInProgress) {
        expectedStatus = 'construction';
    } else {
        expectedStatus = 'units-defined';
    }

    if (currentStatus !== expectedStatus) {
        inconsistencies.push({
            type: 'intent',
            path: requirementsPath,
            current: currentStatus,
            expected: expectedStatus,
            reason: `Intent has ${unitStatuses.length} units (${unitStatuses.filter(u => u.status === 'complete').length}/${unitStatuses.length} complete)`,
            requirementsContent
        });
    }

    return inconsistencies;
}

/**
 * Fix a story status inconsistency
 */
async function fixStoryStatus(inconsistency) {
    const { storyPath, content } = inconsistency;

    if (!storyPath || !content) {
        return false;
    }

    const frontmatter = extractFrontmatter(content);
    if (!frontmatter) {
        return false;
    }

    const newFrontmatter = {
        ...frontmatter,
        status: 'complete',
        implemented: true
    };

    const newContent = updateFrontmatter(content, newFrontmatter);
    if (!newContent) {
        return false;
    }

    await fs.writeFile(storyPath, newContent, 'utf8');
    return true;
}

/**
 * Fix a unit status inconsistency
 */
async function fixUnitStatus(inconsistency) {
    const { path: unitBriefPath, unitBriefContent, expected } = inconsistency;

    if (!unitBriefPath || !unitBriefContent) {
        return false;
    }

    const frontmatter = extractFrontmatter(unitBriefContent);
    if (!frontmatter) {
        return false;
    }

    const newFrontmatter = {
        ...frontmatter,
        status: expected
    };

    const newContent = updateFrontmatter(unitBriefContent, newFrontmatter);
    if (!newContent) {
        return false;
    }

    await fs.writeFile(unitBriefPath, newContent, 'utf8');
    return true;
}

/**
 * Fix an intent status inconsistency
 */
async function fixIntentStatus(inconsistency) {
    const { path: requirementsPath, requirementsContent, expected } = inconsistency;

    if (!requirementsPath || !requirementsContent) {
        return false;
    }

    const frontmatter = extractFrontmatter(requirementsContent);
    if (!frontmatter) {
        return false;
    }

    const newFrontmatter = {
        ...frontmatter,
        status: expected
    };

    const newContent = updateFrontmatter(requirementsContent, newFrontmatter);
    if (!newContent) {
        return false;
    }

    await fs.writeFile(requirementsPath, newContent, 'utf8');
    return true;
}

/**
 * Log fixes to maintenance log
 */
async function logToMaintenanceLog(fixedItems) {
    if (fixedItems.length === 0) {
        return;
    }

    const timestamp = new Date().toISOString();

    let logContent = '';
    if (await fs.pathExists(MAINTENANCE_LOG)) {
        logContent = await fs.readFile(MAINTENANCE_LOG, 'utf8');
    }

    const logEntry = `
## ${timestamp} - Status Sync

**Triggered by**: status-integrity script

| Artifact | Old Status | New Status | Reason |
|----------|------------|------------|--------|
${fixedItems.map(item => {
    const shortPath = item.path.replace(/^memory-bank\//, '');
    return `| ${shortPath} | ${item.current} | ${item.expected} | ${item.reason} |`;
}).join('\n')}

---
`;

    await fs.writeFile(MAINTENANCE_LOG, logContent + logEntry, 'utf8');
}

/**
 * Main: Check and fix status inconsistencies
 */
async function statusIntegrity(fix = false) {
    console.log(`${colors.bright}${colors.blue}════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}Status Integrity Check${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}════════════════════════════════════════${colors.reset}\n`);

    const inconsistencies = [];
    const bolts = [];
    const intents = [];

    // Step 1: Scan all bolts
    if (await fs.pathExists(BOLTS_DIR)) {
        const boltDirs = await fs.readdir(BOLTS_DIR).catch(() => []);

        for (const boltDir of boltDirs) {
            const bolt = await readBolt(boltDir);
            if (bolt) {
                bolts.push(bolt);

                // Track unique intents
                if (bolt.frontmatter.intent && !intents.includes(bolt.frontmatter.intent)) {
                    intents.push(bolt.frontmatter.intent);
                }
            }
        }
    }

    // Step 2: Check story status
    console.log(`${colors.dim}[1/3] Checking story status...${colors.reset}`);
    for (const bolt of bolts) {
        const storyIssues = await checkStoryStatus(bolt);
        inconsistencies.push(...storyIssues);
    }

    // Step 3: Check unit status
    console.log(`${colors.dim}[2/3] Checking unit status...${colors.reset}`);
    for (const intent of intents) {
        if (await fs.pathExists(path.join(INTENTS_DIR, intent, 'units'))) {
            const unitDirs = await fs.readdir(path.join(INTENTS_DIR, intent, 'units')).catch(() => []);

            for (const unit of unitDirs) {
                const unitIssues = await checkUnitStatus(unit, intent);
                inconsistencies.push(...unitIssues);
            }
        }
    }

    // Step 4: Check intent status
    console.log(`${colors.dim}[3/3] Checking intent status...${colors.reset}`);
    for (const intent of intents) {
        const intentIssues = await checkIntentStatus(intent);
        inconsistencies.push(...intentIssues);
    }

    // Display results
    console.log();
    if (inconsistencies.length === 0) {
        console.log(`${colors.green}✓${colors.reset} All statuses are consistent!\n`);
    } else {
        console.log(`${colors.bright}${colors.yellow}⚠️ ${inconsistencies.length} inconsistencies found${colors.reset}\n`);

        console.log(`${colors.bright}Status Inconsistencies:${colors.reset}\n`);
        console.log('| Artifact | Current | Expected | Reason |');
        console.log('|----------|---------|----------|--------|');

        for (const issue of inconsistencies) {
            const shortPath = issue.path.replace(/^memory-bank\//, '').replace(/^.*\/intents\//, '');
            console.log(`| ${shortPath} | ${issue.current} | ${issue.expected} | ${issue.reason} |`);
        }

        console.log();

        if (fix) {
            console.log(`${colors.bright}Fixing inconsistencies...${colors.reset}\n`);

            const fixedItems = [];

            for (const issue of inconsistencies) {
                let fixed = false;

                if (issue.type === 'story') {
                    fixed = await fixStoryStatus(issue);
                } else if (issue.type === 'unit') {
                    fixed = await fixUnitStatus(issue);
                } else if (issue.type === 'intent') {
                    fixed = await fixIntentStatus(issue);
                }

                if (fixed) {
                    console.log(`  ${colors.green}✓${colors.reset} Fixed: ${issue.path.replace(/^memory-bank\//, '')}`);
                    fixedItems.push(issue);
                } else {
                    console.log(`  ${colors.red}✗${colors.reset} Failed: ${issue.path.replace(/^memory-bank\//, '')}`);
                }
            }

            if (fixedItems.length > 0) {
                await logToMaintenanceLog(fixedItems);
                console.log(`\n${colors.dim}Logged to: ${MAINTENANCE_LOG}${colors.reset}`);
            }

            console.log();
            console.log(`${colors.green}Fixed ${fixedItems.length} of ${inconsistencies.length} inconsistencies${colors.reset}\n`);
        } else {
            console.log(`${colors.dim}Run with --fix to automatically correct these issues.${colors.reset}\n`);
        }
    }

    // Summary
    console.log(`${colors.bright}${colors.blue}════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}Summary${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}════════════════════════════════════════${colors.reset}\n`);
    console.log(`Bolts scanned: ${bolts.length}`);
    console.log(`Intents scanned: ${intents.length}`);
    console.log(`Inconsistencies: ${colors.red}${inconsistencies.length}${colors.reset}\n`);

    return inconsistencies.length;
}

// CLI entry point
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix') || args.includes('-f');

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node status-integrity.js [options]

Options:
  --fix, -f    Automatically fix status inconsistencies
  --help, -h   Show this help message

Examples:
  node .specsmd/aidlc/scripts/status-integrity.js
  node .specsmd/aidlc/scripts/status-integrity.js --fix
`);
    process.exit(0);
}

statusIntegrity(shouldFix)
    .then(count => process.exit(count > 0 && !shouldFix ? 1 : 0))
    .catch(error => {
        console.error(`\n${colors.red}Error:${colors.reset}`, error.message);
        process.exit(1);
    });

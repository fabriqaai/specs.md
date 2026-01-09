#!/usr/bin/env node

/**
 * Artifact Validator for AI-DLC Memory Bank
 *
 * Validates structural consistency across all artifacts:
 * - Naming conventions (folder/file patterns)
 * - ID-filename consistency (frontmatter matches filenames)
 * - Cross-reference integrity (references point to existing files)
 * - Timestamp format (ISO 8601 without milliseconds)
 *
 * Usage:
 *   node .specsmd/aidlc/scripts/artifact-validator.js
 *   node .specsmd/aidlc/scripts/artifact-validator.js --json
 *   node .specsmd/aidlc/scripts/artifact-validator.js --fix
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

// Memory bank paths
const MEMORY_BANK_DIR = 'memory-bank';
const INTENTS_DIR = path.join(MEMORY_BANK_DIR, 'intents');
const BOLTS_DIR = path.join(MEMORY_BANK_DIR, 'bolts');

/**
 * Extract frontmatter from a markdown file
 */
function extractFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]+?)\n---/);
    if (!match) return null;
    try {
        return yaml.load(match[1]);
    } catch (error) {
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
 * Regex patterns for naming conventions
 */
const patterns = {
    intent: /^\d{3}-.+$/,           // {NNN}-{name}
    unit: /^\d{3}-.+$/,             // {UUU}-{name}
    story: /^\d{3}-.+$/,            // {SSS}-{title-slug}
    bolt: /^\d{3}-.+$/,             // {BBB}-{unit-name}
    timestamp: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/  // ISO 8601 without ms
};

class ArtifactValidator {
    constructor(memoryBankPath = 'memory-bank') {
        this.memoryBankPath = memoryBankPath;
        this.results = [];
        this.fixCount = 0;
    }

    /**
     * Add a validation result
     */
    addResult(result) {
        this.results.push(result);
    }

    /**
     * Add a fix count
     */
    addFix(count = 1) {
        this.fixCount += count;
    }

    /**
     * Test Suite 1: Naming Conventions
     */
    async validateNamingConventions() {
        console.log(`${colors.dim}[1/4] Validating naming conventions...${colors.reset}`);
        let issues = 0;

        // Check intent folders
        if (await fs.pathExists(INTENTS_DIR)) {
            const intentDirs = await fs.readdir(INTENTS_DIR);
            for (const dir of intentDirs) {
                if (!patterns.intent.test(dir)) {
                    this.addResult({
                        type: 'naming',
                        severity: 'error',
                        file: path.join(INTENTS_DIR, dir),
                        rule: 'intent.folder-pattern',
                        message: `Intent folder "${dir}" doesn't match {NNN}-{name} pattern`,
                        fixable: false
                    });
                    issues++;
                }
            }
        }

        // Check bolt folders
        if (await fs.pathExists(BOLTS_DIR)) {
            const boltDirs = await fs.readdir(BOLTS_DIR);
            for (const dir of boltDirs) {
                if (!patterns.bolt.test(dir)) {
                    this.addResult({
                        type: 'naming',
                        severity: 'error',
                        file: path.join(BOLTS_DIR, dir),
                        rule: 'bolt.folder-pattern',
                        message: `Bolt folder "${dir}" doesn't match {BBB}-{unit-name} pattern`,
                        fixable: false
                    });
                    issues++;
                }
            }
        }

        // Check unit folders and story files recursively
        if (await fs.pathExists(INTENTS_DIR)) {
            const intentDirs = await fs.readdir(INTENTS_DIR);
            for (const intentDir of intentDirs) {
                const unitsDir = path.join(INTENTS_DIR, intentDir, 'units');
                if (await fs.pathExists(unitsDir)) {
                    const unitDirs = await fs.readdir(unitsDir);
                    for (const unitDir of unitDirs) {
                        // Check unit folder pattern
                        if (!patterns.unit.test(unitDir)) {
                            this.addResult({
                                type: 'naming',
                                severity: 'error',
                                file: path.join(unitsDir, unitDir),
                                rule: 'unit.folder-pattern',
                                message: `Unit folder "${unitDir}" doesn't match {UUU}-{unit-name} pattern`,
                                fixable: false
                            });
                            issues++;
                        }

                        // Check story files
                        const storiesDir = path.join(unitsDir, unitDir, 'stories');
                        if (await fs.pathExists(storiesDir)) {
                            const storyFiles = await fs.readdir(storiesDir);
                            for (const storyFile of storyFiles) {
                                if (path.extname(storyFile) === '.md') {
                                    const basename = path.basename(storyFile, '.md');
                                    if (!patterns.story.test(basename)) {
                                        this.addResult({
                                            type: 'naming',
                                            severity: 'error',
                                            file: path.join(storiesDir, storyFile),
                                            rule: 'story.file-pattern',
                                            message: `Story file "${storyFile}" doesn't match {SSS}-{title-slug}.md pattern`,
                                            fixable: false
                                        });
                                        issues++;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return issues;
    }

    /**
     * Test Suite 2: ID-Filename Consistency
     */
    async validateIdFilenameConsistency() {
        console.log(`${colors.dim}[2/4] Validating ID-filename consistency...${colors.reset}`);
        let issues = 0;

        // Check story files: id should match filename
        if (await fs.pathExists(INTENTS_DIR)) {
            const intentDirs = await fs.readdir(INTENTS_DIR);
            for (const intentDir of intentDirs) {
                const unitsDir = path.join(INTENTS_DIR, intentDir, 'units');
                if (await fs.pathExists(unitsDir)) {
                    const unitDirs = await fs.readdir(unitsDir);
                    for (const unitDir of unitDirs) {
                        const storiesDir = path.join(unitsDir, unitDir, 'stories');
                        if (await fs.pathExists(storiesDir)) {
                            const storyFiles = (await fs.readdir(storiesDir)).filter(f => path.extname(f) === '.md');
                            for (const storyFile of storyFiles) {
                                const storyPath = path.join(storiesDir, storyFile);
                                const content = await fs.readFile(storyPath, 'utf8');
                                const frontmatter = extractFrontmatter(content);

                                if (frontmatter && frontmatter.id) {
                                    const expectedId = path.basename(storyFile, '.md');
                                    if (expectedId !== frontmatter.id) {
                                        this.addResult({
                                            type: 'consistency',
                                            severity: 'error',
                                            file: storyPath,
                                            rule: 'story.id-matches-filename',
                                            message: `Story id "${frontmatter.id}" doesn't match filename "${expectedId}.md"`,
                                            expected: expectedId,
                                            actual: frontmatter.id,
                                            fixable: true
                                        });
                                        issues++;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Check bolt files: id should match folder name
        if (await fs.pathExists(BOLTS_DIR)) {
            const boltDirs = await fs.readdir(BOLTS_DIR);
            for (const boltDir of boltDirs) {
                const boltPath = path.join(BOLTS_DIR, boltDir, 'bolt.md');
                if (await fs.pathExists(boltPath)) {
                    const content = await fs.readFile(boltPath, 'utf8');
                    const frontmatter = extractFrontmatter(content);

                    if (frontmatter && frontmatter.id) {
                        const expectedId = boltDir;
                        if (expectedId !== frontmatter.id) {
                            this.addResult({
                                type: 'consistency',
                                severity: 'error',
                                file: boltPath,
                                rule: 'bolt.id-matches-folder',
                                message: `Bolt id "${frontmatter.id}" doesn't match folder "${boltDir}/"`,
                                expected: expectedId,
                                actual: frontmatter.id,
                                fixable: true
                            });
                            issues++;
                        }
                    }
                }
            }
        }

        return issues;
    }

    /**
     * Test Suite 3: Cross-Reference Integrity
     */
    async validateCrossReferences() {
        console.log(`${colors.dim}[3/4] Validating cross-references...${colors.reset}`);
        let issues = 0;

        // Check bolt story references
        if (await fs.pathExists(BOLTS_DIR)) {
            const boltDirs = await fs.readdir(BOLTS_DIR);
            for (const boltDir of boltDirs) {
                const boltPath = path.join(BOLTS_DIR, boltDir, 'bolt.md');
                if (await fs.pathExists(boltPath)) {
                    const content = await fs.readFile(boltPath, 'utf8');
                    const frontmatter = extractFrontmatter(content);

                    if (frontmatter) {
                        const intent = frontmatter.intent;
                        const unit = frontmatter.unit;

                        // Check each story reference exists
                        for (const storyId of frontmatter.stories || []) {
                            const storyPath = path.join(INTENTS_DIR, intent, 'units', unit, 'stories', `${storyId}.md`);
                            if (!await fs.pathExists(storyPath)) {
                                this.addResult({
                                    type: 'reference',
                                    severity: 'error',
                                    file: boltPath,
                                    rule: 'bolt.story-exists',
                                    message: `Bolt references non-existent story "${storyId}"`,
                                    reference: storyId,
                                    expectedPath: storyPath,
                                    fixable: false
                                });
                                issues++;
                            }
                        }

                        // Check unit folder exists
                        if (unit) {
                            const unitPath = path.join(INTENTS_DIR, intent, 'units', unit);
                            if (!await fs.pathExists(unitPath)) {
                                this.addResult({
                                    type: 'reference',
                                    severity: 'error',
                                    file: boltPath,
                                    rule: 'bolt.unit-exists',
                                    message: `Bolt references non-existent unit "${unit}"`,
                                    reference: unit,
                                    expectedPath: unitPath,
                                    fixable: false
                                });
                                issues++;
                            }
                        }

                        // Check intent folder exists
                        if (intent) {
                            const intentPath = path.join(INTENTS_DIR, intent);
                            if (!await fs.pathExists(intentPath)) {
                                this.addResult({
                                    type: 'reference',
                                    severity: 'error',
                                    file: boltPath,
                                    rule: 'bolt.intent-exists',
                                    message: `Bolt references non-existent intent "${intent}"`,
                                    reference: intent,
                                    expectedPath: intentPath,
                                    fixable: false
                                });
                                issues++;
                            }
                        }
                    }
                }
            }
        }

        return issues;
    }

    /**
     * Test Suite 4: Timestamp Format
     */
    async validateTimestamps() {
        console.log(`${colors.dim}[4/4] Validating timestamp formats...${colors.reset}`);
        let issues = 0;

        const timestampFields = ['created', 'updated', 'started', 'completed', 'timestamp', 'last_updated'];

        // Function to check all frontmatter fields recursively
        const checkFields = (obj, filePath) => {
            for (const [key, value] of Object.entries(obj)) {
                if (value === null || value === undefined) continue;

                if (typeof value === 'string' && timestampFields.includes(key)) {
                    // Check if it looks like a timestamp (contains T and ends with Z)
                    if (value.includes('T') && value.endsWith('Z')) {
                        // Extract just the time portion for format check
                        if (!patterns.timestamp.test(value)) {
                            // Check for milliseconds
                            if (/\.\d+Z$/.test(value)) {
                                this.addResult({
                                    type: 'format',
                                    severity: 'warning',
                                    file: filePath,
                                    rule: 'timestamp.no-milliseconds',
                                    message: `Timestamp "${value}" has milliseconds (should be YYYY-MM-DDTHH:MM:SSZ)`,
                                    field: key,
                                    value: value,
                                    fixable: true
                                });
                                issues++;
                            } else {
                                this.addResult({
                                    type: 'format',
                                    severity: 'warning',
                                    file: filePath,
                                    rule: 'timestamp.iso8601',
                                    message: `Timestamp "${value}" doesn't match ISO 8601 format`,
                                    field: key,
                                    value: value,
                                    fixable: false
                                });
                                issues++;
                            }
                        }
                    }
                } else if (typeof value === 'object' && !Array.isArray(value)) {
                    checkFields(value, filePath);
                }
            }
        };

        // Check all markdown files in memory-bank
        const checkDir = async (dir) => {
            if (!await fs.pathExists(dir)) return;
            const entries = await fs.readdir(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    await checkDir(fullPath);
                } else if (entry.isFile() && path.extname(entry.name) === '.md') {
                    const content = await fs.readFile(fullPath, 'utf8');
                    const frontmatter = extractFrontmatter(content);
                    if (frontmatter) {
                        checkFields(frontmatter, fullPath);
                    }
                }
            }
        };

        await checkDir(MEMORY_BANK_DIR);
        return issues;
    }

    /**
     * Run all validation suites
     */
    async validateAll() {
        console.log(`${colors.bright}${colors.blue}════════════════════════════════════════${colors.reset}`);
        console.log(`${colors.bright}${colors.blue}Artifact Validator${colors.reset}`);
        console.log(`${colors.bright}${colors.blue}════════════════════════════════════════${colors.reset}\n`);

        const totalIssues =
            await this.validateNamingConventions() +
            await this.validateIdFilenameConsistency() +
            await this.validateCrossReferences() +
            await this.validateTimestamps();

        return { totalIssues, results: this.results };
    }

    /**
     * Fix safe issues (ID-filename consistency, timestamp milliseconds)
     */
    async fixSafeIssues() {
        let fixed = 0;

        console.log(`${colors.bright}Fixing safe issues...${colors.reset}\n`);

        for (const result of this.results) {
            if (!result.fixable) continue;

            if (result.rule === 'story.id-matches-filename') {
                const content = await fs.readFile(result.file, 'utf8');
                const frontmatter = extractFrontmatter(content);
                if (frontmatter) {
                    frontmatter.id = result.expected;
                    const newContent = updateFrontmatter(content, frontmatter);
                    if (newContent) {
                        await fs.writeFile(result.file, newContent, 'utf8');
                        console.log(`  ${colors.green}✓${colors.reset} Fixed story ID: ${result.file}`);
                        fixed++;
                    }
                }
            }

            if (result.rule === 'bolt.id-matches-folder') {
                const content = await fs.readFile(result.file, 'utf8');
                const frontmatter = extractFrontmatter(content);
                if (frontmatter) {
                    frontmatter.id = result.expected;
                    const newContent = updateFrontmatter(content, frontmatter);
                    if (newContent) {
                        await fs.writeFile(result.file, newContent, 'utf8');
                        console.log(`  ${colors.green}✓${colors.reset} Fixed bolt ID: ${result.file}`);
                        fixed++;
                    }
                }
            }

            if (result.rule === 'timestamp.no-milliseconds') {
                const content = await fs.readFile(result.file, 'utf8');
                const frontmatter = extractFrontmatter(content);
                if (frontmatter && frontmatter[result.field]) {
                    frontmatter[result.field] = frontmatter[result.field].replace(/\.\d+Z$/, 'Z');
                    const newContent = updateFrontmatter(content, frontmatter);
                    if (newContent) {
                        await fs.writeFile(result.file, newContent, 'utf8');
                        console.log(`  ${colors.green}✓${colors.reset} Fixed timestamp: ${result.file}`);
                        fixed++;
                    }
                }
            }
        }

        return fixed;
    }

    /**
     * Output results to console
     */
    toConsole() {
        console.log();

        if (this.results.length === 0) {
            console.log(`${colors.green}✓${colors.reset} All validations passed!\n`);
        } else {
            const errors = this.results.filter(r => r.severity === 'error').length;
            const warnings = this.results.filter(r => r.severity === 'warning').length;

            console.log(`${colors.bright}${colors.yellow}⚠ ${this.results.length} issues found${colors.reset}`);
            console.log(`${colors.dim}(${errors} errors, ${warnings} warnings)${colors.reset}\n`);

            // Group by type
            const byType = {};
            for (const result of this.results) {
                if (!byType[result.type]) byType[result.type] = [];
                byType[result.type].push(result);
            }

            for (const [type, issues] of Object.entries(byType)) {
                console.log(`${colors.bright}${type.toUpperCase()} Issues:${colors.reset}\n`);
                for (const issue of issues) {
                    const icon = issue.severity === 'error' ? colors.red + '✗' : colors.yellow + '⚠';
                    const shortPath = issue.file.replace(/^memory-bank\//, '');
                    console.log(`  ${icon}${colors.reset} ${shortPath}`);
                    console.log(`     ${colors.dim}${issue.message}${colors.reset}`);
                }
                console.log();
            }
        }

        console.log(`${colors.bright}${colors.blue}════════════════════════════════════════${colors.reset}`);
        console.log(`${colors.bright}${colors.blue}Summary${colors.reset}`);
        console.log(`${colors.bright}${colors.blue}════════════════════════════════════════${colors.reset}\n`);
        console.log(`Total issues: ${this.results.length}`);
        if (this.fixCount > 0) {
            console.log(`Fixed: ${this.fixCount}`);
        }
        console.log();
    }

    /**
     * Output results as JSON
     */
    toJSON() {
        return JSON.stringify({
            summary: {
                total: this.results.length,
                errors: this.results.filter(r => r.severity === 'error').length,
                warnings: this.results.filter(r => r.severity === 'warning').length,
                fixed: this.fixCount
            },
            results: this.results
        }, null, 2);
    }
}

// CLI entry point
async function main() {
    const args = process.argv.slice(2);
    const jsonOutput = args.includes('--json');
    const shouldFix = args.includes('--fix');

    const validator = new ArtifactValidator();
    await validator.validateAll();

    if (shouldFix) {
        await validator.fixSafeIssues();
    }

    if (jsonOutput) {
        console.log(validator.toJSON());
    } else {
        validator.toConsole();
    }

    const hasErrors = validator.results.some(r => r.severity === 'error');
    process.exit(hasErrors && !shouldFix ? 1 : 0);
}

if (require.main === module) {
    main().catch(error => {
        console.error(`\n${colors.red}Error:${colors.reset}`, error.message);
        process.exit(1);
    });
}

module.exports = ArtifactValidator;

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
    scanMemoryBank,
    parseIntent,
    parseUnit,
    parseStory,
    parseBolt,
    parseStandard
} from '../../parser/artifactParser';
import { ArtifactStatus } from '../../parser/types';

suite('Artifact Parser Test Suite', () => {

    let tempDir: string;

    setup(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'specsmd-test-'));
    });

    teardown(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    /**
     * Helper to create a file with content
     */
    function createFile(filePath: string, content: string): void {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, content);
    }

    /**
     * Helper to setup a minimal specsmd project
     */
    function setupMinimalProject(): void {
        fs.mkdirSync(path.join(tempDir, 'memory-bank', 'intents'), { recursive: true });
        fs.mkdirSync(path.join(tempDir, 'memory-bank', 'bolts'), { recursive: true });
        fs.mkdirSync(path.join(tempDir, 'memory-bank', 'standards'), { recursive: true });
    }

    suite('parseStory', () => {

        test('should parse story with valid frontmatter', async () => {
            const storyPath = path.join(tempDir, '001-test-story.md');
            createFile(storyPath, `---
status: in-progress
priority: must
---

# Test Story

Content here.`);

            const result = await parseStory(storyPath, 'test-unit', 'test-intent');

            assert.ok(result);
            assert.strictEqual(result.id, '001');
            assert.strictEqual(result.title, 'test-story');
            assert.strictEqual(result.unitName, 'test-unit');
            assert.strictEqual(result.intentName, 'test-intent');
            assert.strictEqual(result.status, ArtifactStatus.InProgress);
            assert.strictEqual(result.priority, 'must');
        });

        test('should return null for invalid filename', async () => {
            const storyPath = path.join(tempDir, 'invalid-story.md');
            createFile(storyPath, '# Content');

            const result = await parseStory(storyPath, 'test-unit', 'test-intent');

            assert.strictEqual(result, null);
        });

        test('should use Unknown status for missing frontmatter', async () => {
            const storyPath = path.join(tempDir, '001-test-story.md');
            createFile(storyPath, '# Just content without frontmatter');

            const result = await parseStory(storyPath, 'test-unit', 'test-intent');

            assert.ok(result);
            assert.strictEqual(result.status, ArtifactStatus.Unknown);
        });

        test('should use default priority when not specified', async () => {
            const storyPath = path.join(tempDir, '001-test-story.md');
            createFile(storyPath, `---
status: draft
---

# Story`);

            const result = await parseStory(storyPath, 'test-unit', 'test-intent');

            assert.ok(result);
            assert.strictEqual(result.priority, 'should');
        });
    });

    suite('parseUnit', () => {

        test('should parse unit with stories', async () => {
            const unitPath = path.join(tempDir, 'test-unit');
            const storiesPath = path.join(unitPath, 'stories');
            fs.mkdirSync(storiesPath, { recursive: true });

            createFile(path.join(storiesPath, '001-first-story.md'), `---
status: complete
priority: must
---
# First`);

            createFile(path.join(storiesPath, '002-second-story.md'), `---
status: in-progress
priority: should
---
# Second`);

            const result = await parseUnit(unitPath, 'test-intent');

            assert.strictEqual(result.name, 'test-unit');
            assert.strictEqual(result.intentName, 'test-intent');
            assert.strictEqual(result.stories.length, 2);
            assert.strictEqual(result.stories[0].id, '001');
            assert.strictEqual(result.stories[1].id, '002');
        });

        test('should return empty stories array for missing stories folder', async () => {
            const unitPath = path.join(tempDir, 'test-unit');
            fs.mkdirSync(unitPath, { recursive: true });

            const result = await parseUnit(unitPath, 'test-intent');

            assert.strictEqual(result.stories.length, 0);
        });

        test('should calculate aggregate status from stories', async () => {
            const unitPath = path.join(tempDir, 'test-unit');
            const storiesPath = path.join(unitPath, 'stories');
            fs.mkdirSync(storiesPath, { recursive: true });

            createFile(path.join(storiesPath, '001-story.md'), `---
status: in-progress
---
# Story`);

            const result = await parseUnit(unitPath, 'test-intent');

            assert.strictEqual(result.status, ArtifactStatus.InProgress);
        });

        test('should use unit-brief status if present', async () => {
            const unitPath = path.join(tempDir, 'test-unit');
            fs.mkdirSync(unitPath, { recursive: true });

            createFile(path.join(unitPath, 'unit-brief.md'), `---
status: complete
---
# Unit Brief`);

            const result = await parseUnit(unitPath, 'test-intent');

            assert.strictEqual(result.status, ArtifactStatus.Complete);
        });
    });

    suite('parseIntent', () => {

        test('should parse intent with units', async () => {
            const intentPath = path.join(tempDir, '001-test-intent');
            const unitsPath = path.join(intentPath, 'units');
            const unitPath = path.join(unitsPath, 'test-unit');
            fs.mkdirSync(path.join(unitPath, 'stories'), { recursive: true });

            createFile(path.join(intentPath, 'requirements.md'), `---
status: in-progress
---
# Requirements`);

            const result = await parseIntent(intentPath);

            assert.ok(result);
            assert.strictEqual(result.name, 'test-intent');
            assert.strictEqual(result.number, '001');
            assert.strictEqual(result.units.length, 1);
            assert.strictEqual(result.status, ArtifactStatus.InProgress);
        });

        test('should return null for invalid intent folder name', async () => {
            const intentPath = path.join(tempDir, 'invalid-intent');
            fs.mkdirSync(intentPath, { recursive: true });

            const result = await parseIntent(intentPath);

            assert.strictEqual(result, null);
        });

        test('should return empty units array for missing units folder', async () => {
            const intentPath = path.join(tempDir, '001-test-intent');
            fs.mkdirSync(intentPath, { recursive: true });

            const result = await parseIntent(intentPath);

            assert.ok(result);
            assert.strictEqual(result.units.length, 0);
        });
    });

    suite('parseBolt', () => {

        test('should parse bolt with valid frontmatter', async () => {
            const boltPath = path.join(tempDir, 'bolt-test-1');
            fs.mkdirSync(boltPath, { recursive: true });

            createFile(path.join(boltPath, 'bolt.md'), `---
id: bolt-test-1
unit: test-unit
intent: 001-test-intent
type: simple-construction-bolt
status: in-progress
current_stage: implement
stages_completed:
  - name: plan
    completed: 2025-12-25T10:00:00Z
stories:
  - 001-story
  - 002-story
---

# Bolt`);

            const result = await parseBolt(boltPath);

            assert.ok(result);
            assert.strictEqual(result.id, 'bolt-test-1');
            assert.strictEqual(result.unit, 'test-unit');
            assert.strictEqual(result.intent, '001-test-intent');
            assert.strictEqual(result.type, 'simple-construction-bolt');
            assert.strictEqual(result.status, ArtifactStatus.InProgress);
            assert.strictEqual(result.currentStage, 'implement');
            assert.strictEqual(result.stages.length, 3);
            assert.strictEqual(result.stagesCompleted.length, 1);
            assert.strictEqual(result.stories.length, 2);
        });

        test('should return null for missing bolt.md', async () => {
            const boltPath = path.join(tempDir, 'bolt-test-1');
            fs.mkdirSync(boltPath, { recursive: true });
            // No bolt.md file

            const result = await parseBolt(boltPath);

            assert.strictEqual(result, null);
        });

        test('should calculate stage statuses correctly', async () => {
            const boltPath = path.join(tempDir, 'bolt-test-1');
            fs.mkdirSync(boltPath, { recursive: true });

            createFile(path.join(boltPath, 'bolt.md'), `---
type: simple-construction-bolt
status: in-progress
current_stage: implement
stages_completed:
  - name: plan
---

# Bolt`);

            const result = await parseBolt(boltPath);

            assert.ok(result);
            // plan should be Complete (in stages_completed)
            assert.strictEqual(result.stages[0].status, ArtifactStatus.Complete);
            // implement should be InProgress (is current_stage)
            assert.strictEqual(result.stages[1].status, ArtifactStatus.InProgress);
            // test should be Draft (not started)
            assert.strictEqual(result.stages[2].status, ArtifactStatus.Draft);
        });

        test('should handle ddd-construction-bolt stages', async () => {
            const boltPath = path.join(tempDir, 'bolt-test-1');
            fs.mkdirSync(boltPath, { recursive: true });

            createFile(path.join(boltPath, 'bolt.md'), `---
type: ddd-construction-bolt
status: planned
---

# Bolt`);

            const result = await parseBolt(boltPath);

            assert.ok(result);
            // DDD bolt has 5 stages: model, design, adr, implement, test
            assert.strictEqual(result.stages.length, 5);
            assert.strictEqual(result.stages[0].name, 'model');
            assert.strictEqual(result.stages[1].name, 'design');
            assert.strictEqual(result.stages[2].name, 'adr');
            assert.strictEqual(result.stages[3].name, 'implement');
            assert.strictEqual(result.stages[4].name, 'test');
        });

        test('should match stage names with flexible aliases', async () => {
            const boltPath = path.join(tempDir, 'bolt-test-1');
            fs.mkdirSync(boltPath, { recursive: true });

            // Use alternate stage names that the construction agent might write
            createFile(path.join(boltPath, 'bolt.md'), `---
type: ddd-construction-bolt
status: in-progress
current_stage: implementation
stages_completed:
  - name: domain-model
  - name: technical-design
---

# Bolt`);

            const result = await parseBolt(boltPath);

            assert.ok(result);
            // model should be Complete (domain-model matches model)
            assert.strictEqual(result.stages[0].status, ArtifactStatus.Complete);
            // design should be Complete (technical-design matches design)
            assert.strictEqual(result.stages[1].status, ArtifactStatus.Complete);
            // adr should be Draft (not in stages_completed)
            assert.strictEqual(result.stages[2].status, ArtifactStatus.Draft);
            // implement should be InProgress (implementation matches implement)
            assert.strictEqual(result.stages[3].status, ArtifactStatus.InProgress);
            // test should be Draft
            assert.strictEqual(result.stages[4].status, ArtifactStatus.Draft);
        });

        test('should resolve constructionLogPath when file exists', async () => {
            // Create workspace structure with memory-bank
            const workspacePath = tempDir;
            const intentPath = path.join(workspacePath, 'memory-bank', 'intents', '001-test-intent');
            const unitPath = path.join(intentPath, 'units', '001-test-unit');
            const boltPath = path.join(workspacePath, 'memory-bank', 'bolts', 'bolt-test-1');

            fs.mkdirSync(unitPath, { recursive: true });
            fs.mkdirSync(boltPath, { recursive: true });

            // Create construction log
            createFile(path.join(unitPath, 'construction-log.md'), `---
unit: 001-test-unit
intent: 001-test-intent
---
# Construction Log`);

            // Create bolt referencing the unit/intent
            createFile(path.join(boltPath, 'bolt.md'), `---
type: simple-construction-bolt
status: complete
unit: 001-test-unit
intent: 001-test-intent
---
# Bolt`);

            const result = await parseBolt(boltPath, workspacePath);

            assert.ok(result);
            assert.ok(result.constructionLogPath);
            assert.strictEqual(
                result.constructionLogPath,
                path.join(unitPath, 'construction-log.md')
            );
        });

        test('should not set constructionLogPath when file does not exist', async () => {
            const workspacePath = tempDir;
            const boltPath = path.join(workspacePath, 'memory-bank', 'bolts', 'bolt-test-1');

            fs.mkdirSync(boltPath, { recursive: true });

            // Create bolt but no construction log
            createFile(path.join(boltPath, 'bolt.md'), `---
type: simple-construction-bolt
status: complete
unit: 001-test-unit
intent: 001-test-intent
---
# Bolt`);

            const result = await parseBolt(boltPath, workspacePath);

            assert.ok(result);
            assert.strictEqual(result.constructionLogPath, undefined);
        });

        test('should not set constructionLogPath when unit is missing', async () => {
            const workspacePath = tempDir;
            const boltPath = path.join(workspacePath, 'memory-bank', 'bolts', 'bolt-test-1');

            fs.mkdirSync(boltPath, { recursive: true });

            // Create bolt without unit field
            createFile(path.join(boltPath, 'bolt.md'), `---
type: simple-construction-bolt
status: complete
intent: 001-test-intent
---
# Bolt`);

            const result = await parseBolt(boltPath, workspacePath);

            assert.ok(result);
            assert.strictEqual(result.constructionLogPath, undefined);
        });

        test('should not set constructionLogPath when intent is missing', async () => {
            const workspacePath = tempDir;
            const boltPath = path.join(workspacePath, 'memory-bank', 'bolts', 'bolt-test-1');

            fs.mkdirSync(boltPath, { recursive: true });

            // Create bolt without intent field
            createFile(path.join(boltPath, 'bolt.md'), `---
type: simple-construction-bolt
status: complete
unit: 001-test-unit
---
# Bolt`);

            const result = await parseBolt(boltPath, workspacePath);

            assert.ok(result);
            assert.strictEqual(result.constructionLogPath, undefined);
        });

        test('should not set constructionLogPath when workspacePath is not provided', async () => {
            const boltPath = path.join(tempDir, 'bolt-test-1');
            fs.mkdirSync(boltPath, { recursive: true });

            createFile(path.join(boltPath, 'bolt.md'), `---
type: simple-construction-bolt
status: complete
unit: 001-test-unit
intent: 001-test-intent
---
# Bolt`);

            // Call without workspacePath
            const result = await parseBolt(boltPath);

            assert.ok(result);
            assert.strictEqual(result.constructionLogPath, undefined);
        });
    });

    suite('parseStandard', () => {

        test('should parse standard file', async () => {
            const standardPath = path.join(tempDir, 'tech-stack.md');
            createFile(standardPath, '# Tech Stack');

            const result = await parseStandard(standardPath);

            assert.strictEqual(result.name, 'tech-stack');
            assert.strictEqual(result.path, standardPath);
        });
    });

    suite('scanMemoryBank', () => {

        test('should return complete model for specsmd project', async () => {
            setupMinimalProject();

            // Create an intent
            const intentPath = path.join(tempDir, 'memory-bank', 'intents', '001-test');
            const unitPath = path.join(intentPath, 'units', 'test-unit');
            fs.mkdirSync(path.join(unitPath, 'stories'), { recursive: true });

            createFile(path.join(unitPath, 'stories', '001-story.md'), `---
status: draft
---
# Story`);

            // Create a bolt
            const boltPath = path.join(tempDir, 'memory-bank', 'bolts', 'bolt-test-1');
            fs.mkdirSync(boltPath, { recursive: true });

            createFile(path.join(boltPath, 'bolt.md'), `---
type: simple-construction-bolt
status: planned
---
# Bolt`);

            // Create a standard
            createFile(
                path.join(tempDir, 'memory-bank', 'standards', 'tech-stack.md'),
                '# Tech Stack'
            );

            const result = await scanMemoryBank(tempDir);

            assert.strictEqual(result.isProject, true);
            assert.strictEqual(result.intents.length, 1);
            assert.strictEqual(result.bolts.length, 1);
            assert.strictEqual(result.standards.length, 1);
        });

        test('should return empty model for non-specsmd project', async () => {
            // tempDir has no memory-bank folder

            const result = await scanMemoryBank(tempDir);

            assert.strictEqual(result.isProject, false);
            assert.strictEqual(result.intents.length, 0);
            assert.strictEqual(result.bolts.length, 0);
            assert.strictEqual(result.standards.length, 0);
        });

        test('should sort intents by number', async () => {
            setupMinimalProject();

            fs.mkdirSync(path.join(tempDir, 'memory-bank', 'intents', '002-second'), { recursive: true });
            fs.mkdirSync(path.join(tempDir, 'memory-bank', 'intents', '001-first'), { recursive: true });
            fs.mkdirSync(path.join(tempDir, 'memory-bank', 'intents', '003-third'), { recursive: true });

            const result = await scanMemoryBank(tempDir);

            assert.strictEqual(result.intents[0].number, '001');
            assert.strictEqual(result.intents[1].number, '002');
            assert.strictEqual(result.intents[2].number, '003');
        });

        test('should sort bolts with in-progress first', async () => {
            setupMinimalProject();

            const bolt1 = path.join(tempDir, 'memory-bank', 'bolts', 'bolt-a-1');
            const bolt2 = path.join(tempDir, 'memory-bank', 'bolts', 'bolt-b-1');
            fs.mkdirSync(bolt1, { recursive: true });
            fs.mkdirSync(bolt2, { recursive: true });

            createFile(path.join(bolt1, 'bolt.md'), `---
status: planned
---
# Bolt A`);

            createFile(path.join(bolt2, 'bolt.md'), `---
status: in-progress
---
# Bolt B`);

            const result = await scanMemoryBank(tempDir);

            // In-progress bolt should be first
            assert.strictEqual(result.bolts[0].id, 'bolt-b-1');
            assert.strictEqual(result.bolts[1].id, 'bolt-a-1');
        });
    });
});

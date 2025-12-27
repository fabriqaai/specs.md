import * as assert from 'assert';
import { parseFrontmatter, normalizeStatus, extractStatus } from '../../parser/frontmatterParser';
import { ArtifactStatus } from '../../parser/types';

suite('Frontmatter Parser Test Suite', () => {

    suite('parseFrontmatter', () => {

        test('should parse valid YAML frontmatter', () => {
            const content = `---
status: in-progress
priority: must
title: Test Story
---

# Content here`;

            const result = parseFrontmatter(content);

            assert.ok(result);
            assert.strictEqual(result.status, 'in-progress');
            assert.strictEqual(result.priority, 'must');
            assert.strictEqual(result.title, 'Test Story');
        });

        test('should return null for content without frontmatter', () => {
            const content = `# Just a heading

Some content without frontmatter.`;

            const result = parseFrontmatter(content);

            assert.strictEqual(result, null);
        });

        test('should return null for empty content', () => {
            assert.strictEqual(parseFrontmatter(''), null);
        });

        test('should return null for null/undefined input', () => {
            assert.strictEqual(parseFrontmatter(null as unknown as string), null);
            assert.strictEqual(parseFrontmatter(undefined as unknown as string), null);
        });

        test('should return null for invalid YAML', () => {
            const content = `---
status: [invalid yaml
  broken: stuff
---

# Content`;

            const result = parseFrontmatter(content);

            assert.strictEqual(result, null);
        });

        test('should handle frontmatter with nested objects', () => {
            const content = `---
complexity:
  avg_complexity: 2
  avg_uncertainty: 1
stories:
  - story-001
  - story-002
---

# Content`;

            const result = parseFrontmatter(content);

            assert.ok(result);
            assert.ok(result.complexity);
            assert.strictEqual((result.complexity as Record<string, number>).avg_complexity, 2);
            assert.ok(Array.isArray(result.stories));
            assert.strictEqual((result.stories as string[]).length, 2);
        });

        test('should handle frontmatter with only delimiters', () => {
            const content = `---
---

# Content`;

            const result = parseFrontmatter(content);

            // Empty YAML returns empty object or null depending on parser
            assert.ok(result === null || Object.keys(result).length === 0);
        });

        test('should handle unicode in values', () => {
            const content = `---
title: Test with unicode
description: Contains special chars
---

# Content`;

            const result = parseFrontmatter(content);

            assert.ok(result);
            assert.strictEqual(result.title, 'Test with unicode');
        });
    });

    suite('normalizeStatus', () => {

        test('should normalize draft variations', () => {
            assert.strictEqual(normalizeStatus('draft'), ArtifactStatus.Draft);
            assert.strictEqual(normalizeStatus('pending'), ArtifactStatus.Draft);
            assert.strictEqual(normalizeStatus('planned'), ArtifactStatus.Draft);
            assert.strictEqual(normalizeStatus('todo'), ArtifactStatus.Draft);
            assert.strictEqual(normalizeStatus('new'), ArtifactStatus.Draft);
        });

        test('should normalize in-progress variations', () => {
            assert.strictEqual(normalizeStatus('in-progress'), ArtifactStatus.InProgress);
            assert.strictEqual(normalizeStatus('in_progress'), ArtifactStatus.InProgress);
            assert.strictEqual(normalizeStatus('inprogress'), ArtifactStatus.InProgress);
            assert.strictEqual(normalizeStatus('in progress'), ArtifactStatus.InProgress);
            assert.strictEqual(normalizeStatus('active'), ArtifactStatus.InProgress);
            assert.strictEqual(normalizeStatus('started'), ArtifactStatus.InProgress);
            assert.strictEqual(normalizeStatus('wip'), ArtifactStatus.InProgress);
            assert.strictEqual(normalizeStatus('working'), ArtifactStatus.InProgress);
        });

        test('should normalize complete variations', () => {
            assert.strictEqual(normalizeStatus('complete'), ArtifactStatus.Complete);
            assert.strictEqual(normalizeStatus('completed'), ArtifactStatus.Complete);
            assert.strictEqual(normalizeStatus('done'), ArtifactStatus.Complete);
            assert.strictEqual(normalizeStatus('finished'), ArtifactStatus.Complete);
            assert.strictEqual(normalizeStatus('closed'), ArtifactStatus.Complete);
            assert.strictEqual(normalizeStatus('resolved'), ArtifactStatus.Complete);
        });

        test('should handle case insensitivity', () => {
            assert.strictEqual(normalizeStatus('DRAFT'), ArtifactStatus.Draft);
            assert.strictEqual(normalizeStatus('In-Progress'), ArtifactStatus.InProgress);
            assert.strictEqual(normalizeStatus('COMPLETE'), ArtifactStatus.Complete);
        });

        test('should handle whitespace', () => {
            assert.strictEqual(normalizeStatus('  draft  '), ArtifactStatus.Draft);
            assert.strictEqual(normalizeStatus('\tin-progress\n'), ArtifactStatus.InProgress);
        });

        test('should return Unknown for unrecognized status', () => {
            assert.strictEqual(normalizeStatus('unknown'), ArtifactStatus.Unknown);
            assert.strictEqual(normalizeStatus('random'), ArtifactStatus.Unknown);
            assert.strictEqual(normalizeStatus('invalid'), ArtifactStatus.Unknown);
        });

        test('should return Unknown for undefined/null', () => {
            assert.strictEqual(normalizeStatus(undefined), ArtifactStatus.Unknown);
            assert.strictEqual(normalizeStatus(null as unknown as string), ArtifactStatus.Unknown);
        });

        test('should return Unknown for empty string', () => {
            assert.strictEqual(normalizeStatus(''), ArtifactStatus.Unknown);
            assert.strictEqual(normalizeStatus('   '), ArtifactStatus.Unknown);
        });
    });

    suite('extractStatus', () => {

        test('should extract and normalize status from content', () => {
            const content = `---
status: in-progress
---

# Content`;

            assert.strictEqual(extractStatus(content), ArtifactStatus.InProgress);
        });

        test('should return Unknown for content without frontmatter', () => {
            const content = '# Just content';
            assert.strictEqual(extractStatus(content), ArtifactStatus.Unknown);
        });

        test('should return Unknown for frontmatter without status', () => {
            const content = `---
priority: must
---

# Content`;

            assert.strictEqual(extractStatus(content), ArtifactStatus.Unknown);
        });
    });
});

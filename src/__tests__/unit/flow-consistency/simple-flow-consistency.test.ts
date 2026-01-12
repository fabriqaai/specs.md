/**
 * Simple Flow Consistency Tests
 *
 * Tests for the simple spec-driven development flow:
 * - Skill reference integrity (templates exist)
 * - Placeholder consistency ({feature}, {System_Name})
 * - Phase terminology (requirements, design, tasks, execute)
 * - EARS format examples validity
 * - Workflow state consistency
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as path from 'path';
import { glob } from 'glob';
import * as fs from 'fs-extra';
import * as yaml from 'js-yaml';

const SIMPLE_FLOWS_PATH = path.resolve(__dirname, '../../../flows/simple');

let skillFiles: string[] = [];
let templateFiles: string[] = [];

beforeAll(async () => {
  skillFiles = await glob(path.join(SIMPLE_FLOWS_PATH, 'skills/*.md'));
  templateFiles = await glob(path.join(SIMPLE_FLOWS_PATH, 'templates/*.md'));
});

describe('Simple Flow - Reference Integrity', () => {
  describe('Required files should exist', () => {
    const requiredFiles = [
      'agents/agent.md',
      'skills/requirements.md',
      'skills/design.md',
      'skills/tasks.md',
      'skills/execute.md',
      'templates/requirements-template.md',
      'templates/design-template.md',
      'templates/tasks-template.md',
      'memory-bank.yaml',
      'context-config.yaml',
    ];

    for (const file of requiredFiles) {
      it(`${file} should exist`, async () => {
        const filePath = path.join(SIMPLE_FLOWS_PATH, file);
        const exists = await fs.pathExists(filePath);
        expect(exists).toBe(true);
      });
    }
  });

  describe('Skills should reference existing templates', () => {
    const skillToTemplate: Record<string, string> = {
      'requirements.md': 'requirements-template.md',
      'design.md': 'design-template.md',
      'tasks.md': 'tasks-template.md',
    };

    for (const [skill, template] of Object.entries(skillToTemplate)) {
      it(`${skill} should reference ${template}`, async () => {
        const skillPath = path.join(SIMPLE_FLOWS_PATH, 'skills', skill);
        const content = await fs.readFile(skillPath, 'utf8');
        expect(content).toContain(template);
      });
    }
  });
});

describe('Simple Flow - Placeholder Consistency', () => {
  it('should use {feature} placeholder in skills', async () => {
    for (const file of skillFiles) {
      const content = await fs.readFile(file, 'utf8');
      // Skills should reference {feature} for the spec directory
      if (content.includes('memory-bank/specs/')) {
        expect(content).toMatch(/\{feature\}|\{feature-name\}/);
      }
    }
  });

  it('should use [System_Name] placeholder in requirements template', async () => {
    const content = await fs.readFile(
      path.join(SIMPLE_FLOWS_PATH, 'templates/requirements-template.md'),
      'utf8'
    );
    expect(content).toContain('[System_Name]');
  });

  it('should use requirement reference placeholders in tasks template', async () => {
    const content = await fs.readFile(
      path.join(SIMPLE_FLOWS_PATH, 'templates/tasks-template.md'),
      'utf8'
    );
    expect(content).toMatch(/_Requirements:\s*\[?X\.Y/);
  });
});

describe('Simple Flow - Phase Terminology', () => {
  it('agent should reference all four skills', async () => {
    const agentContent = await fs.readFile(
      path.join(SIMPLE_FLOWS_PATH, 'agents/agent.md'),
      'utf8'
    );

    expect(agentContent).toContain('requirements');
    expect(agentContent).toContain('design');
    expect(agentContent).toContain('tasks');
    expect(agentContent).toContain('execute');
  });

  it('agent should define state detection table', async () => {
    const agentContent = await fs.readFile(
      path.join(SIMPLE_FLOWS_PATH, 'agents/agent.md'),
      'utf8'
    );

    // Should have state detection logic
    expect(agentContent).toMatch(/State Detection/i);
    expect(agentContent).toContain('requirements.md');
    expect(agentContent).toContain('design.md');
    expect(agentContent).toContain('tasks.md');
  });
});

describe('Simple Flow - EARS Format', () => {
  it('requirements template should include EARS patterns', async () => {
    const content = await fs.readFile(
      path.join(SIMPLE_FLOWS_PATH, 'templates/requirements-template.md'),
      'utf8'
    );

    // All EARS pattern keywords should be present
    expect(content).toContain('WHEN');
    expect(content).toContain('WHILE');
    expect(content).toContain('WHERE');
    expect(content).toContain('SHALL');
  });

  it('requirements template should include INCOSE rules', async () => {
    const content = await fs.readFile(
      path.join(SIMPLE_FLOWS_PATH, 'templates/requirements-template.md'),
      'utf8'
    );

    expect(content).toMatch(/INCOSE/i);
    expect(content).toContain('Singular');
    expect(content).toContain('Verifiable');
  });
});

describe('Simple Flow - Task Format', () => {
  it('tasks template should use checkbox format', async () => {
    const content = await fs.readFile(
      path.join(SIMPLE_FLOWS_PATH, 'templates/tasks-template.md'),
      'utf8'
    );

    expect(content).toMatch(/- \[ \]/); // Pending task
    expect(content).toMatch(/- \[x\]/i); // Completed task (in docs)
  });

  it('tasks skill should define checkpoint requirements', async () => {
    const content = await fs.readFile(
      path.join(SIMPLE_FLOWS_PATH, 'skills/tasks.md'),
      'utf8'
    );

    expect(content).toMatch(/checkpoint/i);
  });

  it('execute skill should define verification step', async () => {
    const content = await fs.readFile(
      path.join(SIMPLE_FLOWS_PATH, 'skills/execute.md'),
      'utf8'
    );

    expect(content).toMatch(/verify|verification/i);
  });
});

describe('Simple Flow - YAML Config Validity', () => {
  it('memory-bank.yaml should be valid YAML', async () => {
    const content = await fs.readFile(
      path.join(SIMPLE_FLOWS_PATH, 'memory-bank.yaml'),
      'utf8'
    );

    expect(() => yaml.load(content)).not.toThrow();
  });

  it('context-config.yaml should be valid YAML', async () => {
    const content = await fs.readFile(
      path.join(SIMPLE_FLOWS_PATH, 'context-config.yaml'),
      'utf8'
    );

    expect(() => yaml.load(content)).not.toThrow();
  });
});

/**
 * Standalone Script Tests
 *
 * Flow scripts are copied into the user's project (.specsmd/<flow>/...) and run
 * with plain `node`, where specsmd's own node_modules can't be resolved. They
 * may only require Node built-ins and files shipped with the flow.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { builtinModules } from 'module';
import { spawnSync } from 'child_process';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import { glob } from 'glob';
import { ROOT_DIR } from './helpers';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { VENDORED, renderVendored } = require('../../../scripts/vendor-flow-deps.cjs');

const FLOWS_DIR = path.join(ROOT_DIR, 'flows');
const FIRE_SCRIPTS = '.specsmd/fire/agents/builder/skills/run-execute/scripts';

describe('Flow Scripts - Standalone', () => {
  it('should only require Node built-ins or files shipped with the flow', async () => {
    const scripts = await glob('*/**/*.{js,cjs,mjs}', { cwd: FLOWS_DIR });
    const issues: string[] = [];

    for (const script of scripts) {
      const flowDir = path.join(FLOWS_DIR, script.split(/[\\/]/)[0]);
      const content = await fs.readFile(path.join(FLOWS_DIR, script), 'utf8');

      for (const [, specifier] of content.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)) {
        if (specifier.startsWith('.')) {
          const target = path.resolve(FLOWS_DIR, path.dirname(script), specifier);
          if (target.startsWith(flowDir + path.sep) && fs.existsSync(target)) continue;
        } else if (builtinModules.includes(specifier.replace(/^node:/, ''))) {
          continue;
        }
        issues.push(`flows/${script}: require('${specifier}')`);
      }
    }

    expect(scripts.length).toBeGreaterThan(0);
    expect(issues).toEqual([]);
  });

  it('should ship vendored dependencies that match the installed packages', () => {
    for (const { pkg, out } of VENDORED) {
      const outPath = path.join(ROOT_DIR, out);
      const upToDate = fs.existsSync(outPath) && fs.readFileSync(outPath, 'utf8') === renderVendored(pkg);
      expect(upToDate, `${out} is out of date; run \`npm run vendor:flow-deps\``).toBe(true);
    }
  });

  describe('in a project without node_modules', () => {
    let projectDir: string;

    beforeEach(async () => {
      projectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'specsmd-standalone-'));
    });

    afterEach(async () => {
      await fs.remove(projectDir);
    });

    function runScript(script: string, args: string[] = []) {
      const result = spawnSync(process.execPath, [script, ...args], {
        cwd: projectDir,
        encoding: 'utf8',
        env: { ...process.env, NODE_PATH: '' },
      });
      expect(result.stderr).not.toContain('Cannot find module');
      return result;
    }

    async function writeProjectFile(relativePath: string, content: string) {
      await fs.outputFile(path.join(projectDir, relativePath), content);
    }

    async function readProjectFile(relativePath: string) {
      return fs.readFile(path.join(projectDir, relativePath), 'utf8');
    }

    it('should complete an AI-DLC bolt and pass the integrity checks', async () => {
      await fs.copy(path.join(FLOWS_DIR, 'aidlc/scripts'), path.join(projectDir, '.specsmd/aidlc/scripts'));

      const unitDir = 'memory-bank/intents/001-auth/units/001-login';
      await writeProjectFile('memory-bank/bolts/001-login/bolt.md', [
        '---',
        'id: 001-login',
        'unit: 001-login',
        'intent: 001-auth',
        'status: in-progress',
        'stories:',
        '  - 001-login-form',
        '---',
        '',
        '# Bolt',
      ].join('\n'));
      await writeProjectFile(`${unitDir}/stories/001-login-form.md`, '---\nid: 001-login-form\nstatus: draft\nimplemented: false\n---\n');
      await writeProjectFile(`${unitDir}/unit-brief.md`, '---\nunit: 001-login\nintent: 001-auth\nstatus: ready\n---\n');
      await writeProjectFile('memory-bank/intents/001-auth/requirements.md', '---\nintent: 001-auth\nstatus: in-progress\n---\n');

      expect(runScript('.specsmd/aidlc/scripts/bolt-complete.cjs', ['001-login']).status).toBe(0);
      expect(await readProjectFile('memory-bank/bolts/001-login/bolt.md')).toMatch(/^status: complete$/m);
      expect(await readProjectFile(`${unitDir}/stories/001-login-form.md`)).toMatch(/^implemented: true$/m);
      expect(await readProjectFile(`${unitDir}/unit-brief.md`)).toMatch(/^status: complete$/m);
      expect(await readProjectFile('memory-bank/intents/001-auth/requirements.md')).toMatch(/^status: complete$/m);

      expect(runScript('.specsmd/aidlc/scripts/status-integrity.cjs').status).toBe(0);
      expect(runScript('.specsmd/aidlc/scripts/artifact-validator.cjs').status).toBe(0);
    });

    it('should start a FIRE run', async () => {
      await fs.copy(path.join(FLOWS_DIR, 'fire/agents'), path.join(projectDir, '.specsmd/fire/agents'));
      await writeProjectFile('.specs-fire/state.yaml', [
        'project:',
        '  name: demo',
        'intents: []',
        'runs:',
        '  active: []',
        '  completed: []',
        '',
      ].join('\n'));
      await fs.ensureDir(path.join(projectDir, '.specs-fire/runs'));

      const result = runScript(`${FIRE_SCRIPTS}/init-run.cjs`, [projectDir, 'login-form', 'login', 'confirm']);

      expect(result.status).toBe(0);
      expect(await readProjectFile('.specs-fire/state.yaml')).toMatch(/current_item: login-form/);
    });
  });
});

/**
 * Installed Path Tests
 *
 * The installer copies flows/<flow>/ to .specsmd/<flow>/ in the user's project,
 * so every .specsmd/ path a flow file points to must exist in that layout.
 */

import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { glob } from 'glob';
import * as fs from 'fs-extra';
import { ROOT_DIR } from './helpers';

const FLOWS_DIR = path.join(ROOT_DIR, 'flows');

// Referenced but never created; tracked in https://github.com/fabriqaai/specs.md/issues/91
const KNOWN_MISSING = new Set([
  '.specsmd/aidlc/skills/operations/menu.md',
  '.specsmd/aidlc/skills/operations/rollback.md',
  '.specsmd/aidlc/skills/construction/bolt-plan.md',
]);

/**
 * Whether an installed path exists once its flow is installed.
 * Paths with placeholders ({bolt_type}, *) are checked up to their directory.
 */
function resolvesWhenInstalled(installedPath: string): boolean {
  const relative = installedPath.slice('.specsmd/'.length);
  const literal = relative.split(/[{*]/)[0];
  const checked = literal === relative ? relative : literal.slice(0, literal.lastIndexOf('/') + 1);
  const [flow] = relative.split('/');
  return fs.existsSync(path.join(FLOWS_DIR, flow)) && fs.existsSync(path.join(FLOWS_DIR, checked));
}

describe('Flow Files - Installed Paths', () => {
  it('should only reference .specsmd/ paths that exist after install', async () => {
    const files = await glob('*/**/*.{md,yaml}', { cwd: FLOWS_DIR });
    const issues: string[] = [];

    for (const file of files) {
      const lines = (await fs.readFile(path.join(FLOWS_DIR, file), 'utf8')).split('\n');
      lines.forEach((line, index) => {
        for (const [match] of line.matchAll(/\.specsmd\/[\w./{}*-]+/g)) {
          const installedPath = match.replace(/\.+$/, '');
          if (KNOWN_MISSING.has(installedPath) || resolvesWhenInstalled(installedPath)) continue;
          issues.push(`flows/${file}:${index + 1}: ${installedPath}`);
        }
      });
    }

    if (issues.length > 0) {
      console.error(`\nPaths that don't exist in an installed project:\n${issues.join('\n')}`);
    }
    expect(issues).toHaveLength(0);
  });

  it('should not point agents at specsmd source paths', async () => {
    const files = await glob('*/{commands,agents,skills}/**/*.md', { cwd: FLOWS_DIR });
    const issues: string[] = [];

    for (const file of files) {
      const lines = (await fs.readFile(path.join(FLOWS_DIR, file), 'utf8')).split('\n');
      lines.forEach((line, index) => {
        if (line.includes('src/flows/')) {
          issues.push(`flows/${file}:${index + 1}: ${line.trim()}`);
        }
      });
    }

    if (issues.length > 0) {
      console.error(`\nSource paths (use .specsmd/<flow>/ instead):\n${issues.join('\n')}`);
    }
    expect(issues).toHaveLength(0);
  });
});

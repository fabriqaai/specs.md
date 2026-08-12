#!/usr/bin/env node
/**
 * SessionStart hook: injects using-specsmd so the session engages the unified flow.
 * Never breaks session start.
 */
const fs = require('fs');
const path = require('path');

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
const skillPath = path.join(pluginRoot, 'skills', 'using-specsmd', 'SKILL.md');

let body = '';
try {
  const raw = fs.readFileSync(skillPath, 'utf8');
  body = raw.replace(/^---\n[\s\S]*?\n---\n/, '');
} catch {
  process.exit(0);
}

const context = [
  '<IMPORTANT>',
  'This project uses specsmd (unified bolt flow).',
  "Below is the full content of the 'using-specsmd' skill — your introduction to working in this project. For all other specsmd skills, use the Skill tool:",
  '',
  body.trim(),
  '</IMPORTANT>',
].join('\n');

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: context,
    },
  })
);

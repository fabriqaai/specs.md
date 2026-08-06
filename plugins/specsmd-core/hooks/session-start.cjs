#!/usr/bin/env node
/**
 * SessionStart hook: injects the using-specsmd bootstrap skill verbatim so the
 * session knows to engage specsmd flow skills. Without this injection,
 * on-demand skills are easy to overlook.
 */
const fs = require('fs');
const path = require('path');

const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '..');
const skillPath = path.join(pluginRoot, 'skills', 'using-specsmd', 'SKILL.md');

let body = '';
try {
  const raw = fs.readFileSync(skillPath, 'utf8');
  // Strip YAML frontmatter; inject only the body.
  body = raw.replace(/^---\n[\s\S]*?\n---\n/, '');
} catch {
  process.exit(0); // Never break session start.
}

const context = [
  '<IMPORTANT>',
  'This project uses specsmd for spec-driven development.',
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
